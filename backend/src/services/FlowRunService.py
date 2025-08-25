from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict

from loguru import logger
from src.executors.GraphExecutor import GraphExecutor
from src.models.alchemy.flows.FlowExecutionModel import (
    FlowExecutionStatus,
)
from src.repositories.FlowRepositories import FlowRepository
from src.schemas.flowbuilder.flow_graph_schemas import FlowRunRequest


class FlowRunServiceInterface(ABC):
    """
    Flow run service interface
    """

    @abstractmethod
    def run_sync(
        self, flow_id: str, run_request: FlowRunRequest, user_id: int
    ) -> Dict[str, Any]:
        """
        Execute a flow synchronously

        Args:
            flow_id: ID of the flow to execute
            run_request: Request containing execution parameters
            user_id: ID of the user executing the flow

        Returns:
            Execution results
        """
        pass


class FlowRunService(FlowRunServiceInterface):
    """
    Flow run service implementation
    """

    def __init__(
        self,
        flow_repository: FlowRepository,
        graph_executor: GraphExecutor,
    ):
        """
        Initialize flow run service with required dependencies

        Args:
            flow_repository: Repository for flow operations
            execution_repository: Repository for execution tracking
            graph_executor: Executor for running flow graphs
        """
        self.flow_repository = flow_repository
        self.graph_executor = graph_executor

    def run_sync(
        self, flow_id: str, run_request: FlowRunRequest, user_id: int
    ) -> Dict[str, Any]:
        """
        Execute a flow synchronously

        Args:
            flow_id: ID of the flow to execute
            run_request: Request containing execution parameters
            user_id: ID of the user executing the flow

        Returns:
            Execution results
        """
        execution = None
        try:
            # Get flow definition
            flow = self.flow_repository.get_by_id(flow_id)
            if not flow:
                logger.warning(f"Flow with id {flow_id} not found")
                raise ValueError(f"Flow {flow_id} not found")

            # Prepare flow for execution
            flow_definition = flow.flow_definition
            if not flow_definition:
                raise ValueError(f"Flow {flow_id} has no definition")

            # Execute the flow using GraphExecutor
            logger.info(f"Starting synchronous execution of flow {flow_id}")

            # Update execution status to completed
            self.execution_repository.update_execution_status(
                execution.id, FlowExecutionStatus.COMPLETED, datetime.utcnow()
            )

            logger.info(f"Successfully completed execution of flow {flow_id}")
            return execution_result

        except Exception as e:
            # Update execution status to failed if execution was created
            logger.error(f"Error executing flow {flow_id}: {str(e)}")
            raise
