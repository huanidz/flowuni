import asyncio
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union

from fastapi import HTTPException
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from src.configs.config import get_app_settings
from src.models.alchemy.users.UserGlobalTemplateModel import (
    UserGlobalTemplateModel,
)
from src.models.parsers.LLMProviderParser import LLMProviderParser
from src.repositories.UserGlobalTemplateRepository import UserGlobalTemplateRepository


class UserGlobalTemplateServiceInterface(ABC):
    @abstractmethod
    async def create_llm_judge(
        self,
        session: AsyncSession,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        data: Optional[Union[Dict[str, Any], LLMProviderParser]] = None,
    ) -> UserGlobalTemplateModel:
        """Create a new LLM judge template

        Args:
            session: The async database session
            user_id: The ID of the user creating the template
            name: The name of the template
            description: The description of the template
            data: The template data (can be a dict or LLMProviderParser)

        Returns:
            UserGlobalTemplateModel: The newly created template instance
        """
        pass

    @abstractmethod
    async def get_llm_judges(
        self, session: AsyncSession, user_id: int
    ) -> List[UserGlobalTemplateModel]:
        """Get all LLM judge templates for a user

        Args:
            session: The async database session
            user_id: The ID of the user

        Returns:
            List[UserGlobalTemplateModel]: List of LLM judge templates
        """
        pass

    @abstractmethod
    async def update_llm_judge(
        self,
        session: AsyncSession,
        template_id: int,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        data: Optional[Union[Dict[str, Any], LLMProviderParser]] = None,
    ) -> Optional[UserGlobalTemplateModel]:
        """Update an LLM judge template

        Args:
            session: The async database session
            template_id: The ID of the template to update
            user_id: The ID of the user who owns the template
            name: The new name of the template
            description: The new description of the template
            data: The new template data (can be a dict or LLMProviderParser)

        Returns:
            Optional[UserGlobalTemplateModel]: The updated template instance, or None if not found
        """
        pass

    @abstractmethod
    async def delete_llm_judge(
        self, session: AsyncSession, template_id: int, user_id: int
    ) -> bool:
        """Delete an LLM judge template

        Args:
            session: The async database session
            template_id: The ID of the template to delete
            user_id: The ID of the user who owns the template

        Returns:
            bool: True if deletion was successful, False otherwise
        """
        pass


class UserGlobalTemplateService(UserGlobalTemplateServiceInterface):
    def __init__(self, template_repo: UserGlobalTemplateRepository):
        self.template_repo = template_repo

    async def create_llm_judge(
        self,
        session: AsyncSession,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        data: Optional[Union[Dict[str, Any], LLMProviderParser]] = None,
    ) -> UserGlobalTemplateModel:
        """Create a new LLM judge template"""
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                template = await self.template_repo.create_llm_judge(
                    session=session,
                    user_id=user_id,
                    name=name,
                    description=description,
                    data=data,
                )
                logger.info(f"LLM judge template created successfully: {template.id}")
                return template
        except asyncio.TimeoutError:
            logger.error("Timeout creating LLM judge template")
            raise HTTPException(
                status_code=503, detail="LLM judge template creation timed out"
            )
        except Exception as e:
            logger.error(f"Error creating LLM judge template: {e}")
            raise HTTPException(
                status_code=500, detail="Failed to create LLM judge template"
            )

    async def get_llm_judges(
        self, session: AsyncSession, user_id: int
    ) -> List[UserGlobalTemplateModel]:
        """Get all LLM judge templates for a user"""
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                templates = await self.template_repo.get_llm_judges_by_user_id(
                    session, user_id
                )
                logger.info(
                    f"Retrieved {len(templates)} LLM judge templates for user {user_id}"
                )
                return templates
        except asyncio.TimeoutError:
            logger.error("Timeout retrieving LLM judge templates")
            raise HTTPException(
                status_code=503, detail="LLM judge templates retrieval timed out"
            )
        except Exception as e:
            logger.error(f"Error retrieving LLM judge templates: {e}")
            raise HTTPException(
                status_code=500, detail="Failed to retrieve LLM judge templates"
            )

    async def update_llm_judge(
        self,
        session: AsyncSession,
        template_id: int,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        data: Optional[Union[Dict[str, Any], LLMProviderParser]] = None,
    ) -> Optional[UserGlobalTemplateModel]:
        """Update an LLM judge template"""
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                template = await self.template_repo.update_template(
                    session=session,
                    template_id=template_id,
                    user_id=user_id,
                    name=name,
                    description=description,
                    data=data,
                )

                if template:
                    logger.info(
                        f"LLM judge template updated successfully: {template_id}"
                    )
                else:
                    logger.warning(
                        f"LLM judge template not found for update: {template_id}"
                    )

                return template
        except asyncio.TimeoutError:
            logger.error("Timeout updating LLM judge template")
            raise HTTPException(
                status_code=503, detail="LLM judge template update timed out"
            )
        except Exception as e:
            logger.error(f"Error updating LLM judge template: {e}")
            raise HTTPException(
                status_code=500, detail="Failed to update LLM judge template"
            )

    async def delete_llm_judge(
        self, session: AsyncSession, template_id: int, user_id: int
    ) -> bool:
        """Delete an LLM judge template"""
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                success = await self.template_repo.delete_template(
                    session, template_id, user_id
                )

                if success:
                    logger.info(
                        f"LLM judge template deleted successfully: {template_id}"
                    )
                else:
                    logger.warning(
                        f"LLM judge template not found for deletion: {template_id}"
                    )

                return success
        except asyncio.TimeoutError:
            logger.error("Timeout deleting LLM judge template")
            raise HTTPException(
                status_code=503, detail="LLM judge template deletion timed out"
            )
        except Exception as e:
            logger.error(f"Error deleting LLM judge template: {e}")
            raise HTTPException(
                status_code=500, detail="Failed to delete LLM judge template"
            )
