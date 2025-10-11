import asyncio
import json
import time
import traceback
from uuid import uuid4

from celery import current_app
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from loguru import logger
from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from src.celery_worker.tasks.flow_test_tasks import (
    dispatch_run_test,
)
from src.dependencies.auth_dependency import auth_through_url_param, get_current_user
from src.dependencies.db_dependency import get_async_db
from src.dependencies.flow_test_dep import get_flow_test_service
from src.dependencies.redis_dependency import get_redis_client
from src.models.alchemy.flows.FlowTestCaseRunModel import TestCaseRunStatus
from src.schemas.flows.flow_test_schemas import (
    FlowBatchTestCancelRequest,
    FlowBatchTestCancelResponse,
    FlowBatchTestRunRequest,
    FlowBatchTestRunResponse,
    FlowTestCancelRequest,
    FlowTestCancelResponse,
    FlowTestRunRequest,
    FlowTestRunResponse,
)
from src.services.FlowTestService import FlowTestService

flow_test_run_router = APIRouter(
    prefix="/api/flow-test-runs",
    tags=["flow_test_runs"],
)


@flow_test_run_router.post("", response_model=FlowTestRunResponse)
async def run_single_test(
    request: FlowTestRunRequest,
    session: AsyncSession = Depends(get_async_db),
    flow_test_service: FlowTestService = Depends(get_flow_test_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Run a flow test by creating a Celery task
    """
    try:
        # Verify the test case exists and the user has access to it
        test_case = await flow_test_service.get_test_case_by_id(
            session=session, case_id=request.case_id
        )
        if not test_case:
            logger.warning(f"Test case with ID {request.case_id} not found")
            raise HTTPException(
                status_code=404,
                detail="Test case not found",
            )

        # Check the latest test case run status
        latest_status = await flow_test_service.get_latest_test_case_run_status(
            session=session, test_case_id=request.case_id
        )

        if str(latest_status) in (
            TestCaseRunStatus.QUEUED.value,
            TestCaseRunStatus.RUNNING.value,
        ):
            logger.warning(
                f"Test case with ID {request.case_id} already has status {latest_status}"
            )
            raise HTTPException(
                status_code=409,
                detail=f"Test case is already {latest_status.lower()}",
            )

        # NOTE: This to generate a unique task ID instead of using from celery to avoid race conditions of accessing the TestCaseRun with task_id may not be exist yet # noqa
        generated_task_id = str(uuid4())
        await flow_test_service.queue_test_case_run(
            session=session, test_case_id=request.case_id, task_run_id=generated_task_id
        )

        # Submit run task to Celery
        dispatch_run_test.delay(
            generated_task_id=generated_task_id,
            user_id=auth_user_id,
            flow_id=request.flow_id,
            case_id=request.case_id,
        )

        logger.info(
            f"Flow test task submitted to Celery. (submitted_by u_id: {auth_user_id}). Task ID: {generated_task_id}."  # noqa
        )

        return FlowTestRunResponse(
            status=TestCaseRunStatus.QUEUED,
            task_id=generated_task_id,
            message="Flow test task has been queued.",
            case_id=request.case_id,
            flow_id=request.flow_id,
        )

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error queuing flow test task ID: {generated_task_id}: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while queuing the flow test task.",
        )


@flow_test_run_router.post("/batch", response_model=FlowBatchTestRunResponse)
async def run_batch_test(
    request: FlowBatchTestRunRequest,
    session: AsyncSession = Depends(get_async_db),
    flow_test_service: FlowTestService = Depends(get_flow_test_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Run a batch of flow tests by creating a Celery task
    """
    try:
        # Verify all test cases exist and the user has access to them
        for case_id in request.case_ids:
            test_case = await flow_test_service.get_test_case_by_id(
                session=session, case_id=case_id
            )
            if not test_case:
                logger.warning(f"Test case with ID {case_id} not found")
                raise HTTPException(
                    status_code=404,
                    detail=f"Test case with ID {case_id} not found",
                )

        # Check the latest test case run status for all cases
        latest_statuses = await flow_test_service.get_latest_test_cases_run_status(
            session=session, test_case_ids=request.case_ids
        )

        # Filter out test cases that are already QUEUED or RUNNING
        valid_case_ids = []
        for case_id in request.case_ids:
            latest_status = TestCaseRunStatus(
                latest_statuses.get(case_id, TestCaseRunStatus.PENDING.value)
            )
            if str(latest_status) in (
                TestCaseRunStatus.QUEUED.value,
                TestCaseRunStatus.RUNNING.value,
            ):
                logger.warning(
                    f"Test case with ID {case_id} already has status {latest_status}, skipping"
                )
            else:
                logger.info(f"Test case is valid status: {latest_status}")
                valid_case_ids.append(case_id)

        # If no valid test cases, return empty response
        if not valid_case_ids:
            logger.info("No valid test cases to run in batch request")
            return FlowBatchTestRunResponse(
                status=TestCaseRunStatus.QUEUED,
                task_ids=[],
                message="No test cases were queued as they are already running or queued.",
                case_ids=[],
                flow_id=request.flow_id,
            )

        # NOTE: This to generate a unique task ID instead of using from celery to avoid race conditions of accessing the TestCaseRun with task_id may not be exist yet # noqa

        # Generate unique task IDs for valid cases and queue them
        generated_task_ids = []
        for case_id in valid_case_ids:
            generated_task_id = str(uuid4())
            generated_task_ids.append(generated_task_id)

            await flow_test_service.queue_test_case_run(
                session=session, test_case_id=case_id, task_run_id=generated_task_id
            )

            dispatch_run_test.delay(
                generated_task_id=generated_task_id,
                user_id=auth_user_id,
                flow_id=request.flow_id,
                case_id=case_id,
            )

        logger.info(
            f"Batch flow test tasks submitted to Celery. (submitted_by u_id: {auth_user_id}). Task IDs: {generated_task_ids}. Cases: {valid_case_ids}."  # noqa
        )

        return FlowBatchTestRunResponse(
            status=TestCaseRunStatus.QUEUED,
            task_ids=generated_task_ids,
            message="Batch flow test tasks have been queued.",
            case_ids=valid_case_ids,
            flow_id=request.flow_id,
        )

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error queuing batch flow test task ID: {generated_task_id}: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while queuing the batch flow test task.",
        )


@flow_test_run_router.get("/stream/{task_id}/events")
async def stream_events(
    request: Request,
    task_id: str,
    since_id: str = "0",
    _auth_user_id: int = Depends(auth_through_url_param),
    redis_client: Redis = Depends(get_redis_client),
    token: str = Query(None),
):
    if not token:
        raise HTTPException(status_code=403, detail="Missing access token")

    stream_name = f"test_run_events:{task_id}"

    async def event_generator():
        nonlocal since_id

        # Now continue with blocking read for new messages (like BLPOP)
        while not await request.is_disconnected():
            events = await asyncio.to_thread(
                redis_client.xread,
                streams={stream_name: since_id},
                count=5,
                block=5000,  # Match the working endpoint's 5-second timeout
            )

            if events:
                for _, messages in events:
                    for message_id, data in messages:
                        since_id = message_id

                        # Parse the inner data to check for terminal status
                        inner_data = json.loads(data.get("data", "{}"))
                        status = inner_data.get("payload", {}).get("status")

                        # Send regular update
                        payload = {
                            "event": "UPDATE",
                            "id": message_id,
                            "task_id": task_id,
                            "data": data,
                            "timestamp": time.time(),
                        }
                        yield f"id: {message_id}\n"
                        yield f"data: {json.dumps(payload)}\n\n"

                        # Check if this is a terminal status and send done event
                        terminal_statuses = [
                            "PASSED",
                            "FAILED",
                            "CANCELLED",
                            "SYSTEM_ERROR",
                        ]
                        if status in terminal_statuses:
                            # Send done event
                            done_payload = {
                                "event": "DONE",
                                "id": f"{message_id}:done",
                                "task_id": task_id,
                                "status": status,
                                "timestamp": time.time(),
                            }
                            yield f"id: {message_id}:done\n"
                            yield f"data: {json.dumps(done_payload)}\n\n"

                            # Exit the loop to stop streaming
                            redis_client.expire(stream_name, 10)
                            return

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@flow_test_run_router.post("/cancel", response_model=FlowTestCancelResponse)
async def cancel_single_test(
    request: FlowTestCancelRequest,
    session: AsyncSession = Depends(get_async_db),
    flow_test_service: FlowTestService = Depends(get_flow_test_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Cancel a running flow test by revoking its Celery task and updating the database status
    """
    try:
        # Get the test case run to verify it exists and check its current status
        test_case_run = await flow_test_service.get_test_case_run_by_task_id(
            session=session, task_run_id=request.task_id
        )

        if not test_case_run:
            logger.warning(f"Test case run with task_id {request.task_id} not found")
            raise HTTPException(
                status_code=404,
                detail="Test case run not found",
            )

        current_status = str(test_case_run.status)

        # Check if the test can be cancelled
        if current_status in [
            TestCaseRunStatus.PASSED.value,
            TestCaseRunStatus.FAILED.value,
            TestCaseRunStatus.CANCELLED.value,
            TestCaseRunStatus.SYSTEM_ERROR.value,
        ]:
            logger.info(
                f"Test case run with task_id {request.task_id} is already in terminal status: {current_status}"
            )
            return FlowTestCancelResponse(
                status=current_status,
                task_id=request.task_id,
                message=f"Test is already {current_status.lower()} and cannot be cancelled.",
                cancelled=False,
            )

        # Revoke the Celery task
        try:
            current_app.control.revoke(request.task_id, terminate=True)
            logger.info(f"Revoked Celery task {request.task_id}")
        except Exception as e:
            logger.error(f"Failed to revoke Celery task {request.task_id}: {e}")
            # Continue with database update even if Celery revocation fails

        # Update the database status to CANCELLED
        cancelled = await flow_test_service.cancel_test_case_run(
            session=session, task_run_id=request.task_id
        )

        if cancelled:
            logger.info(
                f"Successfully cancelled test case run with task_id {request.task_id} (user: {auth_user_id})"
            )
            return FlowTestCancelResponse(
                status=TestCaseRunStatus.CANCELLED.value,
                task_id=request.task_id,
                message="Test has been successfully cancelled.",
                cancelled=True,
            )
        else:
            logger.warning(
                f"Failed to cancel test case run with task_id {request.task_id}"
            )
            return FlowTestCancelResponse(
                status=current_status,
                task_id=request.task_id,
                message="Failed to cancel test. It may have already completed.",
                cancelled=False,
            )

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error cancelling test case run with task_id {request.task_id}: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while cancelling the test.",
        )


@flow_test_run_router.post("/batch/cancel", response_model=FlowBatchTestCancelResponse)
async def cancel_batch_tests(
    request: FlowBatchTestCancelRequest,
    session: AsyncSession = Depends(get_async_db),
    flow_test_service: FlowTestService = Depends(get_flow_test_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Cancel multiple running flow tests by revoking their Celery tasks and updating database status
    """
    try:
        if not request.task_ids:
            logger.warning("No task IDs provided for batch cancellation")
            return FlowBatchTestCancelResponse(
                cancelled_task_ids=[],
                failed_task_ids=[],
                message="No task IDs provided for cancellation.",
                total_cancelled=0,
                total_failed=0,
            )

        # Get all test case runs to verify they exist
        test_case_runs = (
            await flow_test_service.test_repository.get_test_case_runs_by_task_ids(
                session=session, task_run_ids=request.task_ids
            )
        )

        # Separate valid and invalid task IDs
        valid_task_ids = []
        invalid_task_ids = []

        for task_id in request.task_ids:
            if task_id in test_case_runs:
                valid_task_ids.append(task_id)
            else:
                invalid_task_ids.append(task_id)
                logger.warning(f"Test case run with task_id {task_id} not found")

        # Cancel valid test case runs
        cancellation_results = await flow_test_service.cancel_test_case_runs(
            session=session, task_run_ids=valid_task_ids
        )

        # Revoke Celery tasks for successfully cancelled tests
        cancelled_task_ids = []
        failed_task_ids = []

        for task_id, success in cancellation_results.items():
            if success:
                try:
                    current_app.control.revoke(task_id, terminate=True)
                    cancelled_task_ids.append(task_id)
                    logger.info(f"Successfully cancelled test with task_id {task_id}")
                except Exception as e:
                    logger.error(f"Failed to revoke Celery task {task_id}: {e}")
                    failed_task_ids.append(task_id)
            else:
                failed_task_ids.append(task_id)
                logger.warning(f"Failed to cancel test with task_id {task_id}")

        # Add invalid task IDs to failed list
        failed_task_ids.extend(invalid_task_ids)

        total_cancelled = len(cancelled_task_ids)
        total_failed = len(failed_task_ids)

        logger.info(
            f"Batch cancellation completed. Cancelled: {total_cancelled}, Failed: {total_failed} (user: {auth_user_id})"
        )

        return FlowBatchTestCancelResponse(
            cancelled_task_ids=cancelled_task_ids,
            failed_task_ids=failed_task_ids,
            message=f"Batch cancellation completed. {total_cancelled} tests cancelled, {total_failed} failed.",
            total_cancelled=total_cancelled,
            total_failed=total_failed,
        )

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error during batch cancellation: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred during batch cancellation.",
        )
