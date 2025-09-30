from typing import Any, Dict, List, Optional

from loguru import logger
from pinecone import Pinecone
from pydantic import BaseModel


class PineconeVector(BaseModel):
    """Structure for a single vector to be inserted/updated."""

    id: str
    values: List[float]
    metadata: Optional[Dict[str, Any]] = None


class PineconeUpsertPayload(BaseModel):
    """Payload for upserting vectors."""

    vectors: List[PineconeVector]
    namespace: Optional[str] = None


class PineconeQueryPayload(BaseModel):
    """Payload for performing a vector search."""

    vector: List[float]
    top_k: int
    namespace: Optional[str] = None
    filter: Optional[Dict[str, Any]] = None
    include_metadata: bool = True
    include_values: bool = False


class PineconeQueryResult(BaseModel):
    """Structure of a result returned in search results."""

    id: str
    score: float
    values: Optional[List[float]] = None
    metadata: Optional[Dict[str, Any]] = None


class PineconeFetchResult(BaseModel):
    """Structure for fetch results."""

    vectors: Dict[str, Dict[str, Any]]
    namespace: str


class CustomPineconeClient:
    """
    A wrapper for the Pinecone client with additional functionality.
    """

    def __init__(
        self,
        api_key: str,
        index_name: str,
        cloud: str = "aws",
        region: str = "us-east-1",
    ):
        """
        Initializes the Pinecone client.

        Args:
            api_key: Pinecone API key
            index_name: Name of the Pinecone index to use
            cloud: Cloud provider (aws, gcp, azure)
            region: Region for the index
        """
        self.api_key = api_key
        self.index_name = index_name
        self.cloud = cloud
        self.region = region
        self.pc = None
        self.index = None

        self._initialize_client()

    def _initialize_client(self):
        """Initialize the Pinecone client and connect to the index."""
        try:
            # Initialize Pinecone
            self.pc = Pinecone(api_key=self.api_key)
            logger.info("Pinecone client initialized successfully")

            # Check if index exists
            index_name_strs = [index["name"] for index in self.pc.list_indexes()]
            if self.index_name not in index_name_strs:
                logger.warning(f"Index '{self.index_name}' does not exist")
                # Note: We won't create the index automatically as it requires dimension specification
                raise ValueError(
                    f"Index '{self.index_name}' does not exist. Please create it first."
                )

            # Connect to the index
            self.index = self.pc.Index(self.index_name)
            logger.info(f"Successfully connected to index '{self.index_name}'")

        except Exception as e:
            logger.error(f"Failed to initialize Pinecone client: {str(e)}")
            raise ValueError(f"Failed to initialize Pinecone client: {str(e)}")

    def upsert(
        self, vectors: List[PineconeVector], namespace: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Insert or update vectors in the index.

        Args:
            vectors: List of vectors to upsert
            namespace: Optional namespace to upsert to

        Returns:
            Dictionary containing the upsert result
        """
        if not self.index:
            raise ValueError("Index not initialized")

        try:
            # Convert to the format expected by Pinecone
            pinecone_vectors = []
            for vector in vectors:
                pinecone_vectors.append(
                    {
                        "id": vector.id,
                        "values": vector.values,
                        "metadata": vector.metadata or {},
                    }
                )

            # Perform upsert
            result = self.index.upsert(vectors=pinecone_vectors, namespace=namespace)
            logger.info(
                f"Successfully upserted {len(vectors)} vectors to index '{self.index_name}'"
            )
            return result

        except Exception as e:
            logger.error(f"Error during upsert operation: {str(e)}")
            raise ValueError(f"Failed to upsert vectors: {str(e)}")

    def query(
        self,
        vector: List[float],
        top_k: int,
        namespace: Optional[str] = None,
        filter_dict: Optional[Dict[str, Any]] = None,
        include_metadata: bool = True,
        include_values: bool = False,
    ) -> Dict[str, Any]:
        """
        Perform a vector similarity search.

        Args:
            vector: Query vector
            top_k: Number of results to return
            namespace: Optional namespace to search in
            filter_dict: Optional filter dictionary for metadata filtering
            include_metadata: Whether to include metadata in results
            include_values: Whether to include vector values in results

        Returns:
            Dictionary containing the search results
        """
        if not self.index:
            raise ValueError("Index not initialized")

        try:
            # Perform query
            result = self.index.query(
                vector=vector,
                top_k=top_k,
                namespace=namespace,
                filter=filter_dict,
                include_metadata=include_metadata,
                include_values=include_values,
            )

            logger.info(
                f"Successfully queried index '{self.index_name}' with top_k={top_k}"
            )
            return result

        except Exception as e:
            logger.error(f"Error during query operation: {str(e)}")
            raise ValueError(f"Failed to query index: {str(e)}")

    def fetch(self, ids: List[str], namespace: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch specific vectors by ID.

        Args:
            ids: List of vector IDs to fetch
            namespace: Optional namespace to fetch from

        Returns:
            Dictionary containing the fetch results
        """
        if not self.index:
            raise ValueError("Index not initialized")

        try:
            # Perform fetch
            result = self.index.fetch(ids=ids, namespace=namespace)
            logger.info(
                f"Successfully fetched {len(ids)} vectors from index '{self.index_name}'"
            )
            return result

        except Exception as e:
            logger.error(f"Error during fetch operation: {str(e)}")
            raise ValueError(f"Failed to fetch vectors: {str(e)}")

    def delete(
        self,
        ids: List[str] = None,
        delete_all: bool = False,
        namespace: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Delete vectors from the index.

        Args:
            ids: List of vector IDs to delete. If None and delete_all is False, no action.
            delete_all: If True, deletes all vectors from the index
            namespace: Optional namespace to delete from

        Returns:
            Dictionary containing the delete result
        """
        if not self.index:
            raise ValueError("Index not initialized")

        try:
            if delete_all:
                # Delete all vectors
                result = self.index.delete(delete_all=True, namespace=namespace)
                logger.info(
                    f"Successfully deleted all vectors from index '{self.index_name}'"
                )
                return result
            elif ids:
                # Delete specific vectors
                result = self.index.delete(ids=ids, namespace=namespace)
                logger.info(
                    f"Successfully deleted vectors {ids} from index '{self.index_name}'"
                )
                return result
            else:
                logger.warning("No vectors specified for deletion")
                return {
                    "status": "no_action",
                    "message": "No vectors specified for deletion",
                }

        except Exception as e:
            logger.error(f"Error during delete operation: {str(e)}")
            raise ValueError(f"Failed to delete vectors: {str(e)}")

    def describe_index(self) -> str:
        """
        Get information about the current index.

        Returns:
            Dictionary containing index information
        """
        if not self.pc:
            raise ValueError("Pinecone client not initialized")

        try:
            description = self.pc.describe_index(self.index_name)
            logger.info(
                f"Successfully retrieved information for index '{self.index_name}'"
            )
            return str(description)

        except Exception as e:
            logger.error(f"Error describing index: {str(e)}")
            raise ValueError(f"Failed to describe index: {str(e)}")

    def list_indexes(self) -> List[Dict[str, Any]]:
        """
        List all available indexes.

        Returns:
            List of dictionaries containing index information
        """
        if not self.pc:
            raise ValueError("Pinecone client not initialized")

        try:
            indexes = self.pc.list_indexes()
            logger.info("Successfully listed all indexes")
            return indexes

        except Exception as e:
            logger.error(f"Error listing indexes: {str(e)}")
            raise ValueError(f"Failed to list indexes: {str(e)}")

    def update_vector(
        self,
        vector_id: str,
        values: Optional[List[float]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        namespace: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Update a specific vector in the index.

        Args:
            vector_id: ID of the vector to update
            values: New vector values. If None, only metadata is updated
            metadata: New metadata dictionary
            namespace: Optional namespace to update in

        Returns:
            Dictionary containing the update result
        """
        if not self.index:
            raise ValueError("Index not initialized")

        try:
            update_dict = {}

            if values is not None:
                update_dict["values"] = values
            if metadata is not None:
                update_dict["set_metadata"] = metadata

            if update_dict:
                result = self.index.update(
                    id=vector_id, **update_dict, namespace=namespace
                )
                logger.info(
                    f"Successfully updated vector '{vector_id}' in index '{self.index_name}'"
                )
                return result
            else:
                logger.warning("No updates provided")
                return {"status": "no_action", "message": "No updates provided"}

        except Exception as e:
            logger.error(f"Error updating vector: {str(e)}")
            raise ValueError(f"Failed to update vector: {str(e)}")
