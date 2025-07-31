from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from loguru import logger
from src.core.cache import generate_catalog_etag
from src.dependencies.auth_dependency import get_current_user
from src.nodes.NodeBase import NodeSpec
from src.scripts.generate_node_catalog import generate_node_catalog

node_router = APIRouter(
    prefix="/api/node",
    tags=["node"],
)


@node_router.get("/catalog", response_model=List[NodeSpec])
def get_catalog(request: Request, user_id: int = Depends(get_current_user)):
    try:
        catalog = generate_node_catalog()
        etag = generate_catalog_etag(catalog)

        # Check for 304 Not Modified
        if request.headers.get("If-None-Match") == etag:
            logger.info(f"304 Not Modified for user {user_id}")
            return Response(status_code=304, headers={"ETag": etag})

        # Set proper cache headers for public caching
        headers = {
            "Cache-Control": "public, max-age=31536000, immutable",
            "ETag": etag,
            "Last-Modified": datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT"),
        }

        # Return the catalog with proper headers
        return JSONResponse(content=catalog, headers=headers)
    except Exception as e:
        logger.error(
            f"Error generating node catalog for user {user_id}: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error while generating node catalog",
        )
