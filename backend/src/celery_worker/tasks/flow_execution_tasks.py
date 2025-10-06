import os
from typing import Dict

import psutil
from loguru import logger
from redis import Redis
from src.celery_worker.celery_worker import celery_app
from src.configs.config import get_settings
from src.dependencies.db_dependency import get_db
from src.executors.ExecutionContext import ExecutionContext
from src.executors.ExecutionEventPublisher import (
    ExecutionControl,
    ExecutionEventPublisher,
)
from src.executors.GraphExecutor import GraphExecutor
from src.nodes.GraphCompiler import GraphCompiler
from src.nodes.GraphLoader import GraphLoader
from src.repositories.RepositoriesContainer import RepositoriesContainer
from src.schemas.flowbuilder.flow_graph_schemas import CanvasFlowRunRequest


def log_memory(stage: str):
    """Logs current memory usage of this process."""
    process = psutil.Process(os.getpid())
    mem = process.memory_info()
    rss_mb = mem.rss / 1024 / 1024  # Resident memory (actual RAM)
    vms_mb = mem.vms / 1024 / 1024  # Virtual memory
    logger.info(f"[MEMORY] {stage}: RSS={rss_mb:.2f} MB | VMS={vms_mb:.2f} MB")


@celery_app.task
def compile_flow(flow_id: str, flow_graph_request_dict: Dict):
    log_memory("Start compile_flow")

    flow_graph_request = CanvasFlowRunRequest(**flow_graph_request_dict)
    log_memory("After CanvasFlowRunRequest init")

    G = GraphLoader.from_request(flow_graph_request)
    log_memory("After GraphLoader.from_request")

    compiler = GraphCompiler(graph=G)
    compiler.compile()
    log_memory("After GraphCompiler.compile")

    logger.success(f"Flow {flow_id} compiled successfully.")
    return {"status": "compiled", "flow_id": flow_id}


@celery_app.task(bind=True)
def run_flow(
    self,
    user_id: int,
    flow_id: str,
    flow_graph_request_dict: Dict,
    enable_debug: bool = True,
):
    """
    Synchronous Celery task that runs graph execution with memory debug logs.
    """
    app_db_session = None
    try:
        log_memory("Task start")

        app_settings = get_settings()
        app_db_session = next(get_db())
        repositories = RepositoriesContainer.auto_init_all(db_session=app_db_session)

        logger.info(f"Starting flow execution task for flow_id: {flow_id}")
        log_memory("After DB + repositories init")

        flow_graph_request = CanvasFlowRunRequest(**flow_graph_request_dict)
        log_memory("After CanvasFlowRunRequest init")

        logger.info("Loading graph from request")
        G = GraphLoader.from_request(flow_graph_request)
        log_memory("After GraphLoader.from_request")

        logger.info("Compiling execution plan")
        compiler = GraphCompiler(graph=G, remove_standalone=False)
        execution_plan = compiler.compile()
        log_memory("After GraphCompiler.compile")

        redis_client = Redis(
            host=app_settings.REDIS_HOST,
            port=app_settings.REDIS_PORT,
            db=app_settings.REDIS_DB,
            decode_responses=True,
        )
        exe_event_publisher = ExecutionEventPublisher(
            user_id=user_id, task_id=self.request.id, redis_client=redis_client
        )

        execution_context = ExecutionContext(
            run_id=self.request.id,
            flow_id=flow_id,
            session_id=flow_graph_request.session_id,
            user_id=None,
            metadata={},
            repositories=repositories,
        )
        exe_control = ExecutionControl(
            start_node=flow_graph_request.start_node, scope=flow_graph_request.scope
        )
        log_memory("After ExecutionContext + Control setup")

        logger.info(f"Creating executor with {len(execution_plan)} layers")
        executor = GraphExecutor(
            graph=G,
            execution_plan=execution_plan,
            execution_event_publisher=exe_event_publisher,
            execution_context=execution_context,
            execution_control=exe_control,
            enable_debug=enable_debug,
        )
        log_memory("After GraphExecutor init")

        logger.info("Starting graph execution")
        execution_result = executor.execute()
        log_memory("After executor.execute()")

        logger.success(f"Flow execution completed successfully for flow_id: {flow_id}")
        return {
            "status": "executed",
            "flow_id": flow_id,
            "execution_stats": execution_result,
        }

    except Exception as e:
        logger.exception(f"Flow execution failed for flow_id {flow_id}: {e}")
        raise
    finally:
        if app_db_session:
            app_db_session.close()
        log_memory("Task end (after DB session close)")
