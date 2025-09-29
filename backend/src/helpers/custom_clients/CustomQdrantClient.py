from typing import Any, Dict, List, Literal, Optional, Union

import numpy as np
import requests
from loguru import logger
from pydantic import BaseModel, Field

# --- Pydantic Data Models for Qdrant API Payloads ---

# Define the supported distance metrics for type checking
Distance = Literal["Cosine", "Dot", "Euclid"]


# --- Filter Models ---
class MatchValue(BaseModel):
    """Condition for payload field matching a specific value."""

    value: str | int | bool


class Range(BaseModel):
    """Condition for numerical range filtering."""

    gt: Optional[float] = None
    gte: Optional[float] = None
    lt: Optional[float] = None
    lte: Optional[float] = None


class FieldCondition(BaseModel):
    """A single condition applied to a payload field."""

    key: str
    match: Optional[MatchValue] = None
    range: Optional[Range] = None


class Filter(BaseModel):
    """A collection of conditions combined with logical operators."""

    must: Optional[List[FieldCondition]] = None
    must_not: Optional[List[FieldCondition]] = None
    should: Optional[List[FieldCondition]] = None


# --- Collection & Point Models ---
class VectorParams(BaseModel):
    """Configuration for a collection's vector storage."""

    size: int
    distance: Distance


class CollectionConfig(BaseModel):
    """Payload for creating a new collection."""

    vectors_config: VectorParams


class PointStruct(BaseModel):
    """Structure for a single data point to be inserted/updated."""

    id: Union[int, str]
    vector: List[float]
    payload: Optional[Dict[str, Any]] = None


class UpsertPayload(BaseModel):
    """Payload for batch upserting points."""

    points: List[PointStruct]
    wait: bool = True


# --- Search Models ---
class SearchPayload(BaseModel):
    """Payload for performing a vector search."""

    vector: List[float]
    limit: int
    with_payload: bool = True
    with_vector: bool = False
    filter: Optional[Filter] = None
    score_threshold: Optional[float] = None


class ScoredPoint(BaseModel):
    """Structure of a point returned in search results."""

    id: Union[int, str]
    score: float
    payload: Optional[Dict[str, Any]] = None
    vector: Optional[List[float]] = None


# --- Custom Qdrant Client Class ---


