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

try:
    import weaviate
    from weaviate.auth import AuthApiKey
    from weaviate.classes.config import Configure
    from weaviate.classes.query import Filter

    WEAVIATE_AVAILABLE = True
except ImportError:
    WEAVIATE_AVAILABLE = False


class WeaviateDBNode(Node):
    """Node for interacting with Weaviate vector database."""

    spec: NodeSpec = NodeSpec(
        name="Weaviate Database",
        description="Connect to Weaviate vector database for vector operations.",
        inputs=[
            NodeInput(
                name="url",
                type=TextFieldInputHandle(
                    placeholder="http://localhost:8080",
                    multiline=False,
                ),
                description="Weaviate server URL",
                required=True,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="api_key",
                type=SecretTextInputHandle(
                    allow_visible_toggle=True,
                    multiline=False,
                ),
                description="Weaviate API key",
                required=True,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="class_name",
                type=TextFieldInputHandle(
                    placeholder="MyCollection",
                    multiline=False,
                ),
                description="Name of the Weaviate class/collection",
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
                            key="properties",
                            value="",
                            value_placeholder="{sample_properties}",
                            multiline=True,
                            description="Properties for the operation. Should be in JSON format.",
                        ),
                        KeyValueItem(
                            key="filter",
                            value="",
                            multiline=True,
                            description="Filter for the operation. Should be in JSON format.",
                        ),
                        KeyValueItem(
                            key="top_k",
                            value="",
                            value_placeholder="5",
                            multiline=False,
                            dtype=KVValueDType.NUMBER,
                        ),
                        KeyValueItem(
                            key="hybrid_search",
                            value="",
                            value_placeholder="false",
                            multiline=False,
                            dtype=KVValueDType.BOOLEAN,
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

    async def process(
        self, input_values: Dict[str, Any], parameter_values: Dict[str, Any]
    ) -> Any:
        """
        Process Weaviate database operations.

        Args:
            input_values: Dictionary containing operation parameters
            parameter_values: Dictionary of parameter values (unused in this node)

        Returns:
            Dictionary with result key containing JSON string of operation results
        """
        if not WEAVIATE_AVAILABLE:
            raise ValueError(
                "Weaviate package is not installed. Please install weaviate-client to use this node."
            )

        url = input_values.get("url")
        api_key = input_values.get("api_key")
        class_name = input_values.get("class_name")
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
        properties = data.get("properties")
        filter = data.get("filter")
        top_k = data.get("top_k")
        hybrid_search = data.get("hybrid_search")

        # Validate required inputs
        if not url:
            raise ValueError("Weaviate URL is required")
        if not api_key:
            raise ValueError("Weaviate API key is required")
        if not class_name:
            raise ValueError("Class name is required")
        if not operation:
            raise ValueError("Operation is required")
        if not embedding_helper:
            raise ValueError("Embedding helper is required")

        # Initialize Weaviate client
        weaviate_client = None
        try:
            weaviate_client = weaviate.connect_to_weaviate_cloud(
                cluster_url=url,
                auth_credentials=AuthApiKey(api_key),
            )
            logger.info(f"Connected to Weaviate at: {url}")
        except Exception as e:
            logger.error(f"Failed to connect to Weaviate: {str(e)}")
            raise ValueError(f"Failed to connect to Weaviate at {url}.")

        if not weaviate_client:
            raise ValueError("Failed to connect to Weaviate.")

        try:
            # Handle different operations
            if operation == "search":
                result = self._search_ops(
                    weaviate_client=weaviate_client,
                    class_name=class_name,
                    text_query=text_query,
                    filter_str=filter,
                    top_k=top_k,
                    hybrid_search=hybrid_search,
                    embedding_helper_instance=embedding_helper_instance,
                )
            elif operation == "insert":
                result = self._insert_ops(
                    weaviate_client=weaviate_client,
                    class_name=class_name,
                    ids=ids,
                    text_query=text_query,
                    properties_str=properties,
                    embedding_helper_instance=embedding_helper_instance,
                )
            elif operation == "update":
                result = self._update_ops(
                    weaviate_client=weaviate_client,
                    class_name=class_name,
                    ids=ids,
                    text_query=text_query,
                    properties_str=properties,
                    embedding_helper_instance=embedding_helper_instance,
                )
            elif operation == "delete":
                result = self._delete_ops(
                    weaviate_client=weaviate_client,
                    class_name=class_name,
                    ids=ids,
                )
            else:
                raise ValueError(f"Unsupported operation: {operation}.")

            logger.info(f"Weaviate operation '{operation}' completed successfully")
            return {"result": result}

        except Exception as e:
            logger.error(f"Error in Weaviate operation '{operation}': {str(e)}")
            error_result = json.dumps({"error": str(e), "status": "failed"})
            raise ValueError(error_result)

    def _search_ops(
        self,
        weaviate_client: weaviate.WeaviateClient,
        class_name: str,
        text_query: str,
        filter_str: Optional[str],
        top_k: Optional[str],
        hybrid_search: Optional[str],
        embedding_helper_instance: EmbeddingProviderBase,
    ) -> str:
        """
        Perform a search operation in Weaviate.

        Args:
            weaviate_client: The Weaviate client instance.
            class_name: Name of the class to search in.
            text_query: The text query to embed and search for.
            filter_str: Optional filter string in JSON format.
            top_k: Optional number of results to return.
            hybrid_search: Whether to use hybrid search.
            embedding_helper_instance: The embedding provider instance.

        Returns:
            JSON string containing the search results.
        """
        # Validate search-specific inputs
        if not text_query:
            raise ValueError("Text query is required for search operation")

        # Parse filter if provided
        query_filter = None
        if filter_str:
            try:
                filter_dict = json.loads(filter_str)
                query_filter = self._build_filter(filter_dict)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid filter JSON format: {str(e)}")

        # Parse top_k
        search_top_k = int(top_k) if top_k else 5
        if search_top_k <= 0:
            raise ValueError("Top_k must be a positive number")

        # Parse hybrid_search
        use_hybrid = hybrid_search.lower() == "true" if hybrid_search else False

        try:
            collection = weaviate_client.collections.get(class_name)

            if use_hybrid:
                # Hybrid search (vector + keyword)
                results = collection.query.hybrid(
                    query=text_query,
                    filters=query_filter,
                    limit=search_top_k,
                )
            else:
                # Vector search only
                results = collection.query.near_text(
                    query=text_query,
                    filters=query_filter,
                    limit=search_top_k,
                )

            # Convert results to JSON-serializable format
            search_results = []
            for obj in results.objects:
                result_item = {
                    "id": str(obj.uuid),
                    "properties": obj.properties,
                }
                if obj.metadata and obj.metadata.score is not None:
                    result_item["score"] = obj.metadata.score
                search_results.append(result_item)

            return json.dumps(
                {
                    "results": search_results,
                    "status": "success",
                    "query": text_query,
                    "top_k": search_top_k,
                    "hybrid_search": use_hybrid,
                }
            )

        except Exception as e:
            logger.error(f"Error during search operation: {str(e)}")
            raise ValueError(f"Failed to search: {str(e)}")

    def _validate_ids(self, ids: str, operation_name: str) -> List[str]:
        """
        Validate that IDs are provided.

        Args:
            ids: Comma-separated string of IDs to validate
            operation_name: Name of the operation for error messages

        Returns:
            List of validated IDs

        Raises:
            ValueError: If IDs are invalid
        """
        if not ids:
            raise ValueError(f"Please input a valid id for {operation_name} operation")

        id_list = [id.strip() for id in ids.split(",") if id.strip()]
        if not id_list:
            raise ValueError(f"Please input a valid id for {operation_name} operation")

        return id_list

    def _insert_ops(
        self,
        weaviate_client: weaviate.WeaviateClient,
        class_name: str,
        ids: str,
        text_query: str,
        properties_str: str,
        embedding_helper_instance: EmbeddingProviderBase,
    ) -> str:
        """
        Perform an insert operation in Weaviate.

        Args:
            weaviate_client: The Weaviate client instance.
            class_name: Name of the class to insert into.
            ids: Comma-separated string of IDs to insert.
            text_query: The text to embed and insert as vectors.
            properties_str: JSON string containing properties.
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

        # Parse properties if provided
        properties_dict = {}
        if properties_str:
            try:
                properties_dict = json.loads(properties_str)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid properties JSON format: {str(e)}")

        # Create objects for insertion
        objects = []
        for obj_id in id_list:
            # Generate UUID for the object
            obj_uuid = uuid.UUID(obj_id) if obj_id else uuid.uuid4()

            obj_data = {
                "properties": properties_dict.copy(),
                "vector": query_vector,
            }
            objects.append(obj_data)

        # Perform insert operation
        try:
            collection = weaviate_client.collections.get(class_name)

            # Insert objects in batches
            batch_size = 100
            created_uuids = []

            for i in range(0, len(objects), batch_size):
                batch = objects[i : i + batch_size]

                with collection.batch.dynamic() as batch_obj:
                    for obj in batch:
                        obj_uuid = uuid.uuid4()
                        batch_obj.add_object(
                            uuid=obj_uuid,
                            properties=obj.get("properties", {}),
                            vector=obj.get("vector"),
                        )
                        created_uuids.append(str(obj_uuid))

            return json.dumps(
                {
                    "status": "success",
                    "inserted_count": len(objects),
                    "ids": id_list,
                    "uuids": created_uuids,
                    "message": f"Successfully inserted {len(objects)} objects into class '{class_name}'",
                }
            )

        except Exception as e:
            logger.error(f"Error during insert operation: {str(e)}")
            raise ValueError(f"Failed to insert objects: {str(e)}")

    def _update_ops(
        self,
        weaviate_client: weaviate.WeaviateClient,
        class_name: str,
        ids: str,
        text_query: str,
        properties_str: str,
        embedding_helper_instance: EmbeddingProviderBase,
    ) -> str:
        """
        Perform an update operation in Weaviate.

        Args:
            weaviate_client: The Weaviate client instance.
            class_name: Name of the class to update.
            ids: Comma-separated string of IDs to update.
            text_query: The text to embed and update as vectors.
            properties_str: JSON string containing properties.
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

        # Parse properties if provided
        properties_dict = {}
        if properties_str:
            try:
                properties_dict = json.loads(properties_str)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid properties JSON format: {str(e)}")

        # Perform update operation
        try:
            collection = weaviate_client.collections.get(class_name)
            update_results = []

            for obj_id in id_list:
                try:
                    # Convert string ID to UUID if needed
                    uuid_id = uuid.UUID(obj_id) if obj_id else uuid.uuid4()

                    collection.data.update(
                        uuid=uuid_id,
                        properties=properties_dict or {},
                        vector=query_vector,
                    )
                    update_results.append({"id": obj_id, "status": "success"})
                except Exception as e:
                    update_results.append(
                        {"id": obj_id, "status": "failed", "error": str(e)}
                    )

            successful_updates = sum(
                1 for result in update_results if result["status"] == "success"
            )
            failed_updates = len(update_results) - successful_updates

            return json.dumps(
                {
                    "status": "success" if failed_updates == 0 else "partial_success",
                    "updated_count": successful_updates,
                    "failed_count": failed_updates,
                    "ids": id_list,
                    "update_details": update_results,
                    "message": f"Successfully updated {successful_updates} objects in class '{class_name}'",
                }
            )

        except Exception as e:
            logger.error(f"Error during update operation: {str(e)}")
            raise ValueError(f"Failed to update objects: {str(e)}")

    def _delete_ops(
        self,
        weaviate_client: weaviate.WeaviateClient,
        class_name: str,
        ids: str,
    ) -> str:
        """
        Perform a delete operation in Weaviate.

        Args:
            weaviate_client: The Weaviate client instance.
            class_name: Name of the class to delete from.
            ids: Comma-separated string of IDs to delete.

        Returns:
            JSON string containing the delete operation result.
        """
        # Validate IDs
        id_list = self._validate_ids(ids, "delete")

        # Perform delete operation
        try:
            collection = weaviate_client.collections.get(class_name)

            # Convert string IDs to UUID objects
            uuid_objects = []
            for obj_id in id_list:
                try:
                    uuid_id = uuid.UUID(obj_id) if obj_id else uuid.uuid4()
                    uuid_objects.append(uuid_id)
                except ValueError:
                    raise ValueError(f"Invalid UUID format for object_id: {obj_id}")

            collection.data.delete_many(where=Filter.by_id().contains_any(uuid_objects))

            return json.dumps(
                {
                    "status": "success",
                    "deleted_count": len(id_list),
                    "ids": id_list,
                    "message": f"Successfully deleted {len(id_list)} objects from class '{class_name}'",
                }
            )

        except Exception as e:
            logger.error(f"Error during delete operation: {str(e)}")
            raise ValueError(f"Failed to delete objects: {str(e)}")

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

    def _build_filter(self, filter_dict: Dict) -> Filter:
        """Build Weaviate filter from dictionary."""
        if not filter_dict:
            return None

        # For simplicity, we'll create a filter for the first key-value pair
        # In a real implementation, you'd want to handle more complex filtering
        for key, value in filter_dict.items():
            return Filter.by_property(key).equal(value)

        return None

    def build_tool(
        self, inputs_values: Dict[str, Any], tool_configs: Any
    ) -> BuildToolResult:
        """Build tool method for Weaviate database operations."""

        url = inputs_values.get("url")
        api_key = inputs_values.get("api_key")
        class_name = inputs_values.get("class_name")

        from typing import Literal

        from pydantic import BaseModel, Field

        # Validate required inputs
        if not url:
            raise ValueError("Weaviate URL is required")
        if not api_key:
            raise ValueError("Weaviate API key is required")
        if not class_name:
            raise ValueError("Class name is required")

        # Initialize Weaviate client to get collection info
        try:
            weaviate_client = weaviate.connect_to_weaviate_cloud(
                cluster_url=url,
                auth_credentials=AuthApiKey(api_key),
            )
            collection = weaviate_client.collections.get(class_name)
            collection_info = collection.config.get()
            weaviate_client.close()
        except Exception as e:
            logger.error(f"Failed to connect to Weaviate for tool building: {str(e)}")
            collection_info = {"error": "Could not retrieve collection info"}

        ADDITIONAL_TOOL_DESC = f"""\n\n<collection_information>```json\n{json.dumps(collection_info, indent=2)}\n```\n</collection_information>"""

        DEFAULT_TOOL_DESC = """Tool for querying Weaviate database. (Can perform ops: search, insert, update, delete).
        """
        tool_name = (
            tool_configs.tool_name
            if tool_configs.tool_name
            else "weaviate_database_tool"
        )
        tool_description = (
            tool_configs.tool_description
            if tool_configs.tool_description
            else DEFAULT_TOOL_DESC
        ) + ADDITIONAL_TOOL_DESC

        class WeaviateData(BaseModel):
            ids: str = Field(
                default="",
                description=(
                    "Comma-separated IDs of the documents (only required for update, delete, or insert). "
                    "Example: '123e4567-e89b-12d3-a456-426614174000,223e4567-e89b-12d3-a456-426614174001'. Default = ''."
                ),
            )
            text_query: str = Field(
                default="",
                description=(
                    "Text query for search or text content to insert/update. "
                    "Example (search): 'find documents about cats'. "
                    "Example (insert): 'This is the content of the new document'. Default = ''."
                ),
            )
            properties: str = Field(
                default="{}",
                description=(
                    "JSON string for the properties (metadata/fields) to insert or update. "
                    'Must be valid JSON object so later can be loaded with json.loads(). Example: \'{"category": "animal", "source": "wiki"}\'. '
                    "Default = '{}'."
                ),
            )
            filter: str = Field(
                default="{}",
                description=(
                    "JSON string filter for narrowing search results. Must be valid JSON object following Weaviate filter rules. Later can be loaded with json.loads()"
                    'Example: \'{"path": ["category"], "operator": "Equal", "valueString": "animal"}\'. '
                    "Default = '{}'."
                ),
            )
            top_k: int = Field(
                default=5,
                description="Number of results to return. Example: 10. Default = 5.",
            )
            hybrid_search: bool = Field(
                default=False,
                description="Whether to use hybrid search (vector + keyword). Example: true. Default = false.",
            )

        class WeaviateToolSchema(BaseModel):
            ops: Literal["search", "insert", "update", "delete"]
            data: WeaviateData

        tool_build_config = BuildToolResult(
            tool_name=tool_name,
            tool_description=tool_description,
            tool_schema=WeaviateToolSchema,
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
        data["properties"] = json.loads(data["properties"])

        inputs_values["operation"] = ops
        inputs_values["data"] = data

        processed_result = self.process(inputs_values, parameter_values)
        return processed_result
