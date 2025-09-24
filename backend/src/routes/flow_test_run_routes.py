import json
import time
import traceback
from typing import Any, AsyncGenerator, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from loguru import logger
from redis import Redis
from src.celery_worker.tasks.flow_test_tasks import run_flow_test
from src.dependencies.auth_dependency import auth_through_url_param, get_current_user
from src.dependencies.flow_test_dep import get_flow_test_service
from src.dependencies.redis_dependency import get_redis_client
from src.models.alchemy.flows.FlowTestCaseRunModel import TestCaseRunStatus
from src.schemas.flows.flow_test_schemas import FlowTestRunRequest, FlowTestRunResponse
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

        # Submit run task to Celery
        task = run_flow_test.delay(
            case_id=request.case_id,
            input_text=request.input_text,
            input_metadata=request.input_metadata,
        )

        logger.info(
            f"Flow test task submitted to Celery. (submitted_by u_id: {auth_user_id}). Task ID: {task.id}"  # noqa
        )

        return FlowTestRunResponse(
            status=TestCaseRunStatus.QUEUED,
            task_id=task.id,
            message="Flow test task has been queued.",
            case_id=request.case_id,
            flow_id=request.flow_id,
        )

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error queuing flow test task: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while queuing the flow test task.",
        )


@flow_test_run_router.get("/stream/{task_id}/events")
async def stream_events(
    request: Request,
    task_id: str,
    since_id: str = "0",  # or "$" if you only want new events
    _auth_user_id: int = Depends(auth_through_url_param),
    redis_client: Redis = Depends(get_redis_client),
    token: str = Query(None),
):
    if not token:
        raise HTTPException(status_code=403, detail="Missing access token")

    stream_name = f"test_run_events:{task_id}"

    async def event_generator():
        nonlocal since_id
        yield "retry: 3000\n\n"  # tell browser: wait 3s before reconnect

        while not await request.is_disconnected():
            events = redis_client.xread(
                streams={stream_name: since_id},
                count=1,  # batch a few
                block=2000,  # 1s long-poll
            )

            if events:
                for _, messages in events:
                    for message_id, data in messages:
                        since_id = message_id  # ✅ advance cursor
                        payload = {
                            "event": "UPDATE",  # TODO: Consistent the name to avoid magic string # noqa
                            "id": message_id,
                            "task_id": task_id,
                            "data": data,
                            "timestamp": time.time(),
                        }
                        yield f"id: {message_id}\n"
                        yield f"data: {json.dumps(payload)}\n\n"
            else:
                # Expire the cursor
                redis_client.expire(stream_name, 5)

                # heartbeat so FE knows connection is alive
                yield f"""data: {
                    json.dumps(
                        {
                            "event": "DONE",
                            "task_id": task_id,
                            "timestamp": time.time(),
                            "data": {},
                            "id": since_id,
                        }
                    )
                }\n\n"""  # TODO: Consistent the name to avoid magic string # noqa

    return StreamingResponse(event_generator(), media_type="text/event-stream")
