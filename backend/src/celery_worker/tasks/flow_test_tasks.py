import random
from typing import Any, Dict, List, Optional

from loguru import logger
from src.celery_worker.BaseTask import BaseTask
from src.celery_worker.celery_worker import celery_app
from src.core.semaphore import acquire_user_slot_sync, release_user_slot_sync
from src.dependencies.db_dependency import get_db
from src.exceptions.graph_exceptions import GraphCompilerError
from src.models.alchemy.flows.FlowTestCaseRunModel import TestCaseRunStatus
from src.repositories.FlowTestRepository import FlowTestRepository
from src.repositories.RepositoriesContainer import RepositoriesContainer
from src.services.FlowService import FlowService
from src.services.FlowTestService import FlowTestService
from src.workers.FlowSyncWorker import FlowSyncWorker


@celery_app.task(bind=True, max_retries=None)
def dispatch_run_test(
    self, generated_task_id: str, user_id: int, flow_id: str, case_id: int
):
    """
    Task dispatcher: Kiểm tra slot và gọi task worker nếu có slot.
    Tự động retry nếu không có slot.
    """

    app_db_session = None

    try:
        app_db_session = next(get_db())
        repositories = RepositoriesContainer.auto_init_all(db_session=app_db_session)

        flow_test_repository: FlowTestRepository = repositories.flow_test_repository
        case_run_status = flow_test_repository.get_test_case_run_status(
            task_run_id=generated_task_id
        )

        if case_run_status == TestCaseRunStatus.CANCELLED:
            logger.info(f"Case {case_id} has already been cancelled.")
            return

        # Sử dụng helper function để gọi async code safely
        has_slot = acquire_user_slot_sync(user_id)

        if has_slot:
            # Có slot, gọi task xử lý thật
            # Dùng .delay() hoặc .apply_async() để không block dispatcher
            # Sử dụng task_id của dispatcher task cho task 'run_flow_test'
            run_flow_test.delay(
                task_id=generated_task_id,
                user_id=user_id,
                case_id=case_id,
                flow_id=flow_id,
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
        countdown = 60 + random.randint(-3, 3)
        raise self.retry(exc=e, countdown=countdown)
    finally:
        if app_db_session:
            app_db_session.close()


@celery_app.task(bind=True, max_retries=None)
def dispatch_batch_run_test(
    self, generated_task_id: str, user_id: int, flow_id: str, case_ids: List[int]
):
    """
    Task dispatcher for batch tests: Kiểm tra slot và gọi task worker nếu có slot.
    Sử dụng queue để pop dần các case_id khi có slot available.
    Tự động retry với những case_id còn lại nếu hết slot.
    """

    app_db_session = None

    try:
        app_db_session = next(get_db())
        repositories = RepositoriesContainer.auto_init_all(db_session=app_db_session)

        flow_test_repository: FlowTestRepository = repositories.flow_test_repository
        case_run_status = flow_test_repository.get_test_case_run_status(
            task_run_id=generated_task_id
        )

        if case_run_status == TestCaseRunStatus.CANCELLED:
            logger.info(f"Batch test cases {case_ids} has already been cancelled.")
            return

        # Tạo queue từ case_ids để pop dần
        case_queue = case_ids.copy()  # Tạo copy để không thay đổi input gốc
        processed_cases = []  # Track các case đã được xử lý

        # Pop các case từ queue cho đến khi hết slot
        while case_queue:
            # Kiểm tra slot cho user
            has_slot = acquire_user_slot_sync(user_id)

            if has_slot:
                # Có slot, pop một case từ queue
                case_id = case_queue.pop(0)  # Pop từ đầu queue (FIFO)
                processed_cases.append(case_id)

                # Tạo task_id duy nhất cho case này
                case_task_id = f"{generated_task_id}_{case_id}"

                # Gọi task xử lý cho case này
                run_flow_test.delay(
                    task_id=case_task_id,
                    user_id=user_id,
                    case_id=case_id,
                    flow_id=flow_id,
                )

                logger.info(f"Dispatched case {case_id} from batch {generated_task_id}")
            else:
                # Hết slot, break khỏi loop
                logger.info(
                    f"No more slots available for user {user_id}. "
                    f"Processed {len(processed_cases)} cases, "
                    f"remaining {len(case_queue)} cases to retry."
                )
                break

        # Nếu còn case trong queue, retry với những case còn lại
        if case_queue:
            countdown = 6 + random.randint(-3, 3)
            logger.info(
                f"Retrying batch task {generated_task_id} with {len(case_queue)} remaining cases"
            )

            # Retry với case_ids còn lại trong queue
            raise self.retry(
                countdown=countdown,
                args=(generated_task_id, user_id, flow_id, case_queue),
            )
        else:
            logger.info(
                f"Successfully dispatched all cases in batch {generated_task_id}"
            )
            return

    except Exception as e:
        # Nếu có lỗi bất ngờ, retry với toàn bộ case_ids
        logger.error(
            f"Error dispatching batch run test task {generated_task_id}: " + str(e)
        )
        countdown = 60 + random.randint(-3, 3)
        raise self.retry(exc=e, countdown=countdown)
    finally:
        if app_db_session:
            app_db_session.close()


@celery_app.task(bind=True, base=BaseTask)
def run_flow_test(
    self,
    task_id: str,
    user_id: int,
    flow_id: str,
    case_id: int,
    input_text: Optional[str] = None,
    input_metadata: Optional[Dict[str, Any]] = None,
):
    """
    Celery task that runs a flow test.

    Args:
        case_id: Test case ID
        input_text: Input text for the test
        input_metadata: Input metadata for the test

    Returns:
        Dictionary with test execution results
    """
    app_db_session = None

    try:
        import time

        logger.info(f"Starting flow test task for case_id: {case_id}")

        # Get DB session
        db_start = time.time()
        app_db_session = next(get_db())
        db_end = time.time()
        logger.info(f"Database session acquisition took: {(db_end - db_start):.3f}s")
        repositories = RepositoriesContainer.auto_init_all(db_session=app_db_session)

        # Initialize services
        flow_test_service = FlowTestService(
            test_repository=repositories.flow_test_repository,
            redis_client=None,
        )

        flow_service = FlowService(
            flow_repository=repositories.flow_repository,
        )
        flow_sync_worker = FlowSyncWorker(user_id=user_id, task_id=task_id)
        flow_sync_worker.run_flow_test(
            flow_id=flow_id,
            case_id=case_id,
            flow_service=flow_service,
            session_id=None,
            flow_test_service=flow_test_service,
        )

        return

    except GraphCompilerError as e:
        raise self.retry(
            exc=e,
            countdown=60,
            max_retries=0,  # Disables retry
        )

    except Exception as e:
        logger.error(f"Flow test failed for case_id {case_id}: {str(e)}")
        # Re-raise the exception so Celery marks the task as failed
        raise
    finally:
        if app_db_session:
            app_db_session.close()

        # Release user slot
        logger.info(f"Releasing user slot for user_id: {user_id}")
        release_user_slot_sync(user_id)
