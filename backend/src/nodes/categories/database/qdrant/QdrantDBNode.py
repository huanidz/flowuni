import json
import uuid
from typing import Any, Dict, List, Optional

from loguru import logger
from src.components.embedding.models.core import EmbeddingInput, EmbeddingResponse
from src.components.embedding.providers.EmbeddingProviderFactory import (
    EmbeddingProviderBase,
    EmbeddingProviderFactory,
)
from src.consts.node_consts import NODE_GROUP_CONSTS
from src.helpers.custom_clients.CustomQdrantClient import (
    CustomQdrantClient,
    Filter,
    PointStruct,
)
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
from src.schemas.nodes.node_data_parsers import BuildToolResult


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
                enable_as_whole_for_tool=True,
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
        can_be_tool=True,
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
            model=embedding_helper["embedding_model"],
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
            qdrant_client = CustomQdrantClient(host=url, api_key=api_key, timeout=30)
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
                result = self._insert_ops(
                    qdrant_client=qdrant_client,
                    collection_name=collection_name,
                    ids=ids,
                    text_query=text_query,
                    payload_str=payload,
                    embedding_helper_instance=embedding_helper_instance,
                )

            elif operation == "update":
                result = self._update_ops(
                    qdrant_client=qdrant_client,
                    collection_name=collection_name,
                    ids=ids,
                    text_query=text_query,
                    payload_str=payload,
                    embedding_helper_instance=embedding_helper_instance,
                )

            elif operation == "delete":
                result = self._delete_ops(
                    qdrant_client=qdrant_client,
                    collection_name=collection_name,
                    ids=ids,
                )

            else:
                raise ValueError(f"Unsupported operation: {operation}.")

            logger.info(f"Qdrant operation '{operation}' completed successfully")
            return {"result": result}

        except Exception as e:
            logger.error(f"Error in Qdrant operation '{operation}': {str(e)}")
            error_result = json.dumps({"error": str(e), "status": "failed"})
            raise ValueError(error_result)

    def build_tool(
        self, inputs_values: Dict[str, Any], tool_configs: Any
    ) -> BuildToolResult:
        """Build tool method - not implemented for this node."""

        url = inputs_values.get("url")
        api_key = inputs_values.get("api_key")
        collection_name = inputs_values.get("collection_name")

        from typing import Literal

        from pydantic import BaseModel, Field

        # Initialize Qdrant client
        qdrant_client = None
        try:
            qdrant_client = CustomQdrantClient(host=url, api_key=api_key, timeout=30)
            logger.info(f"Connected to Qdrant at: {url}")
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {str(e)}")
            raise ValueError(f"Failed to connect to Qdrant at {url}.")

        if not qdrant_client:
            raise ValueError("Failed to connect to Qdrant.")

        collection_information = qdrant_client.get_collection(
            collection_name=collection_name
        )
        ADDTIONAL_TOOL_DESC = f"""\n\n<collection_information>```json\n{json.dumps(collection_information, indent=2)}\n```\n</collection_information>"""

        DEFAULT_TOOL_DESC = """Tool for querying Qdrant database. (Can perform ops: search, insert, update, delete).
        """
        tool_name = (
            tool_configs.tool_name if tool_configs.tool_name else "qdrant_database_tool"
        )
        tool_description = (
            tool_configs.tool_description
            if tool_configs.tool_description
            else DEFAULT_TOOL_DESC
        ) + ADDTIONAL_TOOL_DESC

        class QdrantData(BaseModel):
            ids: str = Field(
                default="",
                description=(
                    "Comma-separated IDs of the documents (only required for update, delete, or insert). "
                    "Example: '123,124,125'. Default = ''."
                ),
            )
            text_query: str = Field(
                default="",
                description=(
                    "Text query for search or text content to insert. "
                    "Example (search): 'find documents about cats'. "
                    "Example (insert): 'This is the content of the new doc'. Default = ''."
                ),
            )
            payload: str = Field(
                default="{}",
                description=(
                    "JSON string for the payload (metadata/fields) to insert or update. "
                    'Must be valid JSON object so later can be loaded with json.loads(). Example: \'{"category": "animal", "source": "wiki"}\'. '
                    "Default = '{}'."
                ),
            )
            filter: str = Field(
                default="{}",
                description=(
                    "JSON string filter for narrowing search results. Must be valid JSON object following Qdrant filter rules. Later can be loaded with json.loads()"
                    'Example: \'{"must": [{"key": "category", "match": {"value": "animal"}}]}\'. '
                    "Default = '{}'."
                ),
            )
            limit: int = Field(
                default=5,
                description="Number of results to return. Example: 10. Default = 5.",
            )

        class QdrantToolSchema(BaseModel):
            ops: Literal["search", "insert", "update", "delete"]
            data: QdrantData

        tool_build_config = BuildToolResult(
            tool_name=tool_name,
            tool_description=tool_description,
            tool_schema=QdrantToolSchema,
        )

        return tool_build_config

    def process_tool(
        self,
        inputs_values: Dict[str, Any],
        parameter_values: Dict[str, Any],
        tool_inputs: Dict[str, Any],
    ) -> Dict[str, Any]:
        ops = tool_inputs.get("ops")
        data = tool_inputs.get("data")

        data["filter"] = json.loads(data["filter"])
        data["payload"] = json.loads(data["payload"])

        inputs_values["operation"] = ops
        inputs_values["data"] = data

        processed_result = self.process(inputs_values, parameter_values)
        return processed_result

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
            with_payload=True,
            with_vector=False,
        )

        # Convert results to JSON-serializable format
        results = []
        for hit in search_results:
            result_item = {
                "id": hit.id,
                "score": hit.score,
                "payload": hit.payload if hit.payload else {},
            }

            # Disable vector in the dict due to too long for payload
            # May enable (or not)
            # if hit.vector is not None:
            #     result_item["vector"] = hit.vector
            results.append(result_item)

        return json.dumps(
            {
                "results": results,
                "status": "success",
                "query": text_query,
                "limit": search_limit,
            }
        )

    def _validate_ids(self, ids: str, operation_name: str) -> List[str]:
        """
        Validate that IDs are either unsigned integers or UUIDs.

        Args:
            ids: Comma-separated string of IDs to validate
            operation_name: Name of the operation for error messages

        Returns:
            List of validated IDs

        Raises:
            ValueError: If any ID is invalid
        """
        if not ids:
            raise ValueError(
                f"Please input a valid new id for {operation_name} operation"
            )

        id_list = [id.strip() for id in ids.split(",") if id.strip()]
        if not id_list:
            raise ValueError(
                f"Please input a valid new id for {operation_name} operation"
            )

        validated_ids = []
        for id_str in id_list:
            # Check if it's a valid unsigned integer
            if id_str.isdigit():
                # Convert to int to ensure it's not too large
                try:
                    int_id = int(id_str)
                    if int_id < 0:
                        raise ValueError(
                            f"ID '{id_str}' is not a valid unsigned integer for {operation_name} operation"
                        )
                    validated_ids.append(id_str)
                except ValueError:
                    raise ValueError(
                        f"ID '{id_str}' is not a valid unsigned integer for {operation_name} operation"
                    )
            # Check if it's a valid UUID
            elif self._is_valid_uuid(id_str):
                validated_ids.append(id_str)
            else:
                raise ValueError(
                    f"ID '{id_str}' is not a valid unsigned integer or UUID for {operation_name} operation"
                )

        return validated_ids

    def _is_valid_uuid(self, uuid_str: str) -> bool:
        """Check if a string is a valid UUID."""
        try:
            uuid.UUID(uuid_str)
            return True
        except ValueError:
            return False

    def _insert_ops(
        self,
        qdrant_client: CustomQdrantClient,
        collection_name: str,
        ids: str,
        text_query: str,
        payload_str: str,
        embedding_helper_instance: EmbeddingProviderBase,
    ) -> str:
        """
        Perform an insert operation in Qdrant.

        Args:
            qdrant_client: The Qdrant client instance.
            collection_name: Name of the collection to insert into.
            ids: Comma-separated string of IDs to insert.
            text_query: The text to embed and insert as vectors.
            payload_str: JSON string containing payload data.
            embedding_helper_instance: The embedding provider instance.

        Returns:
            JSON string containing the insert operation result.
        """
        # Validate insert-specific inputs
        if not text_query:
            raise ValueError(
                "Text query is required for insert operation to generate vectors"
            )

        # Validate IDs
        id_list = self._validate_ids(ids, "insert")

        # Generate vector from text
        query_vector = self._get_embeddings(
            text=text_query, embedding_helper_instance=embedding_helper_instance
        )

        # Parse payload if provided
        payload_dict = {}
        if payload_str:
            try:
                payload_dict = json.loads(payload_str)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid payload JSON format: {str(e)}")

        # Create points for insertion
        points = []
        for i, point_id in enumerate(id_list):
            point_payload = payload_dict.copy()
            # Add metadata about the insertion
            point_payload["_inserted_text"] = text_query
            point_payload["_inserted_id"] = point_id

            point = PointStruct(
                id=point_id,
                vector=query_vector,
                payload=point_payload if point_payload else {},
            )
            points.append(point)

        # Perform insert operation
        try:
            upsert_result = qdrant_client.upsert_points(
                collection_name=collection_name,
                points=points,
            )

            return json.dumps(
                {
                    "status": "success",
                    "inserted_count": len(points),
                    "ids": id_list,
                    "message": f"Successfully inserted {len(points)} points into collection '{collection_name}'",
                    "upsert_result": upsert_result,
                }
            )

        except Exception as e:
            logger.error(f"Error during insert operation: {str(e)}")
            raise ValueError(f"Failed to insert points: {str(e)}")

    def _update_ops(
        self,
        qdrant_client: CustomQdrantClient,
        collection_name: str,
        ids: str,
        text_query: str,
        payload_str: str,
        embedding_helper_instance: EmbeddingProviderBase,
    ) -> str:
        """
        Perform an update operation in Qdrant.

        Args:
            qdrant_client: The Qdrant client instance.
            collection_name: Name of the collection to update.
            ids: Comma-separated string of IDs to update.
            text_query: The text to embed and update as vectors.
            payload_str: JSON string containing payload data.
            embedding_helper_instance: The embedding provider instance.

        Returns:
            JSON string containing the update operation result.
        """
        # Validate update-specific inputs
        if not text_query:
            raise ValueError(
                "Text query is required for update operation to generate vectors"
            )

        # Validate IDs
        id_list = self._validate_ids(ids, "update")

        # Generate vector from text
        query_vector = self._get_embeddings(
            text=text_query, embedding_helper_instance=embedding_helper_instance
        )

        # Parse payload if provided
        payload_dict = {}
        if payload_str:
            try:
                payload_dict = json.loads(payload_str)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid payload JSON format: {str(e)}")

        # Create points for update
        points = []
        for i, point_id in enumerate(id_list):
            point_payload = payload_dict.copy()
            # Add metadata about the update
            point_payload["_updated_text"] = text_query
            point_payload["_updated_id"] = point_id

            point = PointStruct(
                id=point_id,
                vector=query_vector,
                payload=point_payload if point_payload else {},
            )
            points.append(point)

        # Perform update operation (using upsert to update existing points)
        try:
            upsert_result = qdrant_client.upsert_points(
                collection_name=collection_name,
                points=points,
            )

            return json.dumps(
                {
                    "status": "success",
                    "updated_count": len(points),
                    "ids": id_list,
                    "message": f"Successfully updated {len(points)} points in collection '{collection_name}'",
                    "upsert_result": upsert_result,
                }
            )

        except Exception as e:
            logger.error(f"Error during update operation: {str(e)}")
            raise ValueError(f"Failed to update points: {str(e)}")

    def _delete_ops(
        self,
        qdrant_client: CustomQdrantClient,
        collection_name: str,
        ids: str,
    ) -> str:
        """
        Perform a delete operation in Qdrant.

        Args:
            qdrant_client: The Qdrant client instance.
            collection_name: Name of the collection to delete from.
            ids: Comma-separated string of IDs to delete.

        Returns:
            JSON string containing the delete operation result.
        """
        # Validate IDs
        id_list = self._validate_ids(ids, "delete")

        # Perform delete operation
        try:
            delete_result = qdrant_client.delete_points(
                collection_name=collection_name,
                points_ids=id_list,
            )

            return json.dumps(
                {
                    "status": "success",
                    "deleted_count": len(id_list),
                    "ids": id_list,
                    "message": f"Successfully deleted {len(id_list)} points from collection '{collection_name}'",
                    "delete_result": delete_result,
                }
            )

        except Exception as e:
            logger.error(f"Error during delete operation: {str(e)}")
            raise ValueError(f"Failed to delete points: {str(e)}")

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
