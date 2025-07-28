import asyncio
import traceback
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from loguru import logger
from redis import Redis
from src.celery_worker.tasks.flow_execution_tasks import compile_flow, run_flow
from src.dependencies.auth_dependency import get_current_user
from src.dependencies.redis_dependency import get_redis_client
from src.schemas.flowbuilder.flow_graph_schemas import FlowGraphRequest

flow_execution_router = APIRouter(
    prefix="/api/flow_execution",
    tags=["flow_execution"],
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


@flow_execution_router.post("/stream/{task_id}")
async def stream_execution(
    task_id: str,
    request: Request,
    _auth_user_id: int = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis_client),
):
    """
    Receives, validates, and queues a flow graph execution task.
    """

    loop = asyncio.get_event_loop()
    queue_name = task_id

    async def event_generator():
        while True:
            if await request.is_disconnected():
                break

            result = await loop.run_in_executor(None, redis_client.blpop, queue_name, 5)
            if result:
                _, data = result
                if isinstance(data, bytes):
                    data = data.decode("utf-8")
                yield f"data: {data}\n\n"
                if data == "DONE":
                    redis_client.delete(task_id)
                    break

    return StreamingResponse(event_generator(), media_type="text/event-stream")
