from abc import ABC, abstractmethod
from typing import List

from src.models.alchemy.flows.FlowModel import FlowModel
from src.repositories.FlowRepositories import FlowRepository
from src.schemas.flows.flow_schemas import GetFlowResponse, GetFlowResponseItem


class FlowServiceInterface(ABC):
    """
    Flow service interface
    """

    @abstractmethod
    def get_by_user_id(self, user_id: int) -> List[str]:
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
    ) -> GetFlowResponse:
        """
        Get flows by user id
        """

        flows: List[FlowModel] = self.flow_repository.get_by_user_id_paged(
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

        return GetFlowResponse(data=mapped_flows)
