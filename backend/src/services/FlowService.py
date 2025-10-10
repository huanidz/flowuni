import asyncio
from abc import ABC, abstractmethod
from typing import Optional, Tuple

from fastapi import HTTPException
from loguru import logger
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession
from src.configs.config import get_app_settings
from src.exceptions.shared_exceptions import MISMATCH_EXCEPTION, NOT_FOUND_EXCEPTION
from src.models.alchemy.flows.FlowModel import FlowModel
from src.nodes.GraphLoader import GraphLoader
from src.repositories.FlowRepositories import FlowRepository
from src.schemas.flowbuilder.flow_crud_schemas import FlowCreateRequest
from src.schemas.flows.flow_schemas import (
    FlowPatchRequest,
    GetFlowResponseItem,
)


class FlowServiceInterface(ABC):
    """
    Flow service interface
    """

    @abstractmethod
    async def get_by_user_id_paged(self, session: AsyncSession, user_id: int) -> Tuple:
        """
        Get flows by user id
        """
        pass

    @abstractmethod
    async def create_empty_flow(self, session: AsyncSession, user_id: int) -> str:
        """
        Create an empty flow for a user
        """
        pass

    @abstractmethod
    async def create_flow_with_data(
        self, session: AsyncSession, user_id: int, flow_request: FlowCreateRequest
    ) -> FlowModel:
        """
        Create a flow with optional name, description, and flow definition
        """
        pass

    @abstractmethod
    async def get_flow_detail_by_id(
        self, session: AsyncSession, flow_id: str
    ) -> FlowModel:
        """
        Get flow detail by flow id
        """
        pass

    @abstractmethod
    async def delete_flow(self, session: AsyncSession, flow_id: str):
        """
        Delete a flow by flow id
        """
        pass

    @abstractmethod
    async def save_flow_detail(
        self, session: AsyncSession, flow_request: FlowPatchRequest, user_id: int
    ) -> Optional[FlowModel]:
        """
        Save flow detail
        """
        pass

    @abstractmethod
    async def activate_flow(
        self, session: AsyncSession, flow_id: str, user_id: int
    ) -> FlowModel:
        """
        Activate a flow by flow id
        """
        pass

    @abstractmethod
    async def deactivate_flow(
        self, session: AsyncSession, flow_id: str, user_id: int
    ) -> FlowModel:
        """
        Deactivate a flow by flow id
        """
        pass


