import asyncio
import json
import traceback
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse, StreamingResponse
from loguru import logger
from redis import Redis
from src.celery_worker.tasks.flow_execution_tasks import compile_flow, run_flow
from src.dependencies.api_key_dependency import get_api_key_service
from src.dependencies.auth_dependency import (
    auth_through_url_param,
    get_current_user,
)
from src.dependencies.flow_dep import get_flow_service
from src.dependencies.redis_dependency import get_redis_client
from src.schemas.flowbuilder.flow_graph_schemas import (
    ApiFlowRunRequest,
    CanvasFlowRunRequest,
)
from src.services.ApiKeyService import ApiKeyService
from src.services.FlowService import FlowService
from src.workers.FlowSyncWorker import FlowSyncWorker

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

        flow_graph_request = CanvasFlowRunRequest(**request_json)

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
        flow_graph_request = CanvasFlowRunRequest(**request_json)
        logger.info(
            f"👉 flow_graph_request: {flow_graph_request.model_dump_json(indent=4)}"
        )

        # Submit run task to Celery
        flow_id = flow_graph_request.flow_id
        task = run_flow.delay(_auth_user_id, flow_id, flow_graph_request.model_dump())

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
async def stream_execution(  # noqa
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
        # First, get all existing messages (if any) in correct order
        existing_messages = redis_client.lrange(queue_name, 0, -1)

        for raw_data in existing_messages:
            message = (
                raw_data.decode("utf-8") if isinstance(raw_data, bytes) else raw_data
            )
            yield f"data: {message}\n\n"

            # Check if this was the DONE message
            try:
                parsed = json.loads(message)
                if parsed.get("event") == "DONE":
                    redis_client.delete(queue_name)
                    return
            except json.JSONDecodeError:
                if message == "DONE":  # Fallback for non-JSON messages
                    redis_client.delete(queue_name)
                    return

        # Clear the list since we've sent all existing messages
        redis_client.delete(queue_name)

        # Now continue with blocking pop for new messages
        while not await request.is_disconnected():
            result = await asyncio.to_thread(redis_client.blpop, queue_name, timeout=5)
            if result:
                _, raw_data = result
                message = (
                    raw_data.decode("utf-8")
                    if isinstance(raw_data, bytes)
                    else raw_data
                )
                yield f"data: {message}\n\n"

                try:
                    parsed = json.loads(message)
                    if parsed.get("event") == "DONE":
                        break
                except json.JSONDecodeError:
                    if message == "DONE":
                        break

        redis_client.delete(queue_name)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# --- Main flow Run API ---


@flow_execution_router.post("/{flow_id}")
async def run_flow_endpoint(
    flow_id: str,
    request: Request,
    stream: bool = Query(False),
    api_key_service: ApiKeyService = Depends(get_api_key_service),
    flow_service: FlowService = Depends(get_flow_service),
):
    """
    Execute a flow with proper validation and error handling.
    """
    try:
        # Parse request JSON
        try:
            request_json = await request.json()
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in request body: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON in request body.",
            )
        except Exception as e:
            logger.error(f"Error parsing request body: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error parsing request body.",
            )

        # Validate request schema
        try:
            flow_run_request = ApiFlowRunRequest(**request_json)
        except Exception as e:
            logger.error(f"Request validation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid request format: {str(e)}",
            )

        # Extract API key from Authorization header
        headers = request.headers
        authorization_header = headers.get("Authorization")
        request_api_key = None
        if authorization_header:
            try:
                scheme, api_key = authorization_header.split(" ", 1)
                if scheme.lower() == "bearer":
                    request_api_key = api_key
            except ValueError:
                logger.warning("Invalid authorization header format")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authorization header format.",
                )

        # Create FlowSyncWorker and execute with validation
        flow_sync_worker = FlowSyncWorker()
        execution_result = await asyncio.to_thread(
            flow_sync_worker.run_flow_from_api,
            flow_id=flow_id,
            flow_run_request=flow_run_request,
            request_api_key=request_api_key,
            api_key_service=api_key_service,
            flow_service=flow_service,
            stream=stream,
        )

        return JSONResponse(
            status_code=200,
            content=execution_result.model_dump(),
        )

    except HTTPException:
        # Re-raise HTTP exceptions to preserve their status codes and details
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in flow execution for flow_id {flow_id}: {str(e)}. "
            f"traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during flow execution.",
        )
