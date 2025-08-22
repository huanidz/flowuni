import asyncio
import traceback
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse, StreamingResponse
from loguru import logger
from redis import Redis
from src.celery_worker.tasks.flow_execution_tasks import compile_flow, run_flow
from src.dependencies.api_key_dependency import get_api_key_service
from src.dependencies.auth_dependency import (
    auth_through_url_param,
    get_current_user,
)
from src.dependencies.redis_dependency import get_redis_client
from src.exceptions.auth_exceptions import UNAUTHORIZED_EXCEPTION
from src.schemas.flowbuilder.flow_graph_schemas import (
    FlowGraphRequest,
    FlowRunRequest,
)
from src.services.ApiKeyService import ApiKeyService

flow_execution_router = APIRouter(
    prefix="/api/exec",
    tags=["exec"],
)


@flow_execution_router.post("/compile")
async def compile_flow_endpoint(
    request: Request,
    _auth_user_id: int = Depends(get_current_user),
):
    """
    Receives, validates, and queues a flow graph compilation task.
    """
    try:
        request_json = await request.json()

        logger.info(f"Compilation request received: {request_json}")

        flow_graph_request = FlowGraphRequest(**request_json)

        # Submit compile task to Celery
        task = compile_flow.delay("flow-compile", flow_graph_request.model_dump())

        logger.info(
            f"Compilation task submitted to Celery. (submitted_by u_id: {_auth_user_id})"
        )

        return JSONResponse(
            status_code=202,
            content={
                "status": "queued",
                "task_id": task.id,
                "message": "Flow compilation task has been queued.",
                "received_at": datetime.utcnow().isoformat(),
                "node_count": len(flow_graph_request.nodes),
                "edge_count": len(flow_graph_request.edges),
            },
        )

    except Exception as e:
        logger.error(
            f"Error queuing compilation task: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while queuing the compilation task.",
        )


@flow_execution_router.post("/execute")
async def execute_flow_endpoint(
    request: Request, _auth_user_id: int = Depends(get_current_user)
):
    """
    Receives, validates, and queues a flow graph execution task.
    """
    try:
        request_json = await request.json()
        flow_graph_request = FlowGraphRequest(**request_json)

        # Submit run task to Celery
        task = run_flow.delay("flow-execute", flow_graph_request.model_dump())

        logger.info(
            f"Execution task submitted to Celery. (submitted_by u_id: {_auth_user_id}). Task ID: {task.id}"  # noqa: E501
        )

        return JSONResponse(
            status_code=202,
            content={
                "status": "queued",
                "task_id": task.id,
                "message": "Flow execution task has been queued.",
                "received_at": datetime.utcnow().isoformat(),
                "node_count": len(flow_graph_request.nodes),
                "edge_count": len(flow_graph_request.edges),
            },
        )

    except Exception as e:
        logger.error(f"Error queuing execution task: {e}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while queuing the execution task.",
        )


@flow_execution_router.get("/stream/{task_id}")
async def stream_execution(
    task_id: str,
    request: Request,
    _auth_user_id: int = Depends(auth_through_url_param),
    redis_client: Redis = Depends(get_redis_client),
    token: str = Query(None),
):
    """
    Streams events for a specific task_id using Redis List (BLPOP).
    SSE format is used for real-time updates.
    """

    if not token:
        raise HTTPException(status_code=403, detail="Missing access token")

    queue_name = task_id  # Optionally: f"task:{task_id}"

    async def event_generator():
        while not await request.is_disconnected():
            # Wait (blocking) for the next message from Redis
            result = await asyncio.to_thread(redis_client.blpop, queue_name, timeout=5)

            if result:
                _, raw_data = result
                message = (
                    raw_data.decode("utf-8")
                    if isinstance(raw_data, bytes)
                    else raw_data
                )
                yield f"data: {message}\n\n"
                if message == "DONE":
                    break

        # Optional: Clean up the Redis list
        redis_client.delete(queue_name)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# --- Main flow Run API ---


@flow_execution_router.post("/{flow_id}")
async def run_flow_endpoint(
    flow_id: str,
    request: Request,
    stream: bool = Query(False),
    api_key_service: ApiKeyService = Depends(get_api_key_service),
):
    request_json = await request.json()
    flow_run_request = FlowRunRequest(**request_json)

    # Access to headers
    headers = request.headers

    authorization_header = headers.get("Authorization")
    if authorization_header:
        request_api_key = authorization_header.split(" ")[1]
    else:
        request_api_key = None

    # Validate API key
    if request_api_key:
        api_key_model = api_key_service.validate_key(request_api_key)
        if not api_key_model:
            raise UNAUTHORIZED_EXCEPTION
    else:
        raise UNAUTHORIZED_EXCEPTION

    if stream:
        raise HTTPException(
            status_code=400,
            detail="Flow run is not support right now.",
        )

    raise HTTPException(
        status_code=400,
        detail="Flow run is not support right now.",
    )