class FlowService(FlowServiceInterface):
    """
    Flow service
    """

    def __init__(self, flow_repository: FlowRepository = None):
        self.flow_repository = flow_repository or FlowRepository()

    async def get_by_user_id_paged(
        self, session: AsyncSession, user_id: int, page: int = 1, per_page: int = 10
    ) -> Tuple:
        """
        Get flows by user id
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                flows, total_items = await self.flow_repository.get_by_user_id_paged(
                    session=session, user_id=user_id, page=page, per_page=per_page
                )

                # Map to response format
                mapped_flows = [
                    GetFlowResponseItem(
                        flow_id=flow.flow_id,
                        name=flow.name,
                        description=flow.description,
                        is_active=flow.is_active,
                        created_at=flow.created_at,
                    )
                    for flow in flows
                ]

                return mapped_flows, total_items
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            logger.error(f"Error retrieving flows by user id {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    async def create_empty_flow(self, session: AsyncSession, user_id: int) -> str:
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                async with session.begin():
                    flow = await self.flow_repository.create_empty_flow(
                        session=session, user_id=user_id
                    )
                    logger.info(f"Successfully created empty flow for user {user_id}")
                    return flow.flow_id
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Error creating empty flow for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to create flow: {str(e)}"
            )

    async def create_flow_with_data(
        self, session: AsyncSession, user_id: int, flow_request: FlowCreateRequest
    ) -> FlowModel:
        """
        Create a flow with optional name, description, and flow definition
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                async with session.begin():
                    # Validate flow definition if provided
                    if flow_request.flow_definition:
                        GraphLoader.from_flow_create_request(flow_request)

                    flow = await self.flow_repository.create_flow_with_data(
                        session=session,
                        user_id=user_id,
                        name=flow_request.name,
                        description=flow_request.description,
                        flow_definition=flow_request.flow_definition,
                    )
                    logger.info(
                        f"Successfully created flow with data for user {user_id}"
                    )
                    return flow
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Error creating flow with data for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to create flow: {str(e)}"
            )

    async def get_flow_detail_by_id(
        self, session: AsyncSession, flow_id: str
    ) -> FlowModel:
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                flow = await self.flow_repository.get_by_id(
                    session=session, flow_id=flow_id
                )
                if not flow:
                    logger.warning(f"Flow with id {flow_id} not found")
                    raise NOT_FOUND_EXCEPTION
                logger.info(f"Successfully retrieved flow detail for flow {flow_id}")
                return flow
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Flow not found")
        except Exception as e:
            logger.error(f"Error retrieving flow detail for flow {flow_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    async def delete_flow(self, session: AsyncSession, flow_id: str):
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                async with session.begin():
                    await self.flow_repository.delete_flow(
                        session=session, flow_id=flow_id
                    )
                    logger.info(f"Successfully deleted flow {flow_id}")
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Flow not found")
        except Exception as e:
            logger.error(f"Error deleting flow {flow_id}: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to delete flow: {str(e)}"
            )

    async def save_flow_detail(
        self, session: AsyncSession, flow_request: FlowPatchRequest, user_id: int
    ) -> Optional[FlowModel]:
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                async with session.begin():
                    # Map to FlowModel
                    flow_model = FlowModel(
                        flow_id=flow_request.flow_id,
                        name=flow_request.name,
                        description=flow_request.description,
                        is_active=flow_request.is_active,
                        flow_definition=flow_request.flow_definition,
                    )

                    # Try get flow by flow_id
                    existing_flow = await self.flow_repository.get_by_id(
                        session=session, flow_id=flow_model.flow_id
                    )

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
                            result = await self.flow_repository.save_flow_definition(
                                session=session, flow=flow_model
                            )
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
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Flow not found")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(
                f"Error saving flow detail for user {user_id}, flow {flow_request.flow_id}: {str(e)}"
            )
            raise HTTPException(
                status_code=500, detail=f"Failed to save flow: {str(e)}"
            )

    async def activate_flow(
        self, session: AsyncSession, flow_id: str, user_id: int
    ) -> FlowModel:
        """
        Activate a flow by flow id
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                async with session.begin():
                    # Get the flow to verify ownership
                    existing_flow = await self.flow_repository.get_by_id(
                        session=session, flow_id=flow_id
                    )
                    if not existing_flow:
                        logger.warning(f"Flow with id {flow_id} not found")
                        raise NOT_FOUND_EXCEPTION

                    # Check if the user owns the flow
                    if existing_flow.user_id != user_id:
                        logger.warning(
                            f"User {user_id} attempted to activate flow {flow_id} owned by different user"
                        )
                        raise MISMATCH_EXCEPTION

                    # Activate the flow
                    result = await self.flow_repository.activate_flow(
                        session=session, flow_id=flow_id
                    )
                    logger.info(
                        f"Successfully activated flow {flow_id} for user {user_id}"
                    )
                    return result
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Flow not found")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(
                f"Error activating flow {flow_id} for user {user_id}: {str(e)}"
            )
            raise HTTPException(
                status_code=500, detail=f"Failed to activate flow: {str(e)}"
            )

    async def deactivate_flow(
        self, session: AsyncSession, flow_id: str, user_id: int
    ) -> FlowModel:
        """
        Deactivate a flow by flow id
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                async with session.begin():
                    # Get the flow to verify ownership
                    existing_flow = await self.flow_repository.get_by_id(
                        session=session, flow_id=flow_id
                    )
                    if not existing_flow:
                        logger.warning(f"Flow with id {flow_id} not found")
                        raise NOT_FOUND_EXCEPTION

                    # Check if the user owns the flow
                    if existing_flow.user_id != user_id:
                        logger.warning(
                            f"User {user_id} attempted to deactivate flow {flow_id} owned by different user"
                        )
                        raise MISMATCH_EXCEPTION

                    # Deactivate the flow
                    result = await self.flow_repository.deactivate_flow(
                        session=session, flow_id=flow_id
                    )
                    logger.info(
                        f"Successfully deactivated flow {flow_id} for user {user_id}"
                    )
                    return result
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Flow not found")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(
                f"Error deactivating flow {flow_id} for user {user_id}: {str(e)}"
            )
            raise HTTPException(
                status_code=500, detail=f"Failed to deactivate flow: {str(e)}"
            )
