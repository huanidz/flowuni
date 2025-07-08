from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from typing import List
from datetime import datetime

from src.schemas.flowbuilder.flow_graph_schemas import FlowGraphRequest

from src.nodes.GraphLoader import GraphLoader
from src.nodes.GraphCompiler import GraphCompiler

from loguru import logger

flow_execution_router = APIRouter(
    prefix="/api/flow_execution",
    tags=["flow_execution"],
)

# ✅ Idiomatic FastAPI approach
@flow_execution_router.post("/compile")
async def compile_flow(request: Request):
    """
    Receives, validates, and processes a flow graph from the frontend.
    """
    try:

        request_json = await request.json()
        flow_graph_request: FlowGraphRequest =  FlowGraphRequest(**request_json)

        # Load graph
        G = GraphLoader.from_request(flow_graph_request)

        # Compile graph
        compiler = GraphCompiler(graph=G)
        compiler.compile()
        compiler.debug_print_plan()

        # The request body is automatically parsed and validated into flow_graph_request
        logger.info("Successfully received and validated flow graph request.")
        # logger.debug(f"Received data: {flow_graph_request.model_dump_json(indent=2)}")

        # --- YOUR COMPILATION LOGIC GOES HERE ---
        # This is where you would:
        # 1. Validate the graph's structure (e.g., check for unconnected nodes).
        # 2. Convert the graph into an executable format.
        # 3. Save the compiled flow to a database or cache.
        #
        # For this example, we'll just acknowledge receipt.
        # -----------------------------------------

        # Return a success response
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": "Flow compiled successfully.",
                "received_at": datetime.utcnow().isoformat(),
                "node_count": len(flow_graph_request.nodes),
                "edge_count": len(flow_graph_request.edges),
            }
        )
    except Exception as e:
        # This will catch errors from your compilation logic
        logger.error(f"An unexpected error occurred during compilation: {e}")
        raise HTTPException(
            status_code=500, 
            detail="An internal error occurred while compiling the flow."
        )