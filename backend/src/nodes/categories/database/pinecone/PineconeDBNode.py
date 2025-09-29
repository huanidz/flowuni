import json
from typing import Any, Dict, List, Optional

from loguru import logger
from pinecone import Pinecone, ServerlessSpec
from src.consts.node_consts import NODE_GROUP_CONSTS
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


class PineconeDBNode(Node):
    """Node for interacting with Pinecone vector database."""

    spec: NodeSpec = NodeSpec(
        name="Pinecone Database",
        description="Connect to Pinecone vector database for vector operations.",
        inputs=[
            NodeInput(
                name="api_key",
                type=TextFieldInputHandle(
                    placeholder="your-pinecone-api-key",
                    multiline=False,
                ),
                description="Pinecone API key",
                required=True,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="environment",
                type=DropdownInputHandle(
                    options=[
                        DropdownOption(label="US East 1", value="us-east1-gcp"),
                        DropdownOption(label="US West 2", value="us-west2-gcp"),
                        DropdownOption(label="US Central 1", value="us-central1-gcp"),
                        DropdownOption(label="Europe West 1", value="europe-west1-gcp"),
                    ],
                    searchable=True,
                ),
                description="Pinecone environment/region",
                required=True,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="index_name",
                type=TextFieldInputHandle(
                    placeholder="my-index",
                    multiline=False,
                ),
                description="Name of the Pinecone index",
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
                description="Dimension of the vectors (required for index creation)",
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
                        DropdownOption(label="Create Index", value="create_index"),
                        DropdownOption(label="List Indexes", value="list_indexes"),
                        DropdownOption(label="Describe Index", value="describe_index"),
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
                    placeholder='[{"id": "vec1", "values": [0.1, 0.2, ...]}]',
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
                name="top_k",
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
                    placeholder='{"genre": "comedy"}',
                    multiline=False,
                ),
                description="Metadata filter for query (JSON format)",
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
        Process Pinecone database operations.

        Args:
            input_values: Dictionary containing operation parameters
            parameter_values: Dictionary of parameter values (unused in this node)

        Returns:
            Dictionary with result key containing JSON string of operation results
        """
        api_key = input_values.get("api_key")
        environment = input_values.get("environment")
        index_name = input_values.get("index_name")
        dimension = input_values.get("dimension")
        operation = input_values.get("operation")
        vectors = input_values.get("vectors")
        query_vector = input_values.get("query_vector")
        top_k = input_values.get("top_k", 10)
        filter_expr = input_values.get("filter")
        ids_to_delete = input_values.get("ids_to_delete")
        embedding_provider = input_values.get("embedding_provider")

        # Validate required inputs
        if not api_key:
            raise ValueError("API key is required")
        if not environment:
            raise ValueError("Environment is required")
        if not index_name:
            raise ValueError("Index name is required")
        if not operation:
            raise ValueError("Operation is required")

        # Initialize Pinecone client
        try:
            pc = Pinecone(api_key=api_key)
            logger.info(f"Connected to Pinecone environment: {environment}")
        except Exception as e:
            logger.error(f"Failed to connect to Pinecone: {str(e)}")
            error_result = json.dumps({"error": str(e), "status": "failed"})
            return {"result": error_result}

        try:
            # Handle different operations
            if operation == "create_index":
                if not dimension:
                    raise ValueError("Dimension is required for index creation")

                # Check if index already exists
                existing_indexes = pc.list_indexes().names()
                if index_name in existing_indexes:
                    result = json.dumps(
                        {
                            "status": "warning",
                            "message": f"Index '{index_name}' already exists",
                        }
                    )
                else:
                    # Create new index
                    pc.create_index(
                        name=index_name,
                        dimension=dimension,
                        metric="cosine",
                        spec=ServerlessSpec(cloud="gcp", environment=environment),
                    )
                    result = json.dumps(
                        {
                            "status": "success",
                            "message": f"Index '{index_name}' created successfully",
                        }
                    )

            elif operation == "list_indexes":
                indexes = pc.list_indexes()
                index_list = [
                    {"name": name, "dimension": idx.dimension, "metric": idx.metric}
                    for name, idx in zip(indexes.names(), indexes.describe())
                ]
                result = json.dumps({"indexes": index_list})

            elif operation == "describe_index":
                try:
                    index_info = pc.describe_index(index_name)
                    result = json.dumps(
                        {
                            "name": index_info.name,
                            "dimension": index_info.dimension,
                            "metric": index_info.metric,
                            "status": index_info.status,
                        }
                    )
                except Exception as e:
                    result = json.dumps(
                        {
                            "error": f"Index '{index_name}' not found or error describing index: {str(e)}",
                            "status": "failed",
                        }
                    )

            elif operation in ["query", "upsert", "delete"]:
                # Connect to the index
                try:
                    index = pc.Index(index_name)
                except Exception as e:
                    result = json.dumps(
                        {
                            "error": f"Failed to connect to index '{index_name}': {str(e)}",
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
                            parsed_filter = json.loads(filter_expr)
                        except json.JSONDecodeError:
                            raise ValueError("Invalid JSON format for filter")

                    # Execute query
                    query_params = {
                        "vector": query_vec,
                        "top_k": top_k,
                        "include_values": True,
                        "include_metadata": True,
                    }
                    if parsed_filter:
                        query_params["filter"] = parsed_filter

                    query_result = index.query(**query_params)
                    result = json.dumps(query_result)

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

                    # Execute upsert
                    upsert_result = index.upsert(vectors=vectors_data)
                    result = json.dumps(upsert_result)

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
                    delete_result = index.delete(ids=ids)
                    result = json.dumps(delete_result)

            else:
                result = json.dumps(
                    {"error": f"Unknown operation: {operation}", "status": "failed"}
                )

            logger.info(f"Pinecone operation '{operation}' completed successfully")
            return {"result": result}

        except Exception as e:
            logger.error(f"Error in Pinecone operation '{operation}': {str(e)}")
            error_result = json.dumps({"error": str(e), "status": "failed"})
            return {"result": error_result}

    def build_tool(self, inputs_values: Dict[str, Any], tool_configs: Any) -> Any:
        """Build tool method - not implemented for this node."""
        raise NotImplementedError("PineconeDBNode does not support tool mode")

    def process_tool(
        self,
        inputs_values: Dict[str, Any],
        parameter_values: Dict[str, Any],
        tool_inputs: Dict[str, Any],
    ) -> Any:
        """Process tool method - not implemented for this node."""
        raise NotImplementedError("PineconeDBNode does not support tool mode")
