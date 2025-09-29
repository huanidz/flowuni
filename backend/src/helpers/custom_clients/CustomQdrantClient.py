from typing import Any, Dict, List, Literal, Optional

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

    id: int | str
    vector: List[float]
    payload: Dict[str, Any]


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


class ScoredPoint(BaseModel):
    """Structure of a point returned in search results."""

    id: int
    score: float
    payload: Dict[str, Any]
    vector: Optional[List[float]] = None


# --- Custom Qdrant Client Class ---


class CustomQdrantClient:
    """
    A simple requests/Pydantic-based client wrapper for the Qdrant REST API.
    Supports both self-hosted and cloud-managed instances.
    """

    def __init__(self, host: str, api_key: Optional[str] = None):
        """
        Initializes the client.

        :param host: The URL of the Qdrant instance (e.g., "http://localhost:6333" or "https://<cloud_url>").
        :param api_key: Optional API key for cloud instances.
        """
        self.host = host.rstrip("/")
        self.api_key = api_key
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
            logger.info(f"Failed to connect to Qdrant at {self.host}. Error: {e}")
            raise ValueError(f"Failed to connect to Qdrant at {self.host}.")
        except Exception as e:
            logger.info(f"An unexpected error occurred during connection check: {e}")
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
                timeout=15,  # Set a reasonable timeout
            )
            response.raise_for_status()

            result_data = response.json()
            logger.info(f"👉 result_data: {result_data}")

            status = result_data.get("status")
            if status == "ok":
                return result_data
            else:
                raise Exception(result_data.get("error", "Unknown error"))

        except requests.exceptions.RequestException as e:
            print(f"Request failed to {url}. Error: {e}")
            raise

    def create_collection(
        self, collection_name: str, vector_size: int, distance: Distance = "Cosine"
    ):
        """Creates a vector collection using the PUT /collections/{name} endpoint."""
        path = f"/collections/{collection_name}"
        config = CollectionConfig(
            vectors_config=VectorParams(size=vector_size, distance=distance)
        )
        print(f"Creating collection '{collection_name}'...")
        return self._request("PUT", path, config)

    def upsert_points(self, collection_name: str, points: List[PointStruct]):
        """Inserts or updates points in a collection using the PUT /collections/{name}/points endpoint."""
        path = f"/collections/{collection_name}/points"
        payload = UpsertPayload(points=points, wait=True)
        print(f"Upserting {len(points)} points into '{collection_name}'...")
        return self._request("PUT", path, payload)

    def search(
        self,
        collection_name: str,
        vector: List[float],
        limit: int,
        query_filter: Optional[Filter] = None,
    ) -> List[ScoredPoint]:
        """Performs a vector similarity search using the POST /collections/{name}/points/search endpoint."""
        path = f"/collections/{collection_name}/points/search"
        search_payload = SearchPayload(vector=vector, limit=limit, filter=query_filter)

        if query_filter:
            # Dump filter nicely for console output
            print(
                f"Applying filter: {query_filter.model_dump_json(indent=2, exclude_none=True)}"
            )

        response = self._request("POST", path, search_payload)

        # Validate and convert the search results into ScoredPoint objects
        results = response.get("result", [])
        return [ScoredPoint(**hit) for hit in results]

    def get_collections(self):
        """Gets all collections using the GET /collections endpoint."""
        path = "/collections"
        return self._request("GET", path)

    def get_collection(self, collection_name: str):
        """Gets collection information using the GET /collections/{name} endpoint."""
        path = f"/collections/{collection_name}"
        return self._request("GET", path)

    def delete_points(self, collection_name: str, points_ids: List[str]):
        """Deletes points from a collection using the POST /collections/{name}/points/delete endpoint."""
        path = f"/collections/{collection_name}/points/delete"

        class DeletePayload(BaseModel):
            points: List[str]

        payload = DeletePayload(points=points_ids)
        return self._request("POST", path, payload)
