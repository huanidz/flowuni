from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from typing import List
from datetime import datetime

from src.nodes.NodeBase import NodeSpec

from src.scripts.generate_node_catalog import generate_node_catalog
from src.core.cache import generate_catalog_etag

from loguru import logger

node_router = APIRouter(
    prefix="/api/node",
    tags=["node"],
)


@node_router.get("/catalog", response_model=List[NodeSpec])
def get_catalog(request: Request):
    try:
        catalog = generate_node_catalog()
        etag = generate_catalog_etag(catalog)

        if request.headers.get("If-None-Match") == etag:
            logger.info("304 Not Modified")
            return Response(status_code=304)

        headers = {
            # "Cache-Control": "public, max-age=31536000, immutable",
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "ETag": generate_catalog_etag(catalog),
            "Last-Modified": datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT"),
        }

        return JSONResponse(content=catalog, headers=headers)
    except Exception as e:
        logger.error(f"Error generating catalog: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while generating node catalog",
        )
