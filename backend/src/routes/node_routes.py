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
        # Generate catalog in-memory
        catalog = generate_node_catalog()
        etag = generate_catalog_etag(catalog)
        if request.headers.get("If-None-Match") == etag:
            return Response(status_code=304)
        
        # Add caching headers (1 year + immutable)
        headers = {
            "Cache-Control": "public, max-age=31536000, immutable",
            "ETag": generate_catalog_etag(catalog),  # Optional: versioned ETag
            "Last-Modified": datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT")
        }
        
        return JSONResponse(content=catalog, headers=headers)
    except Exception as e:
        # Log the error with traceback
        logger.error(f"Error generating catalog: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while generating node catalog"
        )