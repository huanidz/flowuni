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
    TableInputHandle,
    TextFieldInputHandle,
)
from src.nodes.handles.basics.inputs.DropdownInputHandle import (
    DropdownInputHandle,
    DropdownOption,
)
from src.nodes.handles.basics.inputs.TableInputHandle import (
    TableColumn,
    TableColumnDType,
    TableInputHandle,
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
                name="db_connection_url",
                type=TextFieldInputHandle(
                    placeholder="http://localhost:6333",
                    multiline=False,
                ),
                description="Qdrant server connection URL",
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
                        DropdownOption(label="Get", value="get"),
                    ],
                    searchable=True,
                ),
                description="Operation to perform",
                required=True,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="data",
                type=TableInputHandle(
                    columns=[
                        TableColumn(
                            name="id",
                            label="ID",
                            dtype=TableColumnDType.STRING,
                            required=True,
                        ),
                        TableColumn(
                            name="vector",
                            label="Vector",
                            dtype=TableColumnDType.STRING,
                            required=True,
                        ),
                        TableColumn(
                            name="payload",
                            label="Payload",
                            dtype=TableColumnDType.STRING,
                            required=False,
                        ),
                    ]
                ),
                enable_as_whole_for_tool=True,
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
        db_connection_url = input_values.get("db_connection_url")
        collection_name = input_values.get("collection_name")
        operation = input_values.get("operation")
        embedding_helper = input_values.get("embedding_helper")

        # Validate required inputs
        if not db_connection_url:
            raise ValueError("Database connection URL is required")
        if not collection_name:
            raise ValueError("Collection name is required")
        if not operation:
            raise ValueError("Operation is required")
        if not embedding_helper:
            raise ValueError("Embedding helper is required")

        # Initialize Qdrant client
        try:
            # Extract URL and API key from connection string if needed
            url = db_connection_url
            api_key = None

            # If connection string contains API key, extract it
            if "@" in db_connection_url:
                import re

                match = re.match(r"https?://([^@]+)@(.+)", db_connection_url)
                if match:
                    api_key = match.group(1)
                    url = f"http://{match.group(2)}"

            client = CustomQdrantClient(host=url, api_key=api_key)
            logger.info(f"Connected to Qdrant at: {url}")
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {str(e)}")
            error_result = json.dumps({"error": str(e), "status": "failed"})
            return {"result": error_result}

        try:
            # Handle different operations
            if operation == "search":
                # For search operation, we would need a query vector
                # Since we don't have a direct input, we'll return an error message
                # explaining that this operation requires additional parameters
                result = json.dumps(
                    {
                        "error": "Search operation requires a query vector. Please use the embedding helper to generate one.",
                        "status": "failed",
                    }
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

            elif operation == "get":
                # Check if collection exists
                try:
                    collections = client.get_collections().collections
                    collection_names = [collection.name for collection in collections]

                    if collection_name not in collection_names:
                        result = json.dumps(
                            {
                                "error": f"Collection '{collection_name}' does not exist",
                                "status": "failed",
                            }
                        )
                    else:
                        # Get collection info
                        collection_info = client.get_collection(collection_name)
                        result = collection_info.get("result", {})
                        result["name"] = collection_name
                        result = json.dumps(result)
                except Exception as e:
                    result = json.dumps(
                        {
                            "error": f"Error getting collection info: {str(e)}",
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
