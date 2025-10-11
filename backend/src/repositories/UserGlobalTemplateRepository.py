from typing import Any, Dict, List, Optional, Union

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.alchemy.users.UserGlobalTemplateModel import (
    TemplateType,
    UserGlobalTemplateModel,
)
from src.models.parsers.LLMProviderParser import LLMProviderParser
from src.repositories.BaseRepository import BaseRepository


class UserGlobalTemplateRepository(BaseRepository):
    def __init__(self):
        super().__init__(UserGlobalTemplateModel)

    async def get_by_user_id(
        self, session: AsyncSession, user_id: int
    ) -> List[UserGlobalTemplateModel]:
        """Get all templates for a specific user"""
        result = await session.execute(
            select(UserGlobalTemplateModel).where(
                UserGlobalTemplateModel.user_id == user_id
            )
        )
        return result.scalars().all()

    async def get_by_user_id_and_type(
        self, session: AsyncSession, user_id: int, template_type: TemplateType
    ) -> List[UserGlobalTemplateModel]:
        """Get all templates for a specific user and type"""
        result = await session.execute(
            select(UserGlobalTemplateModel).where(
                and_(
                    UserGlobalTemplateModel.user_id == user_id,
                    UserGlobalTemplateModel.type == template_type,
                )
            )
        )
        return result.scalars().all()

    async def get_by_id_and_user_id(
        self, session: AsyncSession, template_id: int, user_id: int
    ) -> Optional[UserGlobalTemplateModel]:
        """Get a template by ID and user ID"""
        result = await session.execute(
            select(UserGlobalTemplateModel).where(
                and_(
                    UserGlobalTemplateModel.id == template_id,
                    UserGlobalTemplateModel.user_id == user_id,
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_llm_judges_by_user_id(
        self, session: AsyncSession, user_id: int
    ) -> List[UserGlobalTemplateModel]:
        """Get all LLM judge templates for a specific user"""
        return await self.get_by_user_id_and_type(
            session, user_id, TemplateType.LLM_JUDGE
        )

    async def create_template(
        self,
        session: AsyncSession,
        user_id: int,
        template_type: TemplateType,
        name: Optional[str] = None,
        description: Optional[str] = None,
        data: Optional[Union[Dict[str, Any], LLMProviderParser]] = None,
    ) -> UserGlobalTemplateModel:
        """Create a new template"""
        # Convert LLMProviderParser to dict if provided
        if isinstance(data, LLMProviderParser):
            data = data.model_dump()

        template = UserGlobalTemplateModel(
            user_id=user_id,
            type=template_type,
            name=name,
            description=description,
            data=data,
        )
        session.add(template)
        await session.flush()
        await session.refresh(template)
        return template

    async def create_llm_judge(
        self,
        session: AsyncSession,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        data: Optional[Union[Dict[str, Any], LLMProviderParser]] = None,
    ) -> UserGlobalTemplateModel:
        """Create a new LLM judge template"""
        return await self.create_template(
            session=session,
            user_id=user_id,
            template_type=TemplateType.LLM_JUDGE,
            name=name,
            description=description,
            data=data,
        )

    async def update_template(
        self,
        session: AsyncSession,
        template_id: int,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        data: Optional[Union[Dict[str, Any], LLMProviderParser]] = None,
    ) -> Optional[UserGlobalTemplateModel]:
        """Update a template"""
        template = await self.get_by_id_and_user_id(session, template_id, user_id)
        if not template:
            return None

        if name is not None:
            template.name = name
        if description is not None:
            template.description = description
        if isinstance(data, LLMProviderParser):
            template.data = data.model_dump()
        elif data is not None:
            template.data = data

        await session.flush()
        await session.refresh(template)
        return template

    async def delete_template(
        self, session: AsyncSession, template_id: int, user_id: int
    ) -> bool:
        """Delete a template"""
        template = await self.get_by_id_and_user_id(session, template_id, user_id)
        if not template:
            return False

        await session.delete(template)
        await session.flush()
        return True
