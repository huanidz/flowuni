import math
import re
from typing import List, Optional, Tuple
from uuid import uuid4

from loguru import logger
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.orm import Session
from src.models.alchemy.flows.FlowModel import FlowModel
from src.repositories.BaseRepository import BaseRepository


class FlowRepository(BaseRepository):
    """
    Flow repository
    """

    def __init__(self, db_session: Session):
        super().__init__(db_session=db_session)
        logger.info("FlowRepository initialized.")

    def get_all_paged(self, page: int = 1, per_page: int = 10) -> List[FlowModel]:
        """
        Get all flows
        """
        try:
            flows = (
                self.db_session.query(FlowModel)
                .offset((page - 1) * per_page)
                .limit(per_page)
                .all()
            )
            logger.info(
                f"Retrieved {len(flows)} flows for page {page}, per_page {per_page}."
            )
            return flows
        except Exception as e:
            logger.error(f"Error retrieving all flows paged: {e}")
            self.db_session.rollback()
            raise e

    def get_by_id(self, flow_id: str) -> Optional[FlowModel]:
        """
        Get flow by id
        """
        try:
            flow = self.db_session.query(FlowModel).filter_by(flow_id=flow_id).first()
            if flow:
                logger.info(f"Retrieved flow with ID: {flow_id}")
            else:
                logger.info(f"Flow with ID: {flow_id} not found.")
            return flow
        except Exception as e:
            logger.error(f"Error retrieving flow by ID {flow_id}: {e}")
            self.db_session.rollback()
            raise e

    def get_by_user_id(self, user_id: int) -> List[FlowModel]:
        """
        Get flows by user id
        """
        try:
            flows = self.db_session.query(FlowModel).filter_by(user_id=user_id).all()
            logger.info(f"Retrieved {len(flows)} flows for user ID: {user_id}.")
            return flows
        except Exception as e:
            logger.error(f"Error retrieving flows by user ID {user_id}: {e}")
            self.db_session.rollback()
            raise e

    def get_by_user_id_paged(
        self, user_id: int, page: int = 1, per_page: int = 10
    ) -> Tuple[List[FlowModel], int]:
        """
        Returns a tuple of (flows on this page, total matching flows)
        """
        try:
            # 1) total count
            total_items = (
                self.db_session.query(func.count(FlowModel.flow_id))
                .filter_by(user_id=user_id)
                .scalar()
            )

            # 2) paged items
            flows = (
                self.db_session.query(FlowModel)
                .filter_by(user_id=user_id)
                .offset((page - 1) * per_page)
                .limit(per_page)
                .all()
            )

            total_pages = math.ceil(total_items / per_page) if per_page else 0

            logger.info(
                f"User {user_id} – page {page}/{total_pages}: "
                f"returned {len(flows)} of {total_items} total flows."
            )
            # return both page of flows and metadata
            return flows, total_items

        except Exception as e:
            logger.error(f"Error retrieving flows by user ID {user_id}: {e}")
            self.db_session.rollback()
            raise

    def create_empty_flow(self) -> FlowModel:
        """
        Create a new flow with auto-incremented like 'New Flow', 'New Flow (1)', etc.
        """
        try:
            base_name = "New Flow"

            # Fetch all existing names that start with 'New Flow'
            existing_names = (
                self.db_session.query(FlowModel.name)
                .filter(FlowModel.name.ilike(f"{base_name}%"))
                .all()
            )

            # Extract just the name strings from the result
            existing_names = [name[0] for name in existing_names]

            # Find the next available number
            used_numbers = set()

            pattern = re.compile(rf"^{re.escape(base_name)}(?: \((\d+)\))?$")
            for name in existing_names:
                match = pattern.match(name)
                if match:
                    num = match.group(1)
                    used_numbers.add(int(num) if num else 0)

            # Find the lowest unused number
            next_number = 0
            while next_number in used_numbers:
                next_number += 1

            # Generate the name
            if next_number == 0:
                name = base_name
            else:
                name = f"{base_name} ({next_number})"

            # Create the flow
            flow_id = str(uuid4())
            flow = FlowModel(flow_id=flow_id, name=name, description="")
            self.db_session.add(flow)
            self.db_session.commit()
            self.db_session.refresh(flow)

            logger.info(f"Created new flow with name: '{name}' and ID: {flow.flow_id}")
            return flow

        except IntegrityError as e:
            self.db_session.rollback()
            logger.error(f"Integrity error when creating flow: {e}")
            raise ValueError("Flow already exists.") from e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error creating flow: {e}")
            raise e

    def add_flow(self, flow: FlowModel) -> FlowModel:
        """
        Add flow
        """
        try:
            self.db_session.add(flow)
            self.db_session.commit()
            self.db_session.refresh(flow)
            logger.info(f"Added new flow with ID: {flow.flow_id}")
            return flow
        except IntegrityError as e:
            self.db_session.rollback()
            logger.error(
                f"Integrity error when adding flow with ID {flow.flow_id}: {e}"
            )
            raise ValueError(f"Flow with ID {flow.flow_id} already exists.") from e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error adding flow with ID {flow.flow_id}: {e}")
            raise e

    def update_flow(self, flow: FlowModel) -> FlowModel:
        """
        Update flow
        """
        try:
            # Check if the flow exists before merging
            existing_flow = (
                self.db_session.query(FlowModel).filter_by(flow_id=flow.flow_id).first()
            )
            if not existing_flow:
                logger.warning(
                    f"Attempted to update non-existent flow with ID: {flow.flow_id}"
                )
                raise NoResultFound(f"Flow with ID {flow.flow_id} not found.")

            self.db_session.merge(flow)
            self.db_session.commit()
            self.db_session.refresh(flow)
            logger.info(f"Updated flow with ID: {flow.flow_id}")
            return flow
        except NoResultFound as e:
            self.db_session.rollback()
            logger.error(
                f"NoResultFound error when updating flow with ID {flow.flow_id}: {e}"
            )
            raise e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error updating flow with ID {flow.flow_id}: {e}")
            raise e

    def delete_flow(self, flow_id: str) -> None:
        """
        Delete flow
        """
        try:
            flow = self.db_session.query(FlowModel).filter_by(flow_id=flow_id).first()
            if not flow:
                logger.warning(
                    f"Attempted to delete non-existent flow with ID: {flow_id}"
                )
                raise NoResultFound(f"Flow with ID {flow_id} not found.")
            self.db_session.delete(flow)
            self.db_session.commit()
            logger.info(f"Deleted flow with ID: {flow_id}")
        except NoResultFound as e:
            self.db_session.rollback()
            logger.error(
                f"NoResultFound error when deleting flow with ID {flow_id}: {e}"
            )
            raise e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error deleting flow with ID {flow_id}: {e}")
            raise e
