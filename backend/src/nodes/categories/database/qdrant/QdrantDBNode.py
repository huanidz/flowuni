import json
from typing import Any, Dict, List, Optional

from loguru import logger
from src.components.embedding.models.core import EmbeddingInput, EmbeddingResponse
from src.components.embedding.providers.EmbeddingProviderFactory import (
    EmbeddingProviderBase,
    EmbeddingProviderFactory,
)
from src.consts.node_consts import NODE_GROUP_CONSTS
from src.helpers.custom_clients.CustomQdrantClient import CustomQdrantClient, Filter
from src.nodes.core.NodeIcon import NodeIconIconify
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs import (
    EmbeddingProviderInputHandle,
    KeyValueInputHandle,
    SecretTextInputHandle,
    TextFieldInputHandle,
)
from src.nodes.handles.basics.inputs.DropdownInputHandle import (
    DropdownInputHandle,
    DropdownOption,
)
from src.nodes.handles.basics.inputs.KeyValueInputHandle import (
    KeyValueItem,
    KVValueDType,
)
from src.nodes.handles.basics.outputs.StringOutputHandle import StringOutputHandle
from src.nodes.NodeBase import Node, NodeSpec


class QdrantDBNode(Node):
    """Node for interacting with Qdrant vector database."""

    spec: NodeSpec = NodeSpec(
        name="Qdrant Database",
        description="Connect to Qdrant vector database for vector operations.",
        inputs=[
            NodeInput(
                name="url",
                type=TextFieldInputHandle(
                    placeholder="http://localhost:6333",
                    multiline=False,
                ),
                description="Qdrant server connection URL/Endpoint. (e.g., https://some-uuid.us-east4-0.gcp.cloud.qdrant.io)",
                required=True,
                allow_incoming_edges=False,
            ),
            # API
            NodeInput(
                name="api_key",
                type=SecretTextInputHandle(
                    allow_visible_toggle=True,
                    multiline=False,
                ),
                description="Qdrant API key",
                required=True,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="collection_name",
                type=TextFieldInputHandle(
                    placeholder="my-collection",
                    multiline=False,
                ),
                description="Name of the Qdrant collection",
                required=True,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="operation",
                type=DropdownInputHandle(
                    options=[
                        DropdownOption(label="Search", value="search"),
                        DropdownOption(label="Insert", value="insert"),
                        DropdownOption(label="Update", value="update"),
                        DropdownOption(label="Delete", value="delete"),
                    ],
                    searchable=True,
                ),
                description="Operation to perform",
                required=True,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="data",
                type=KeyValueInputHandle(
                    allow_custom_keys=False,
                    fixed_items=[
                        KeyValueItem(
                            key="ids",
                            value="",
                            description="IDs to work with, separated by commas",
                        ),
                        KeyValueItem(
                            key="text_query",
                            value="",
                            description="Text query. This will be embedded to get the vector.",
                        ),
                        KeyValueItem(
                            key="payload",
                            value="",
                            value_placeholder="{sample_payload}",
                            multiline=True,
                            description="Payload for the operation. Should be in JSON format.",
                        ),
                        KeyValueItem(
                            key="filter",
                            value="",
                            multiline=True,
                            description="Filter for the operation. Should be in JSON format.",
                        ),
                        KeyValueItem(
                            key="limit",
                            value="",
                            value_placeholder="5",
                            multiline=False,
                            dtype=KVValueDType.NUMBER,
                        ),
                    ],
                ),
                description="Data for the operation.",
                enable_as_whole_for_tool=True,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="embedding_helper",
                type=EmbeddingProviderInputHandle(),
                description="Embedding provider for vector operations",
                required=True,
            ),
        ],
        outputs=[
            NodeOutput(
                name="result",
                type=StringOutputHandle(),
                description="Result of the operation as JSON string",
            )
        ],
        parameters=[],
        can_be_tool=False,
        group=NODE_GROUP_CONSTS.DATABASE,
        icon=NodeIconIconify(icon_value="mdi:database"),
    )

    def process(
        self, input_values: Dict[str, Any], parameter_values: Dict[str, Any]
    ) -> Any:
        """
        Process Qdrant database operations.

        Args:
            input_values: Dictionary containing operation parameters
            parameter_values: Dictionary of parameter values (unused in this node)

        Returns:
            Dictionary with result key containing JSON string of operation results
        """
        url = input_values.get("url")
        api_key = input_values.get("api_key")
        collection_name = input_values.get("collection_name")
        operation = input_values.get("operation")
        embedding_helper = input_values.get("embedding_helper")

        embedding_helper_instance = EmbeddingProviderFactory.get_provider(
            provider_name=embedding_helper["provider"]
        )

        embedding_helper_instance.init(
            model=embedding_helper["model"],
            api_key=embedding_helper["api_key"],
        )

        data = input_values.get("data")
        ids = data.get("ids")
        text_query = data.get("text_query")
        payload = data.get("payload")
        filter = data.get("filter")
        limit = data.get("limit")

        # Validate required inputs
        if not url:
            raise ValueError("Database connection URL is required")
        if not collection_name:
            raise ValueError("Collection name is required")
        if not operation:
            raise ValueError("Operation is required")
        if not embedding_helper:
            raise ValueError("Embedding helper is required")

        # Initialize Qdrant client
        qdrant_client = None
        try:
            qdrant_client = CustomQdrantClient(host=url, api_key=api_key)
            logger.info(f"Connected to Qdrant at: {url}")
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {str(e)}")
            raise ValueError(f"Failed to connect to Qdrant at {url}.")

        if not qdrant_client:
            raise ValueError("Failed to connect to Qdrant.")

        try:
            # Handle different operations
            if operation == "search":
                result = self._search_ops(
                    qdrant_client=qdrant_client,
                    collection_name=collection_name,
                    text_query=text_query,
                    filter_str=filter,
                    limit=limit,
                    embedding_helper_instance=embedding_helper_instance,
                )
            elif operation == "insert":
                # For insert operation, we would need vectors to insert
                # Since we don't have a direct input, we'll return an error message
                # explaining that this operation requires additional parameters
                result = json.dumps(
                    {
                        "error": "Insert operation requires vectors to insert. Please use the embedding helper to generate them.",
                        "status": "failed",
                    }
                )

            elif operation == "update":
                # For update operation, we would need vectors to update
                # Since we don't have a direct input, we'll return an error message
                # explaining that this operation requires additional parameters
                result = json.dumps(
                    {
                        "error": "Update operation requires vectors to update. Please use the embedding helper to generate them.",
                        "status": "failed",
                    }
                )

            elif operation == "delete":
                # For delete operation, we would need IDs to delete
                # Since we don't have a direct input, we'll return an error message
                # explaining that this operation requires additional parameters
                result = json.dumps(
                    {
                        "error": "Delete operation requires IDs to delete. Please provide them through the embedding helper.",
                        "status": "failed",
                    }
                )

            else:
                result = json.dumps(
                    {"error": f"Unknown operation: {operation}", "status": "failed"}
                )

            logger.info(f"Qdrant operation '{operation}' completed successfully")
            return {"result": result}

        except Exception as e:
            logger.error(f"Error in Qdrant operation '{operation}': {str(e)}")
            error_result = json.dumps({"error": str(e), "status": "failed"})
            return {"result": error_result}

    def build_tool(self, inputs_values: Dict[str, Any], tool_configs: Any) -> Any:
        """Build tool method - not implemented for this node."""
        raise NotImplementedError("QdrantDBNode does not support tool mode")

    def process_tool(
        self,
        inputs_values: Dict[str, Any],
        parameter_values: Dict[str, Any],
        tool_inputs: Dict[str, Any],
    ) -> Any:
        """Process tool method - not implemented for this node."""
        raise NotImplementedError("QdrantDBNode does not support tool mode")

    def _search_ops(
        self,
        qdrant_client: CustomQdrantClient,
        collection_name: str,
        text_query: str,
        filter_str: Optional[str],
        limit: Optional[str],
        embedding_helper_instance: EmbeddingProviderBase,
    ) -> str:
        """
        Perform a search operation in Qdrant.

        Args:
            qdrant_client: The Qdrant client instance.
            collection_name: Name of the collection to search in.
            text_query: The text query to embed and search for.
            filter_str: Optional filter string in JSON format.
            limit: Optional limit for the number of results.
            embedding_helper_instance: The embedding provider instance.

        Returns:
            JSON string containing the search results.
        """
        # Validate search-specific inputs
        if not text_query:
            raise ValueError("Text query is required for search operation")

        # Generate query vector from text
        query_vector = self._get_embeddings(
            text=text_query, embedding_helper_instance=embedding_helper_instance
        )

        # Parse filter if provided
        query_filter = None
        if filter_str:
            try:
                filter_dict = json.loads(filter_str)
                query_filter = Filter(**filter_dict)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid filter JSON format: {str(e)}")
            except Exception as e:
                raise ValueError(f"Invalid filter format: {str(e)}")

        # Parse limit
        search_limit = int(limit) if limit else 5
        if search_limit <= 0:
            raise ValueError("Limit must be a positive number")

        # Perform search
        search_results = qdrant_client.search(
            collection_name=collection_name,
            vector=query_vector,
            limit=search_limit,
            query_filter=query_filter,
        )

        # Convert results to JSON-serializable format
        results = []
        for hit in search_results:
            result_item = {
                "id": hit.id,
                "score": hit.score,
                "payload": hit.payload,
            }
            if hit.vector is not None:
                result_item["vector"] = hit.vector
            results.append(result_item)

        return json.dumps(
            {
                "results": results,
                "status": "success",
                "query": text_query,
                "limit": search_limit,
            }
        )

    def _get_embeddings(
        self, text: str, embedding_helper_instance: EmbeddingProviderBase
    ) -> List[float]:
        embed_input = EmbeddingInput(
            text=text,
        )

        embed_output: EmbeddingResponse = embedding_helper_instance.get_embeddings(
            input=embed_input
        )
        embeddings = embed_output.embeddings

        return embeddings