class CustomQdrantClient:
    """
    A requests/Pydantic-based client wrapper for the Qdrant REST API.
    Supports both self-hosted and cloud-managed instances.
    """

    def __init__(self, host: str, api_key: Optional[str] = None, timeout: int = 30):
        """
        Initializes the client.

        :param host: The URL of the Qdrant instance (e.g., "http://localhost:6333" or "https://<cloud_url>").
        :param api_key: Optional API key for cloud instances.
        :param timeout: Request timeout in seconds (default: 30).
        """
        self.host = host.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self.headers = {"Content-Type": "application/json"}
        if self.api_key:
            # Authentication header required for Qdrant Cloud
            self.headers["api-key"] = self.api_key

        self._check_connection()

    def _check_connection(self):
        """Checks the connection to the Qdrant instance."""
        logger.info(f"Checking connection to Qdrant at {self.host}...")
        try:
            # Use a simple, lightweight endpoint to check connection
            self._request("GET", "/collections")
            logger.info("Successfully connected to Qdrant.")
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to connect to Qdrant at {self.host}. Error: {e}")
            raise ValueError(f"Failed to connect to Qdrant at {self.host}.")
        except Exception as e:
            logger.error(f"An unexpected error occurred during connection check: {e}")
            raise ValueError("An unexpected error occurred during connection check.")

    def _request(
        self, method: str, path: str, data: Optional[BaseModel] = None
    ) -> dict:
        """Helper for making authenticated API requests."""
        url = f"{self.host}{path}"
        # Convert Pydantic model to JSON, excluding fields with None values
        payload = data.model_dump_json(exclude_none=True) if data else None

        try:
            response = requests.request(
                method,
                url,
                headers=self.headers,
                data=payload,
                timeout=self.timeout,
            )

            result_data = response.json()
            logger.debug(f"👉 result_data: {result_data}")

            status = result_data.get("status")
            if status == "ok":
                return result_data
            else:
                error_msg = result_data.get("error", "Unknown error")
                logger.error(f"Qdrant API error: {error_msg}")
                raise Exception(error_msg)

        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed to {url}. Error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in request: {e}")
            raise

    def create_collection(
        self, collection_name: str, vector_size: int, distance: Distance = "Cosine"
    ) -> dict:
        """Creates a vector collection using the PUT /collections/{name} endpoint."""
        path = f"/collections/{collection_name}"
        config = CollectionConfig(
            vectors_config=VectorParams(size=vector_size, distance=distance)
        )
        logger.info(
            f"Creating collection '{collection_name}' with vector size {vector_size} and distance {distance}..."
        )
        return self._request("PUT", path, config)

    def collection_exists(self, collection_name: str) -> bool:
        """Check if a collection exists."""
        try:
            self.get_collection(collection_name)
            return True
        except Exception:
            return False

    def upsert_points(self, collection_name: str, points: List[PointStruct]) -> dict:
        """Inserts or updates points in a collection using the PUT /collections/{name}/points endpoint."""
        path = f"/collections/{collection_name}/points"
        payload = UpsertPayload(points=points, wait=True)
        logger.info(f"Upserting {len(points)} points into '{collection_name}'...")
        return self._request("PUT", path, payload)

    def search(
        self,
        collection_name: str,
        vector: Union[List[float], np.ndarray],
        limit: int,
        query_filter: Optional[Filter] = None,
        score_threshold: Optional[float] = None,
        with_payload: bool = True,
        with_vector: bool = False,
    ) -> List[ScoredPoint]:
        """Performs a vector similarity search using the POST /collections/{name}/points/search endpoint."""
        # Convert numpy array to list if needed
        if isinstance(vector, np.ndarray):
            vector = vector.tolist()

        path = f"/collections/{collection_name}/points/search"
        search_payload = SearchPayload(
            vector=vector,
            limit=limit,
            filter=query_filter,
            score_threshold=score_threshold,
            with_payload=with_payload,
            with_vector=with_vector,
        )

        if query_filter:
            # Dump filter nicely for console output
            logger.debug(
                f"Applying filter: {query_filter.model_dump_json(indent=2, exclude_none=True)}"
            )

        response = self._request("POST", path, search_payload)

        # Validate and convert the search results into ScoredPoint objects
        results = response.get("result", [])
        return [ScoredPoint(**hit) for hit in results]

    def query_points(
        self,
        collection_name: str,
        vector: Union[List[float], np.ndarray],
        limit: int,
        query_filter: Optional[Filter] = None,
        score_threshold: Optional[float] = None,
        with_payload: bool = True,
        with_vector: bool = False,
    ) -> List[ScoredPoint]:
        """Alias for search method - maintains backward compatibility."""
        return self.search(
            collection_name=collection_name,
            vector=vector,
            limit=limit,
            query_filter=query_filter,
            score_threshold=score_threshold,
            with_payload=with_payload,
            with_vector=with_vector,
        )

    def get_collections(self) -> dict:
        """Gets all collections using the GET /collections endpoint."""
        path = "/collections"
        return self._request("GET", path)

    def get_collection(self, collection_name: str) -> dict:
        """Gets collection information using the GET /collections/{name} endpoint."""
        path = f"/collections/{collection_name}"
        return self._request("GET", path)

    def delete_points(
        self, collection_name: str, points_ids: List[Union[int, str]]
    ) -> dict:
        """Deletes points from a collection using the POST /collections/{name}/points/delete endpoint."""
        path = f"/collections/{collection_name}/points/delete"

        class DeletePayload(BaseModel):
            points: List[Union[int, str]]

        payload = DeletePayload(points=points_ids)
        logger.info(f"Deleting {len(points_ids)} points from '{collection_name}'...")
        return self._request("POST", path, payload)

    def delete_collection(self, collection_name: str) -> dict:
        """Deletes a collection using the DELETE /collections/{name} endpoint."""
        path = f"/collections/{collection_name}"
        logger.info(f"Deleting collection '{collection_name}'...")
        return self._request("DELETE", path)

    def scroll(
        self,
        collection_name: str,
        limit: int = 10,
        offset: Optional[str] = None,
        filter: Optional[Filter] = None,
        with_payload: bool = True,
        with_vector: bool = False,
    ) -> tuple[List[ScoredPoint], Optional[str]]:
        """Scroll through all points in a collection."""
        path = f"/collections/{collection_name}/points/scroll"

        scroll_payload = {
            "limit": limit,
            "with_payload": with_payload,
            "with_vector": with_vector,
        }

        if offset:
            scroll_payload["offset"] = offset

        if filter:
            scroll_payload["filter"] = filter.model_dump(exclude_none=True)

        response = self._request("POST", path, scroll_payload)

        results = response.get("result", [])
        points = [ScoredPoint(**hit) for hit in results]
        next_page_offset = response.get("next_page_offset")

        return points, next_page_offset

    def count_points(
        self, collection_name: str, filter: Optional[Filter] = None
    ) -> dict:
        """Count points in a collection, optionally with a filter."""
        path = f"/collections/{collection_name}/points/count"

        count_payload = {}
        if filter:
            count_payload["filter"] = filter.model_dump(exclude_none=True)

        return self._request("POST", path, count_payload if count_payload else None)
