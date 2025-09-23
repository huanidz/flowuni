from typing import Any, Dict, List, Optional, Union

from sqlalchemy import and_
from sqlalchemy.orm import Session
from src.models.alchemy.users.UserGlobalTemplateModel import (
    TemplateType,
    UserGlobalTemplateModel,
)
from src.models.parsers.LLMProviderParser import LLMProviderParser
from src.repositories.BaseRepository import BaseRepository


class UserGlobalTemplateRepository(BaseRepository):
    def __init__(self, db_session: Session):
        super().__init__(db_session)
        self.model = UserGlobalTemplateModel

    def get_by_user_id(self, user_id: int) -> List[UserGlobalTemplateModel]:
        """Get all templates for a specific user"""
        return (
            self.db_session.query(UserGlobalTemplateModel)
            .filter(UserGlobalTemplateModel.user_id == user_id)
            .all()
        )

    def get_by_user_id_and_type(
        self, user_id: int, template_type: TemplateType
    ) -> List[UserGlobalTemplateModel]:
        """Get all templates for a specific user and type"""
        return (
            self.db_session.query(UserGlobalTemplateModel)
            .filter(
                and_(
                    UserGlobalTemplateModel.user_id == user_id,
                    UserGlobalTemplateModel.type == template_type,
                )
            )
            .all()
        )

    def get_by_id_and_user_id(
        self, template_id: int, user_id: int
    ) -> Optional[UserGlobalTemplateModel]:
        """Get a template by ID and user ID"""
        return (
            self.db_session.query(UserGlobalTemplateModel)
            .filter(
                and_(
                    UserGlobalTemplateModel.id == template_id,
                    UserGlobalTemplateModel.user_id == user_id,
                )
            )
            .first()
        )

    def get_llm_judges_by_user_id(self, user_id: int) -> List[UserGlobalTemplateModel]:
        """Get all LLM judge templates for a specific user"""
        return self.get_by_user_id_and_type(user_id, TemplateType.LLM_JUDGE)

    def create_template(
        self,
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
        return self.add(template)

    def create_llm_judge(
        self,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        data: Optional[Union[Dict[str, Any], LLMProviderParser]] = None,
    ) -> UserGlobalTemplateModel:
        """Create a new LLM judge template"""
        return self.create_template(
            user_id=user_id,
            template_type=TemplateType.LLM_JUDGE,
            name=name,
            description=description,
            data=data,
        )

    def update_template(
        self,
        template_id: int,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        data: Optional[Union[Dict[str, Any], LLMProviderParser]] = None,
    ) -> Optional[UserGlobalTemplateModel]:
        """Update a template"""
        template = self.get_by_id_and_user_id(template_id, user_id)
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

        return self.update(template)

    def delete_template(self, template_id: int, user_id: int) -> bool:
        """Delete a template"""
        template = self.get_by_id_and_user_id(template_id, user_id)
        if not template:
            return False

        self.delete(template)
        return True
