from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger
from src.dependencies.auth_dependency import get_current_user
from src.dependencies.db_dependency import get_db
from src.repositories.UserGlobalTemplateRepository import UserGlobalTemplateRepository
from src.schemas.users.user_global_template_schemas import (
    CreateLLMJudgeRequest,
    LLMJudgeListResponse,
    LLMJudgeResponse,
    UpdateLLMJudgeRequest,
)
from src.services.UserGlobalTemplateService import UserGlobalTemplateService

user_global_templates_router = APIRouter(
    prefix="/api/user-global-templates",
    tags=["user_global_templates"],
)


def get_user_global_template_repository(
    db=Depends(get_db),
) -> UserGlobalTemplateRepository:
    """Dependency to get UserGlobalTemplateRepository instance"""
    return UserGlobalTemplateRepository(db)


def get_user_global_template_service(
    repo: UserGlobalTemplateRepository = Depends(get_user_global_template_repository),
) -> UserGlobalTemplateService:
    """Dependency to get UserGlobalTemplateService instance"""
    return UserGlobalTemplateService(repo)


@user_global_templates_router.post(
    "/llm-judges", response_model=LLMJudgeResponse, status_code=status.HTTP_201_CREATED
)
async def create_llm_judge(
    request: CreateLLMJudgeRequest,
    template_service: UserGlobalTemplateService = Depends(
        get_user_global_template_service
    ),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Create a new LLM judge template for the authenticated user
    """
    try:
        template = template_service.create_llm_judge(
            user_id=auth_user_id,
            name=request.name,
            description=request.description,
            data=request.data,
        )

        return LLMJudgeResponse(
            id=template.id,
            user_id=template.user_id,
            type=template.type.value,
            name=template.name,
            description=template.description,
            data=request.data,
            created_at=template.created_at,
            modified_at=template.modified_at,
        )

    except Exception as e:
        logger.error(
            f"Error creating LLM judge template for user {auth_user_id}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create LLM judge template.",
        ) from e


@user_global_templates_router.get(
    "/llm-judges", response_model=LLMJudgeListResponse, status_code=status.HTTP_200_OK
)
async def get_llm_judges(
    template_service: UserGlobalTemplateService = Depends(
        get_user_global_template_service
    ),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Get all LLM judge templates for the authenticated user
    """
    try:
        templates = template_service.get_llm_judges(auth_user_id)

        template_responses = [
            LLMJudgeResponse(
                id=template.id,
                user_id=template.user_id,
                type=template.type.value,
                name=template.name,
                description=template.description,
                data=None,  # Will be populated from template.data if needed
                created_at=template.created_at,
                modified_at=template.modified_at,
            )
            for template in templates
        ]

        return LLMJudgeListResponse(templates=template_responses)

    except Exception as e:
        logger.error(
            f"Error retrieving LLM judge templates for user {auth_user_id}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve LLM judge templates.",
        ) from e


@user_global_templates_router.put(
    "/llm-judges/{template_id}",
    response_model=LLMJudgeResponse,
    status_code=status.HTTP_200_OK,
)
async def update_llm_judge(
    template_id: int,
    request: UpdateLLMJudgeRequest,
    template_service: UserGlobalTemplateService = Depends(
        get_user_global_template_service
    ),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Update an LLM judge template for the authenticated user
    """
    try:
        template = template_service.update_llm_judge(
            template_id=template_id,
            user_id=auth_user_id,
            name=request.name,
            description=request.description,
            data=request.data,
        )

        if not template:
            logger.warning(
                f"LLM judge template with ID {template_id} not found for user {auth_user_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="LLM judge template not found.",
            )

        return LLMJudgeResponse(
            id=template.id,
            user_id=template.user_id,
            type=template.type.value,
            name=template.name,
            description=template.description,
            data=request.data,
            created_at=template.created_at,
            modified_at=template.modified_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error updating LLM judge template {template_id} for user {auth_user_id}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update LLM judge template.",
        ) from e


@user_global_templates_router.delete(
    "/llm-judges/{template_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_llm_judge(
    template_id: int,
    template_service: UserGlobalTemplateService = Depends(
        get_user_global_template_service
    ),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Delete an LLM judge template for the authenticated user
    """
    try:
        success = template_service.delete_llm_judge(template_id, auth_user_id)

        if not success:
            logger.warning(
                f"LLM judge template with ID {template_id} not found for user {auth_user_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="LLM judge template not found.",
            )

        # Return empty response for 204 No Content
        return

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error deleting LLM judge template {template_id} for user {auth_user_id}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete LLM judge template.",
        ) from e
