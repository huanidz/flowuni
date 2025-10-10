import random
import signal
import sys
import time
from datetime import datetime

from celery.exceptions import SoftTimeLimitExceeded
from loguru import logger
from src.celery_worker.BaseTask import BaseTask
from src.celery_worker.celery_worker import celery_app
from src.core.semaphore import acquire_user_slot_sync, release_user_slot_sync
from src.dependencies.db_dependency import AsyncSessionLocal, get_db
from src.exceptions.graph_exceptions import GraphCompilerError
from src.models.alchemy.flows.FlowTestCaseRunModel import TestCaseRunStatus
from src.repositories.FlowRepositories import FlowRepository
from src.repositories.FlowTestRepository import FlowTestRepository
from src.repositories.RepositoriesContainer import RepositoriesContainer
from src.services.FlowService import FlowService
from src.services.FlowTestService import FlowTestService
from src.workers.FlowAsyncWorker import FlowAsyncWorker


@celery_app.task(bind=True, max_retries=None, time_limit=3600)
async def dispatch_run_test(
    self, generated_task_id: str, user_id: int, flow_id: str, case_id: int
):
    """
    Task dispatcher: Kiểm tra slot và gọi task worker nếu có slot.
    Tự động retry nếu không có slot.
    """

    try:
        async with AsyncSessionLocal() as db_session:
            flow_test_service = FlowTestService(
                test_repository=FlowTestRepository(),
            )
            latest_test_case_run = await flow_test_service.get_test_case_run_by_task_id(
                session=db_session,
                task_run_id=generated_task_id,
            )
            case_run_status = latest_test_case_run.status

            if case_run_status == TestCaseRunStatus.CANCELLED:
                logger.info(f"Case {case_id} has already been cancelled.")
                return

            # Sử dụng helper function để gọi async code safely
            has_slot = acquire_user_slot_sync(user_id)

            if has_slot:
                # Có slot, gọi task xử lý thật
                # Dùng .delay() hoặc .apply_async() để không block dispatcher
                # Sử dụng task_id của dispatcher task cho task 'run_flow_test'
                run_flow_test.apply_async(
                    kwargs={
                        "task_id": generated_task_id,
                        "user_id": user_id,
                        "case_id": case_id,
                        "flow_id": flow_id,
                    },
                    task_id=generated_task_id,  # Force Celery to use your generated_task_id
                )
                return
            else:
                countdown = 6 + random.randint(-3, 3)
                # Hết slot, retry sau 10 giây
                # Celery sẽ tự động đưa task này về queue
                raise self.retry(countdown=countdown)

    except Exception as e:
        # Nếu có lỗi bất ngờ, retry
        logger.error(f"Error dispatching run test task {generated_task_id}: " + str(e))
        return


@celery_app.task(bind=True, base=BaseTask, time_limit=3600, soft_time_limit=3540)
async def run_flow_test(  # noqa: C901
    self,
    task_id: str,
    user_id: int,
    flow_id: str,
    case_id: int,
):
    """
    Celery task that runs a flow test.

    Args:
        case_id: Test case ID

    Returns:
        Dictionary with test execution results
    """
    cleanup_done = False

    async def emergency_cleanup(signum, frame):
        """Runs when SIGTERM is received"""
        nonlocal cleanup_done

        if cleanup_done:
            return

        logger.warning(f"Task {task_id} received termination signal, cleaning up...")

        try:
            async with AsyncSessionLocal() as db_session:
                flow_test_service = FlowTestService(
                    test_repository=FlowTestRepository(),
                )
                await flow_test_service.update_test_case_run(
                    session=db_session,
                    run_id=task_id,
                    status=TestCaseRunStatus.CANCELLED,
                    finished_at=datetime.now(),
                )

        except Exception as e:
            logger.error(f"Error in emergency cleanup: {e}")
        finally:
            release_user_slot_sync(user_id)

        try:
            release_user_slot_sync(user_id)
        except Exception as e:
            logger.error(f"Error releasing user slot: {e}")

        cleanup_done = True
        logger.info(f"Emergency cleanup completed for task {task_id}")

        # Exit immediately
        sys.exit(0)

    # Register signal handler
    signal.signal(signal.SIGTERM, emergency_cleanup)

    try:
        logger.info(f"Starting flow test task for case_id: {case_id}")

        flow_async_worker = FlowAsyncWorker(user_id=user_id, task_id=task_id)

        # The worker now handles session management internally
        await flow_async_worker.run_flow_test(
            flow_id=flow_id,
            case_id=case_id,
            session_id=None,
        )

        return

    except GraphCompilerError as e:
        raise self.retry(
            exc=e,
            countdown=2,
            max_retries=0,  # Disables retry
        )
    except SoftTimeLimitExceeded:
        logger.warning(
            f"Task {task_id} approaching time limit, attempting graceful shutdown"
        )
        # Do quick cleanup
        raise
    except SystemExit:
        # Let the signal handler's sys.exit() work
        raise
    except Exception as e:
        logger.error(f"Flow test failed for case_id {case_id}: {str(e)}")
        # Re-raise the exception so Celery marks the task as failed
    finally:
        # Release user slot
        logger.info(f"Releasing user slot for user_id: {user_id}")
        release_user_slot_sync(user_id)
