from typing import Dict

from src.celery_worker.celery_worker import celery_app
from src.executors.GraphExecutor import GraphExecutor
from src.nodes.GraphCompiler import GraphCompiler
from src.nodes.GraphLoader import GraphLoader
from src.schemas.flowbuilder.flow_graph_schemas import FlowGraphRequest


@celery_app.task
def compile_flow(flow_id: str, flow_graph_request_dict: Dict):
    flow_graph_request = FlowGraphRequest(**flow_graph_request_dict)
    G = GraphLoader.from_request(flow_graph_request)

    compiler = GraphCompiler(graph=G)
    compiler.compile()

    return {"status": "compiled", "flow_id": flow_id}


@celery_app.task
def run_flow(flow_id: str, flow_graph_request_dict: Dict, need_compile: bool = True):
    flow_graph_request = FlowGraphRequest(**flow_graph_request_dict)
    G = GraphLoader.from_request(flow_graph_request)

    # Compile execution plan
    compiler = GraphCompiler(graph=G)
    execution_plan = compiler.compile()

    executor = GraphExecutor(graph=G, execution_plan=execution_plan)
    executor.prepare()
    executor.execute()

    return {"status": "executed", "flow_id": flow_id}
