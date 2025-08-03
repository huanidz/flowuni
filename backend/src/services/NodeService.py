from abc import ABC, abstractmethod

from fastapi import HTTPException, Request, Response
from fastapi.responses import JSONResponse
from loguru import logger
from src.core.cache import generate_catalog_etag
from src.scripts.generate_node_catalog import generate_node_catalog


class NodeServiceInterface(ABC):
    @abstractmethod
    def get_catalog(self) -> dict:
        pass


class NodeService(NodeServiceInterface):
    def __init__(self):
        """Initialize node service with required dependencies"""
        self.generate_catalog = generate_node_catalog
        self.generate_etag = generate_catalog_etag

    def get_catalog(self, request: Request) -> JSONResponse:
        """
        Generate and return the node catalog with proper cache headers.

        Args:
            request (Request): The incoming HTTP request

        Returns:
            JSONResponse: The node catalog with appropriate HTTP response structure

        Raises:
            HTTPException: If there's an error generating the catalog
        """
        try:
            # Get the current time for Last-Modified header
            now = __import__("datetime").datetime.utcnow()

            # Generate the catalog and ETag
            catalog = self.generate_catalog()
            etag = self.generate_etag(catalog)

            # Check for 304 Not Modified
            if request.headers.get("If-None-Match") == etag:
                logger.info("304 Not Modified")
                return Response(status_code=304, headers={"ETag": etag})

            # Set proper cache headers for public caching
            headers = {
                "Cache-Control": "public, max-age=31536000, immutable",
                "ETag": etag,
                "Last-Modified": now.strftime("%a, %d %b %Y %H:%M:%S GMT"),
            }

            # Return the catalog with proper headers
            return JSONResponse(content=catalog, headers=headers)
        except Exception as e:
            logger.error(f"Error generating node catalog: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail="Internal server error while generating node catalog",
            ) from e
