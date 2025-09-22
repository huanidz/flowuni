from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from loguru import logger
from src.models.alchemy.users.UserGlobalTemplateModel import (
    TemplateType,
    UserGlobalTemplateModel,
)
from src.repositories.UserGlobalTemplateRepository import UserGlobalTemplateRepository


class UserGlobalTemplateServiceInterface(ABC):
    @abstractmethod
    def create_llm_judge(
        self,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> UserGlobalTemplateModel:
        """Create a new LLM judge template

        Args:
            user_id: The ID of the user creating the template
            name: The name of the template
            description: The description of the template
            data: The template data

        Returns:
            UserGlobalTemplateModel: The newly created template instance
        """
        pass

    @abstractmethod
    def get_llm_judges(self, user_id: int) -> List[UserGlobalTemplateModel]:
        """Get all LLM judge templates for a user

        Args:
            user_id: The ID of the user

        Returns:
            List[UserGlobalTemplateModel]: List of LLM judge templates
        """
        pass

    @abstractmethod
    def update_llm_judge(
        self,
        template_id: int,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> Optional[UserGlobalTemplateModel]:
        """Update an LLM judge template

        Args:
            template_id: The ID of the template to update
            user_id: The ID of the user who owns the template
            name: The new name of the template
            description: The new description of the template
            data: The new template data

        Returns:
            Optional[UserGlobalTemplateModel]: The updated template instance, or None if not found
        """
        pass

    @abstractmethod
    def delete_llm_judge(self, template_id: int, user_id: int) -> bool:
        """Delete an LLM judge template

        Args:
            template_id: The ID of the template to delete
            user_id: The ID of the user who owns the template

        Returns:
            bool: True if deletion was successful, False otherwise
        """
        pass


class UserGlobalTemplateService(UserGlobalTemplateServiceInterface):
    def __init__(self, template_repo: UserGlobalTemplateRepository):
        self.template_repo = template_repo

    def create_llm_judge(
        self,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> UserGlobalTemplateModel:
        """Create a new LLM judge template"""
        try:
            template = self.template_repo.create_llm_judge(
                user_id=user_id, name=name, description=description, data=data
            )
            logger.info(f"LLM judge template created successfully: {template.id}")
            return template
        except Exception as e:
            logger.error(f"Error creating LLM judge template: {e}")
            raise

    def get_llm_judges(self, user_id: int) -> List[UserGlobalTemplateModel]:
        """Get all LLM judge templates for a user"""
        try:
            templates = self.template_repo.get_llm_judges_by_user_id(user_id)
            logger.info(
                f"Retrieved {len(templates)} LLM judge templates for user {user_id}"
            )
            return templates
        except Exception as e:
            logger.error(f"Error retrieving LLM judge templates: {e}")
            raise

    def update_llm_judge(
        self,
        template_id: int,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> Optional[UserGlobalTemplateModel]:
        """Update an LLM judge template"""
        try:
            template = self.template_repo.update_template(
                template_id=template_id,
                user_id=user_id,
                name=name,
                description=description,
                data=data,
            )

            if template:
                logger.info(f"LLM judge template updated successfully: {template_id}")
            else:
                logger.warning(
                    f"LLM judge template not found for update: {template_id}"
                )

            return template
        except Exception as e:
            logger.error(f"Error updating LLM judge template: {e}")
            raise

    def delete_llm_judge(self, template_id: int, user_id: int) -> bool:
        """Delete an LLM judge template"""
        try:
            success = self.template_repo.delete_template(template_id, user_id)

            if success:
                logger.info(f"LLM judge template deleted successfully: {template_id}")
            else:
                logger.warning(
                    f"LLM judge template not found for deletion: {template_id}"
                )

            return success
        except Exception as e:
            logger.error(f"Error deleting LLM judge template: {e}")
            raise
