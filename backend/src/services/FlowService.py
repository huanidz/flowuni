from abc import ABC, abstractmethod
from typing import Optional, Tuple

from src.exceptions.shared_exceptions import MISMATCH_EXCEPTION, NOT_FOUND_EXCEPTION
from src.models.alchemy.flows.FlowModel import FlowModel
from src.repositories.FlowRepositories import FlowRepository
from src.schemas.flows.flow_schemas import FlowPatchRequest, GetFlowResponseItem


class FlowServiceInterface(ABC):
    """
    Flow service interface
    """

    @abstractmethod
    def get_by_user_id_paged(self, user_id: int) -> Tuple:
        """
        Get flows by user id
        """
        pass


class FlowService(FlowServiceInterface):
    """
    Flow service
    """

    def __init__(self, flow_repository: FlowRepository):
        self.flow_repository = flow_repository

    def get_by_user_id_paged(
        self, user_id: int, page: int = 1, per_page: int = 10
    ) -> Tuple:
        """
        Get flows by user id
        """

        flows, total_items = self.flow_repository.get_by_user_id_paged(
            user_id=user_id, page=page, per_page=per_page
        )

        # Map to response format
        mapped_flows = [
            GetFlowResponseItem(
                flow_id=flow.flow_id,
                name=flow.name,
                description=flow.description,
                is_active=flow.is_active,
            )
            for flow in flows
        ]

        return mapped_flows, total_items

    def create_empty_flow(self, user_id: int) -> str:
        flow = self.flow_repository.create_empty_flow(user_id=user_id)
        return flow.flow_id

    def get_flow_detail_by_id(self, flow_id: str) -> FlowModel:
        flow = self.flow_repository.get_by_id(flow_id=flow_id)
        return flow

    def delete_flow(self, flow_id: str):
        self.flow_repository.delete_flow(flow_id=flow_id)

    def save_flow_detail(
        self, flow_request: FlowPatchRequest, user_id: int
    ) -> Optional[FlowModel]:
        # Map to FlowModel
        flow_model = FlowModel(
            flow_id=flow_request.flow_id,
            name=flow_request.name,
            description=flow_request.description,
            is_active=flow_request.is_active,
            flow_definition=flow_request.flow_definition,
        )

        # Try get flow by flow_id
        existing_flow = self.flow_repository.get_by_id(flow_id=flow_model.flow_id)

        if existing_flow:
            # If it exists, check if its flow_id is the same of owner
            if existing_flow.user_id != user_id:
                raise MISMATCH_EXCEPTION
            else:
                # If it exists, update it
                flow_model.user_id = user_id
                return self.flow_repository.save_flow_definition(flow=flow_model)
        else:
            # If it doesn't exist, create it
            raise NOT_FOUND_EXCEPTION
