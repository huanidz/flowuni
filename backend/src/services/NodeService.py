import asyncio
import json
from abc import ABC, abstractmethod
from datetime import datetime

from fastapi import HTTPException, Request, Response
from fastapi.responses import JSONResponse
from loguru import logger
from src.core.cache import generate_catalog_etag
from src.dependencies.redis_dependency import get_redis_client
from src.scripts.generate_node_catalog import generate_node_catalog


class NodeServiceInterface(ABC):
    @abstractmethod
    async def get_catalog(self, request: Request) -> JSONResponse:
        pass


class NodeService(NodeServiceInterface):
    def __init__(self):
        """Initialize node service with required dependencies"""
        self.generate_catalog = generate_node_catalog
        self.generate_etag = generate_catalog_etag

    async def get_catalog(self, request: Request) -> JSONResponse:
        """
        Generate and return the node catalog with proper cache headers.
        Uses Redis for server-side caching.

        Args:
            request (Request): The incoming HTTP request

        Returns:
            JSONResponse: The node catalog with appropriate HTTP response structure

        Raises:
            HTTPException: If there's an error generating the catalog
        """
        try:
            async with asyncio.timeout(30):
                redis_client = get_redis_client()
                cache_key = "node_catalog"

                # Try to get catalog from Redis cache
                cached_catalog = redis_client.get(cache_key)
                if cached_catalog:
                    catalog = json.loads(cached_catalog)
                else:
                    # Generate the catalog
                    catalog = self.generate_catalog()
                    # Cache it in Redis for 1 hour (3600 seconds)
                    redis_client.setex(cache_key, 3600, json.dumps(catalog))

                # Generate ETag from catalog
                etag = self.generate_etag(catalog)

                # Check for 304 Not Modified
                if request.headers.get("If-None-Match") == etag:
                    logger.info("304 Not Modified")
                    return Response(status_code=304, headers={"ETag": etag})

                # Get the current time for Last-Modified header
                now = datetime.utcnow()

                # Set proper cache headers for public caching
                headers = {
                    "Cache-Control": "public, max-age=31536000, immutable",
                    "ETag": etag,
                    "Last-Modified": now.strftime("%a, %d %b %Y %H:%M:%S GMT"),
                }

                # Return the catalog with proper headers
                return JSONResponse(content=catalog, headers=headers)
        except asyncio.TimeoutError:
            logger.error("Timeout generating node catalog")
            raise HTTPException(
                status_code=503, detail="Node catalog generation timed out"
            )
        except Exception as e:
            logger.error(f"Error generating node catalog: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail="Internal server error while generating node catalog",
            ) from e
