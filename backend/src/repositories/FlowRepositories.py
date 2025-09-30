import math
import re
from datetime import datetime
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

    def save_flow_definition(self, flow: FlowModel) -> FlowModel:
        """
        Save flow definition, either by adding a new flow or updating an existing one.
        """
        try:
            return self.update_flow(flow)
        except NoResultFound as e:
            self.db_session.rollback()
            logger.error(
                f"NoResultFound error when saving \
                flow definition for flow with ID {flow.flow_id}: {e}"
            )
            raise e
        except Exception as e:
            self.db_session.rollback()
            logger.error(
                f"Error saving flow definition for flow with ID {flow.flow_id}: {e}"
            )
            raise e

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
            flow = (
                self.db_session.query(FlowModel)
                .filter_by(flow_id=flow_id)
                .one_or_none()
            )
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
        self,
        user_id: int,
        page: int = 1,
        per_page: int = 10,
        sort_by_time_created: bool = True,
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

            # 3) sort by time created
            if sort_by_time_created:
                flows = sorted(flows, key=lambda x: x.created_at, reverse=True)

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

    def create_empty_flow(self, user_id: int) -> FlowModel:
        """
        Create a new flow with auto-incremented name like 'New Flow', 'New Flow (1)', etc.,
        scoped to the given user_id.
        """
        try:
            base_name = "New Flow"

            # Fetch all existing names for this user that start with 'New Flow'
            existing_names = (
                self.db_session.query(FlowModel.name)
                .filter(
                    FlowModel.user_id == user_id, FlowModel.name.ilike(f"{base_name}%")
                )
                .all()
            )

            # Extract just the name strings
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
            flow = FlowModel(
                flow_id=flow_id,
                name=name,
                description="",
                user_id=user_id,  # Assign user_id
                is_active=True,
            )
            self.db_session.add(flow)
            self.db_session.commit()
            self.db_session.refresh(flow)

            logger.info(
                f"Created new flow with name: '{name}', ID: {flow.flow_id}, for user ID: {user_id}"
            )
            return flow

        except IntegrityError as e:
            self.db_session.rollback()
            logger.error(f"Integrity error when creating flow for user {user_id}: {e}")
            raise ValueError(
                "Failed to create flow due to database integrity error."
            ) from e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error creating flow for user {user_id}: {e}")
            raise e

    def create_flow_with_data(
        self, user_id: int, name: str = None, flow_definition: dict = None
    ) -> FlowModel:
        """
        Create a new flow with optional name and flow definition.
        If name is not provided, it will auto-increment like 'New Flow', 'New Flow (1)', etc.
        """
        try:
            # If no name provided, use the same logic as create_empty_flow
            if name is None:
                base_name = "New Flow"

                # Fetch all existing names for this user that start with 'New Flow'
                existing_names = (
                    self.db_session.query(FlowModel.name)
                    .filter(
                        FlowModel.user_id == user_id,
                        FlowModel.name.ilike(f"{base_name}%"),
                    )
                    .all()
                )

                # Extract just the name strings
                existing_names = [name[0] for name in existing_names]

                # Find the next available number
                used_numbers = set()

                pattern = re.compile(rf"^{re.escape(base_name)}(?: \((\d+)\))?$")
                for existing_name in existing_names:
                    match = pattern.match(existing_name)
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
            flow = FlowModel(
                flow_id=flow_id,
                name=name,
                description="",
                user_id=user_id,
                flow_definition=flow_definition,
                is_active=True,
            )
            self.db_session.add(flow)
            self.db_session.commit()
            self.db_session.refresh(flow)

            logger.info(
                f"Created new flow with name: '{name}', ID: {flow.flow_id}, for user ID: {user_id}"
            )
            return flow

        except IntegrityError as e:
            self.db_session.rollback()
            logger.error(f"Integrity error when creating flow for user {user_id}: {e}")
            raise ValueError(
                "Failed to create flow due to database integrity error."
            ) from e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error creating flow for user {user_id}: {e}")
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
        logger.info(f"Update flow with ID: {flow.flow_id}")
        try:
            existing_flow = (
                self.db_session.query(FlowModel).filter_by(flow_id=flow.flow_id).first()
            )
            if not existing_flow:
                logger.warning(
                    f"Attempted to update non-existent flow with ID: {flow.flow_id}"
                )
                raise NoResultFound(f"Flow with ID {flow.flow_id} not found.")

            # Update the existing flow's attributes with the new values
            for attr, value in flow.__dict__.items():
                if not attr.startswith("_") and hasattr(existing_flow, attr):
                    # Skip the primary key and foreign keys if they shouldn't change
                    if attr not in [
                        "id",
                        "created_at",
                    ]:  # Add other fields to skip as needed
                        setattr(existing_flow, attr, value)

            # Update the modified timestamp
            existing_flow.modified_at = (
                datetime.utcnow()
            )  # or however you handle timestamps

            self.db_session.commit()
            self.db_session.refresh(existing_flow)
            logger.info(f"Updated flow with ID: {existing_flow.flow_id}")
            return existing_flow

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

    def activate_flow(self, flow_id: str) -> FlowModel:
        """
        Activate a flow by setting is_active to True
        """
        try:
            flow = self.db_session.query(FlowModel).filter_by(flow_id=flow_id).first()
            if not flow:
                logger.warning(
                    f"Attempted to activate non-existent flow with ID: {flow_id}"
                )
                raise NoResultFound(f"Flow with ID {flow_id} not found.")

            flow.is_active = True
            flow.modified_at = datetime.utcnow()
            self.db_session.commit()
            self.db_session.refresh(flow)
            logger.info(f"Activated flow with ID: {flow_id}")
            return flow
        except NoResultFound as e:
            self.db_session.rollback()
            logger.error(
                f"NoResultFound error when activating flow with ID {flow_id}: {e}"
            )
            raise e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error activating flow with ID {flow_id}: {e}")
            raise e

    def deactivate_flow(self, flow_id: str) -> FlowModel:
        """
        Deactivate a flow by setting is_active to False
        """
        try:
            flow = self.db_session.query(FlowModel).filter_by(flow_id=flow_id).first()
            if not flow:
                logger.warning(
                    f"Attempted to deactivate non-existent flow with ID: {flow_id}"
                )
                raise NoResultFound(f"Flow with ID {flow_id} not found.")

            flow.is_active = False
            flow.modified_at = datetime.utcnow()
            self.db_session.commit()
            self.db_session.refresh(flow)
            logger.info(f"Deactivated flow with ID: {flow_id}")
            return flow
        except NoResultFound as e:
            self.db_session.rollback()
            logger.error(
                f"NoResultFound error when deactivating flow with ID {flow_id}: {e}"
            )
            raise e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error deactivating flow with ID {flow_id}: {e}")
            raise e
