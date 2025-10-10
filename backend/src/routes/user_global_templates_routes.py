import json

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from src.components.llm.registry.LLMConstructingRegistry import LLMConstructingRegistry
from src.core.cache import generate_catalog_etag
from src.dependencies.auth_dependency import get_current_user
from src.dependencies.db_dependency import get_async_db
from src.dependencies.redis_dependency import get_redis_client
from src.dependencies.user_global_templates_dep import (
    get_user_global_template_service,
)
from src.schemas.users.user_global_template_schemas import (
    CreateLLMJudgeRequest,
    LLMJudgeListResponse,
    LLMJudgeResponse,
    LLMSupportConfigResponse,
    UpdateLLMJudgeRequest,
)
from src.services.UserGlobalTemplateService import UserGlobalTemplateService

user_global_templates_router = APIRouter(
    prefix="/api/user-global-templates",
    tags=["user_global_templates"],
)


@user_global_templates_router.post(
    "/llm-judges", response_model=LLMJudgeResponse, status_code=status.HTTP_201_CREATED
)
async def create_llm_judge(
    request: CreateLLMJudgeRequest,
    session: AsyncSession = Depends(get_async_db),
    template_service: UserGlobalTemplateService = Depends(
        get_user_global_template_service
    ),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Create a new LLM judge template for the authenticated user
    """
    try:
        template = await template_service.create_llm_judge(
            session=session,
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
    session: AsyncSession = Depends(get_async_db),
    template_service: UserGlobalTemplateService = Depends(
        get_user_global_template_service
    ),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Get all LLM judge templates for the authenticated user
    """
    try:
        templates = await template_service.get_llm_judges(session, auth_user_id)

        template_responses = [
            LLMJudgeResponse(
                id=template.id,
                user_id=template.user_id,
                type=template.type.value,
                name=template.name,
                description=template.description,
                data=template.data,
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
    session: AsyncSession = Depends(get_async_db),
    template_service: UserGlobalTemplateService = Depends(
        get_user_global_template_service
    ),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Update an LLM judge template for the authenticated user
    """
    try:
        template = await template_service.update_llm_judge(
            session=session,
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
    session: AsyncSession = Depends(get_async_db),
    template_service: UserGlobalTemplateService = Depends(
        get_user_global_template_service
    ),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Delete an LLM judge template for the authenticated user
    """
    try:
        success = await template_service.delete_llm_judge(
            session, template_id, auth_user_id
        )

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


@user_global_templates_router.get(
    "/llm-config",
    response_model=LLMSupportConfigResponse,
    status_code=status.HTTP_200_OK,
)
async def get_llm_config(
    request: Request,
    auth_user_id: int = Depends(get_current_user),
):
    """
    Get the supported LLM configuration with caching
    """
    try:
        redis_client = get_redis_client()
        cache_key = "llm_support_config"

        # Try to get config from Redis cache
        cached_config = redis_client.get(cache_key)
        if cached_config:
            config = json.loads(cached_config)
        else:
            # Generate the config
            config = LLMConstructingRegistry.get_constructing_support_config()
            # Cache it in Redis for 1 hour (3600 seconds)
            redis_client.setex(cache_key, 24 * 3600, json.dumps(config))

        # Generate ETag from config
        etag = generate_catalog_etag(config)

        # Check for 304 Not Modified
        if request.headers.get("If-None-Match") == etag:
            logger.info("304 Not Modified for LLM config")
            return Response(status_code=304, headers={"ETag": etag})

        # Get the current time for Last-Modified header
        now = __import__("datetime").datetime.utcnow()

        # Set proper cache headers for public caching
        headers = {
            "Cache-Control": "public, max-age=31536000, immutable",
            "ETag": etag,
            "Last-Modified": now.strftime("%a, %d %b %Y %H:%M:%S GMT"),
        }

        # Return the config with proper headers
        return JSONResponse(content=config, headers=headers)

    except Exception as e:
        logger.error(
            f"Error retrieving LLM config for user {auth_user_id}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve LLM config.",
        ) from e
