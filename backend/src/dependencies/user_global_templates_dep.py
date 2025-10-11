from fastapi import Depends
from src.repositories.UserGlobalTemplateRepository import UserGlobalTemplateRepository
from src.services.UserGlobalTemplateService import UserGlobalTemplateService


def get_user_global_template_repository() -> UserGlobalTemplateRepository:
    """Dependency to get UserGlobalTemplateRepository instance"""
    return UserGlobalTemplateRepository()


def get_user_global_template_service(
    template_repo: UserGlobalTemplateRepository = Depends(
        get_user_global_template_repository
    ),
) -> UserGlobalTemplateService:
    """Dependency to get UserGlobalTemplateService instance"""
    return UserGlobalTemplateService(template_repo=template_repo)
