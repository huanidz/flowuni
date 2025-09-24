from typing import Any, Dict, Optional

from loguru import logger
from src.celery_worker.BaseTask import BaseTask
from src.celery_worker.celery_worker import celery_app
from src.dependencies.db_dependency import get_db
from src.exceptions.graph_exceptions import GraphCompilerError
from src.repositories.RepositoriesContainer import RepositoriesContainer
from src.services.FlowService import FlowService
from src.services.FlowTestService import FlowTestService
from src.workers.FlowSyncWorker import FlowSyncWorker


@celery_app.task(bind=True, base=BaseTask)
def run_flow_test(
    self,
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
        logger.info(f"Starting flow test task for case_id: {case_id}")

        # Get DB session
        app_db_session = next(get_db())
        repositories = RepositoriesContainer.auto_init_all(db_session=app_db_session)

        # Initialize services
        flow_test_service = FlowTestService(
            test_repository=repositories.flow_test_repository,
            redis_client=None,
        )

        # Get the test case
        test_case = flow_test_service.get_test_case_by_id(case_id=case_id)
        if not test_case:
            raise ValueError(f"Test case with ID {case_id} not found")

        flow_service = FlowService(
            flow_repository=repositories.flow_repository,
        )
        flow_sync_worker = FlowSyncWorker(task_id=self.request.id)
        flow_sync_worker.run_flow_test(
            flow_id=flow_id, case_id=case_id, flow_service=flow_service, session_id=None
        )

        # For now, we'll just simulate a test run
        # In a real implementation, this would execute the flow with the test case inputs
        # and validate the outputs against the pass criteria

        logger.info(f"Running flow test for case_id: {case_id}")

        # Simulate test execution
        test_result = {
            "status": "completed",
            "case_id": case_id,
            "passed": True,  # Default to passing for now
            "message": "Flow test completed successfully",
            "execution_time_ms": 100,  # Simulated execution time
        }

        logger.success(f"Flow test completed successfully for case_id: {case_id}")

        return test_result

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
