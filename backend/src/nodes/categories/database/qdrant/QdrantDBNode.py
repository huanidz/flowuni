import json
from typing import Any, Dict, List, Optional

from loguru import logger
from src.consts.node_consts import NODE_GROUP_CONSTS
from src.helpers.custom_clients.CustomQdrantClient import CustomQdrantClient
from src.nodes.core.NodeIcon import NodeIconIconify
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs import (
    EmbeddingProviderInputHandle,
    NumberInputHandle,
    TextFieldInputHandle,
)
from src.nodes.handles.basics.inputs.DropdownInputHandle import (
    DropdownInputHandle,
    DropdownOption,
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
                description="Qdrant server URL",
                required=True,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="api_key",
                type=TextFieldInputHandle(
                    placeholder="your-api-key",
                    multiline=False,
                ),
                description="Qdrant API key (optional for local instances)",
                required=False,
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
                name="dimension",
                type=NumberInputHandle(
                    placeholder="1536",
                    min=1,
                    max=20000,
                ),
                description="Dimension of the vectors (required for collection creation)",
                required=False,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="operation",
                type=DropdownInputHandle(
                    options=[
                        DropdownOption(label="Query", value="query"),
                        DropdownOption(label="Upsert", value="upsert"),
                        DropdownOption(label="Delete", value="delete"),
                        DropdownOption(
                            label="Create Collection", value="create_collection"
                        ),
                        DropdownOption(
                            label="List Collections", value="list_collections"
                        ),
                        DropdownOption(
                            label="Describe Collection", value="describe_collection"
                        ),
                    ],
                    searchable=True,
                ),
                description="Operation to perform",
                required=True,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="vectors",
                type=TextFieldInputHandle(
                    placeholder='[{"id": "vec1", "vector": [0.1, 0.2, ...], "payload": {"key": "value"}}]',
                    multiline=True,
                ),
                description="Vectors to upsert (JSON format). Required for upsert operation.",
                required=False,
            ),
            NodeInput(
                name="query_vector",
                type=TextFieldInputHandle(
                    placeholder="[0.1, 0.2, 0.3, ...]",
                    multiline=False,
                ),
                description="Query vector for similarity search. Required for query operation.",
                required=False,
            ),
            NodeInput(
                name="limit",
                type=NumberInputHandle(
                    placeholder="10",
                    min=1,
                    max=1000,
                ),
                description="Number of results to return for query operation",
                required=False,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="filter",
                type=TextFieldInputHandle(
                    placeholder='{"key": "value"}',
                    multiline=False,
                ),
                description="Filter for query (JSON format)",
                required=False,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="ids_to_delete",
                type=TextFieldInputHandle(
                    placeholder='["id1", "id2", "id3"]',
                    multiline=False,
                ),
                description="IDs of vectors to delete (JSON array format). Required for delete operation.",
                required=False,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="distance_metric",
                type=DropdownInputHandle(
                    options=[
                        DropdownOption(label="Cosine", value="cosine"),
                        DropdownOption(label="Euclidean", value="euclidean"),
                        DropdownOption(label="Dot Product", value="dot"),
                    ],
                    searchable=True,
                ),
                description="Distance metric for vector comparison (used for collection creation)",
                required=False,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="embedding_provider",
                type=EmbeddingProviderInputHandle(),
                description="Embedding provider for vector operations (optional)",
                required=False,
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
        dimension = input_values.get("dimension")
        operation = input_values.get("operation")
        vectors = input_values.get("vectors")
        query_vector = input_values.get("query_vector")
        limit = input_values.get("limit", 10)
        filter_expr = input_values.get("filter")
        ids_to_delete = input_values.get("ids_to_delete")
        distance_metric = input_values.get("distance_metric", "cosine")
        embedding_provider = input_values.get("embedding_provider")

        # Validate required inputs
        if not url:
            raise ValueError("URL is required")
        if not collection_name:
            raise ValueError("Collection name is required")
        if not operation:
            raise ValueError("Operation is required")

        # Initialize Qdrant client
        try:
            client = CustomQdrantClient(host=url, api_key=api_key)
            logger.info(f"Connected to Qdrant at: {url}")
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {str(e)}")
            error_result = json.dumps({"error": str(e), "status": "failed"})
            return {"result": error_result}

        try:
            # Handle different operations
            if operation == "create_collection":
                if not dimension:
                    raise ValueError("Dimension is required for collection creation")

                # Map distance metric string to CustomQdrantClient format
                distance_map = {
                    "cosine": "Cosine",
                    "euclidean": "Euclid",
                    "dot": "Dot",
                }
                distance = distance_map.get(distance_metric, "Cosine")

                # Check if collection already exists
                collections = client.get_collections()
                collection_names = [collection.name for collection in collections]

                if collection_name in collection_names:
                    result = json.dumps(
                        {
                            "status": "warning",
                            "message": f"Collection '{collection_name}' already exists",
                        }
                    )
                else:
                    # Create new collection
                    client.create_collection(
                        collection_name=collection_name,
                        vector_size=dimension,
                        distance=distance,
                    )
                    result = json.dumps(
                        {
                            "status": "success",
                            "message": f"Collection '{collection_name}' created successfully",
                        }
                    )

            elif operation == "list_collections":
                collections = client.get_collections()
                collection_list = [
                    {"name": collection}
                    for collection in collections.get("result", {}).get(
                        "collections", []
                    )
                ]
                result = json.dumps({"collections": collection_list})

            elif operation == "describe_collection":
                try:
                    collection_info = client.get_collection(collection_name)
                    result = collection_info.get("result", {})
                    result["name"] = collection_name
                    result = json.dumps(result)
                except Exception as e:
                    result = json.dumps(
                        {
                            "error": f"Collection '{collection_name}' not found or error describing collection: {str(e)}",
                            "status": "failed",
                        }
                    )

            elif operation in ["query", "upsert", "delete"]:
                # Check if collection exists
                collections = client.get_collections().collections
                collection_names = [collection.name for collection in collections]

                if collection_name not in collection_names:
                    result = json.dumps(
                        {
                            "error": f"Collection '{collection_name}' does not exist",
                            "status": "failed",
                        }
                    )
                    return {"result": result}

                if operation == "query":
                    if not query_vector:
                        raise ValueError("Query vector is required for query operation")

                    # Parse query vector
                    try:
                        query_vec = json.loads(query_vector)
                        if not isinstance(query_vec, list):
                            raise ValueError("Query vector must be a list of numbers")
                    except json.JSONDecodeError:
                        raise ValueError("Invalid JSON format for query vector")

                    # Parse filter if provided
                    parsed_filter = None
                    if filter_expr:
                        try:
                            filter_dict = json.loads(filter_expr)
                            # Convert dict to CustomQdrantClient filter model
                            from src.helpers.custom_clients.CustomQdrantClient import (
                                Filter,
                            )

                            parsed_filter = Filter(**filter_dict)
                        except json.JSONDecodeError:
                            raise ValueError("Invalid JSON format for filter")
                        except Exception as e:
                            raise ValueError(f"Invalid filter format: {str(e)}")

                    # Execute query
                    search_result = client.search(
                        collection_name=collection_name,
                        vector=query_vec,
                        limit=limit,
                        query_filter=parsed_filter,
                    )

                    # Convert search result to serializable format
                    result_list = []
                    for hit in search_result:
                        result_list.append(
                            {
                                "id": str(hit.id),
                                "score": hit.score,
                                "payload": hit.payload,
                                "vector": hit.vector,
                            }
                        )

                    result = json.dumps({"results": result_list})

                elif operation == "upsert":
                    if not vectors:
                        raise ValueError("Vectors are required for upsert operation")

                    # Parse vectors
                    try:
                        vectors_data = json.loads(vectors)
                        if not isinstance(vectors_data, list):
                            raise ValueError("Vectors must be a list of vector objects")
                    except json.JSONDecodeError:
                        raise ValueError("Invalid JSON format for vectors")

                    # Convert to CustomQdrantClient points
                    from src.helpers.custom_clients.CustomQdrantClient import (
                        PointStruct,
                    )

                    points = []
                    for item in vectors_data:
                        point_id = item.get("id")
                        vector = item.get("vector")
                        payload = item.get("payload", {})

                        if not point_id or not vector:
                            raise ValueError(
                                "Each vector must have 'id' and 'vector' fields"
                            )

                        points.append(
                            PointStruct(id=point_id, vector=vector, payload=payload)
                        )

                    # Execute upsert
                    upsert_result = client.upsert_points(
                        collection_name=collection_name, points=points
                    )
                    result = json.dumps(
                        {
                            "status": "success",
                            "result": upsert_result,
                        }
                    )

                elif operation == "delete":
                    if not ids_to_delete:
                        raise ValueError(
                            "IDs to delete are required for delete operation"
                        )

                    # Parse IDs
                    try:
                        ids = json.loads(ids_to_delete)
                        if not isinstance(ids, list):
                            raise ValueError("IDs must be a list of strings")
                    except json.JSONDecodeError:
                        raise ValueError("Invalid JSON format for IDs to delete")

                    # Execute delete
                    delete_result = client.delete_points(
                        collection_name=collection_name,
                        points_ids=ids,
                    )
                    result = json.dumps(
                        {
                            "status": "success",
                            "result": delete_result,
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
