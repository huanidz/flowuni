from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from typing import List
from datetime import datetime

from src.schemas.flowbuilder.flow_graph_schemas import FlowGraphRequest

from loguru import logger

flow_execution_router = APIRouter(
    prefix="/api/flow_execution",
    tags=["flow_execution"],
)

@flow_execution_router.post("/compile")
async def compile_flow(request: Request):
    flow_grahp_request: FlowGraphRequest = await FlowGraphRequest(**request.json())
    logger.info(f"Received flow graph request: {flow_grahp_request.model_dump_json(indent=2)}")
    pass