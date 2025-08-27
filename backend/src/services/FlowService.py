from abc import ABC, abstractmethod
from typing import Optional, Tuple

from loguru import logger
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

    @abstractmethod
    def create_empty_flow(self, user_id: int) -> str:
        """
        Create an empty flow for a user
        """
        pass

    @abstractmethod
    def get_flow_detail_by_id(self, flow_id: str) -> FlowModel:
        """
        Get flow detail by flow id
        """
        pass

    @abstractmethod
    def delete_flow(self, flow_id: str):
        """
        Delete a flow by flow id
        """
        pass

    @abstractmethod
    def save_flow_detail(
        self, flow_request: FlowPatchRequest, user_id: int
    ) -> Optional[FlowModel]:
        """
        Save flow detail
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
        try:
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
        except Exception as e:
            logger.error(f"Error retrieving flows by user id {user_id}: {str(e)}")
            raise

    def create_empty_flow(self, user_id: int) -> str:
        try:
            flow = self.flow_repository.create_empty_flow(user_id=user_id)
            logger.info(f"Successfully created empty flow for user {user_id}")
            return flow.flow_id
        except Exception as e:
            logger.error(f"Error creating empty flow for user {user_id}: {str(e)}")
            raise

    def get_flow_detail_by_id(self, flow_id: str) -> FlowModel:
        try:
            flow = self.flow_repository.get_by_id(flow_id=flow_id)
            if not flow:
                logger.warning(f"Flow with id {flow_id} not found")
                raise NOT_FOUND_EXCEPTION
            logger.info(f"Successfully retrieved flow detail for flow {flow_id}")
            return flow
        except Exception as e:
            logger.error(f"Error retrieving flow detail for flow {flow_id}: {str(e)}")
            raise

    def delete_flow(self, flow_id: str):
        try:
            self.flow_repository.delete_flow(flow_id=flow_id)
            logger.info(f"Successfully deleted flow {flow_id}")
        except Exception as e:
            logger.error(f"Error deleting flow {flow_id}: {str(e)}")
            raise

    def save_flow_detail(
        self, flow_request: FlowPatchRequest, user_id: int
    ) -> Optional[FlowModel]:
        try:
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
                # If it exists, check if its user_id is the same as owner
                if existing_flow.user_id != user_id:
                    logger.warning(
                        f"User {user_id} attempted to modify flow {flow_model.flow_id} owned by different user"
                    )
                    raise MISMATCH_EXCEPTION
                else:
                    # If it exists, update it
                    flow_model.user_id = user_id
                    result = self.flow_repository.save_flow_definition(flow=flow_model)
                    logger.info(
                        f"Successfully updated flow {flow_model.flow_id} for user {user_id}"
                    )
                    return result
            else:
                # If it doesn't exist, create it
                logger.warning(
                    f"Flow with id {flow_model.flow_id} not found during save operation"
                )
                raise NOT_FOUND_EXCEPTION
        except Exception as e:
            logger.error(
                f"Error saving flow detail for user {user_id}, flow {flow_request.flow_id}: {str(e)}"
            )
            raise
