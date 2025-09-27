import asyncio
import json
import time
import traceback
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from loguru import logger
from redis import Redis
from src.celery_worker.tasks.flow_test_tasks import (
    dispatch_batch_run_test,
    dispatch_run_test,
    run_flow_test,
)
from src.dependencies.auth_dependency import auth_through_url_param, get_current_user
from src.dependencies.flow_test_dep import get_flow_test_service
from src.dependencies.redis_dependency import get_redis_client
from src.models.alchemy.flows.FlowTestCaseRunModel import TestCaseRunStatus
from src.schemas.flows.flow_test_schemas import (
    FlowBatchTestRunRequest,
    FlowBatchTestRunResponse,
    FlowTestRunRequest,
    FlowTestRunResponse,
)
from src.services.FlowTestService import FlowTestService

flow_test_run_router = APIRouter(
    prefix="/api/flow-test-runs",
    tags=["flow_test_runs"],
)


@flow_test_run_router.post("/", response_model=FlowTestRunResponse)
async def run_single_test(
    request: FlowTestRunRequest,
    flow_test_service: FlowTestService = Depends(get_flow_test_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Run a flow test by creating a Celery task
    """
    try:
        # Verify the test case exists and the user has access to it
        test_case = flow_test_service.get_test_case_by_id(case_id=request.case_id)
        if not test_case:
            logger.warning(f"Test case with ID {request.case_id} not found")
            raise HTTPException(
                status_code=404,
                detail="Test case not found",
            )

        # NOTE: This to generate a unique task ID instead of using from celery to avoid race conditions of accessing the TestCaseRun with task_id may not be exist yet # noqa
        generated_task_id = str(uuid4())
        flow_test_service.queue_test_case_run(
            test_case_id=request.case_id, task_run_id=generated_task_id
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
    flow_test_service: FlowTestService = Depends(get_flow_test_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Run a batch of flow tests by creating a Celery task
    """
    try:
        # Verify all test cases exist and the user has access to them
        for case_id in request.case_ids:
            test_case = flow_test_service.get_test_case_by_id(case_id=case_id)
            if not test_case:
                logger.warning(f"Test case with ID {case_id} not found")
                raise HTTPException(
                    status_code=404,
                    detail=f"Test case with ID {case_id} not found",
                )

        # NOTE: This to generate a unique task ID instead of using from celery to avoid race conditions of accessing the TestCaseRun with task_id may not be exist yet # noqa
        generated_task_id = str(uuid4())

        # Queue test case runs for all cases
        for case_id in request.case_ids:
            unique_task_id = f"{generated_task_id}_{case_id}"

            flow_test_service.queue_test_case_run(
                test_case_id=case_id, task_run_id=unique_task_id
            )

        # Submit batch run task to Celery
        dispatch_batch_run_test.delay(
            generated_task_id=generated_task_id,
            user_id=auth_user_id,
            flow_id=request.flow_id,
            case_ids=request.case_ids,
        )

        logger.info(
            f"Batch flow test task submitted to Celery. (submitted_by u_id: {auth_user_id}). Task ID: {generated_task_id}. Cases: {request.case_ids}."  # noqa
        )

        return FlowBatchTestRunResponse(
            status=TestCaseRunStatus.QUEUED,
            task_id=generated_task_id,
            message="Batch flow test task has been queued.",
            case_ids=request.case_ids,
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
