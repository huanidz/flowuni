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
from src.helpers.custom_clients.CustomPineconeClient import (
    CustomPineconeClient,
    PineconeVector,
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


class PineconeDBNode(Node):
    """Node for interacting with Pinecone vector database."""

    spec: NodeSpec = NodeSpec(
        name="Pinecone Database",
        description="Connect to Pinecone vector database for vector operations.",
        inputs=[
            NodeInput(
                name="api_key",
                type=SecretTextInputHandle(
                    allow_visible_toggle=True,
                    multiline=False,
                ),
                description="Pinecone API key",
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
                name="namespace",
                type=TextFieldInputHandle(
                    placeholder="",
                    multiline=False,
                ),
                description="Optional namespace for the operation",
                required=False,
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
                            key="metadata",
                            value="",
                            value_placeholder="{sample_metadata}",
                            multiline=True,
                            description="Metadata for the operation. Should be in JSON format.",
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
        Process Pinecone database operations.

        Args:
            input_values: Dictionary containing operation parameters
            parameter_values: Dictionary of parameter values (unused in this node)

        Returns:
            Dictionary with result key containing JSON string of operation results
        """
        api_key = input_values.get("api_key")
        index_name = input_values.get("index_name")
        namespace = input_values.get("namespace")
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
        metadata = data.get("metadata")
        filter = data.get("filter")
        top_k = data.get("top_k")

        # Validate required inputs
        if not api_key:
            raise ValueError("Pinecone API key is required")
        if not index_name:
            raise ValueError("Index name is required")
        if not operation:
            raise ValueError("Operation is required")
        if not embedding_helper:
            raise ValueError("Embedding helper is required")

        # Initialize Pinecone client
        pinecone_client = None
        try:
            pinecone_client = CustomPineconeClient(
                api_key=api_key, index_name=index_name
            )
            logger.info(f"Connected to Pinecone index: {index_name}")
        except Exception as e:
            logger.error(f"Failed to connect to Pinecone: {str(e)}")
            raise ValueError(f"Failed to connect to Pinecone index {index_name}.")

        if not pinecone_client:
            raise ValueError("Failed to connect to Pinecone.")

        try:
            # Handle different operations
            if operation == "search":
                result = self._search_ops(
                    pinecone_client=pinecone_client,
                    index_name=index_name,
                    text_query=text_query,
                    filter_str=filter,
                    top_k=top_k,
                    namespace=namespace,
                    embedding_helper_instance=embedding_helper_instance,
                )
            elif operation == "insert":
                result = self._insert_ops(
                    pinecone_client=pinecone_client,
                    index_name=index_name,
                    ids=ids,
                    text_query=text_query,
                    metadata_str=metadata,
                    namespace=namespace,
                    embedding_helper_instance=embedding_helper_instance,
                )
            elif operation == "update":
                result = self._update_ops(
                    pinecone_client=pinecone_client,
                    index_name=index_name,
                    ids=ids,
                    text_query=text_query,
                    metadata_str=metadata,
                    namespace=namespace,
                    embedding_helper_instance=embedding_helper_instance,
                )
            elif operation == "delete":
                result = self._delete_ops(
                    pinecone_client=pinecone_client,
                    index_name=index_name,
                    ids=ids,
                    namespace=namespace,
                )
            else:
                raise ValueError(f"Unsupported operation: {operation}.")

            logger.info(f"Pinecone operation '{operation}' completed successfully")
            return {"result": result}

        except Exception as e:
            logger.error(f"Error in Pinecone operation '{operation}': {str(e)}")
            error_result = json.dumps({"error": str(e), "status": "failed"})
            raise ValueError(error_result)

    def build_tool(
        self, inputs_values: Dict[str, Any], tool_configs: Any
    ) -> BuildToolResult:
        """Build tool method - not implemented for this node."""

        api_key = inputs_values.get("api_key")
        index_name = inputs_values.get("index_name")

        from typing import Literal

        from pydantic import BaseModel, Field

        # Initialize Pinecone client
        pinecone_client = None
        try:
            pinecone_client = CustomPineconeClient(
                api_key=api_key, index_name=index_name
            )
            logger.info(f"Connected to Pinecone index: {index_name}")
        except Exception as e:
            logger.error(f"Failed to connect to Pinecone: {str(e)}")
            raise ValueError(f"Failed to connect to Pinecone index {index_name}.")

        if not pinecone_client:
            raise ValueError("Failed to connect to Pinecone.")

        index_information = pinecone_client.describe_index()
        ADDTIONAL_TOOL_DESC = f"""\n\n<index_information>```txt\n{index_information}\n```\n</index_information>"""

        DEFAULT_TOOL_DESC = """Tool for querying Pinecone database. (Can perform ops: search, insert, update, delete).
        """
        tool_name = (
            tool_configs.tool_name
            if tool_configs.tool_name
            else "pinecone_database_tool"
        )
        tool_description = (
            tool_configs.tool_description
            if tool_configs.tool_description
            else DEFAULT_TOOL_DESC
        ) + ADDTIONAL_TOOL_DESC

        class PineconeData(BaseModel):
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
            metadata: str = Field(
                default="{}",
                description=(
                    "JSON string for the metadata to insert or update. "
                    'Must be valid JSON object so later can be loaded with json.loads(). Example: \'{"category": "animal", "source": "wiki"}\'. '
                    "Default = '{}'."
                ),
            )
            filter: str = Field(
                default="{}",
                description=(
                    "JSON string filter for narrowing search results. Must be valid JSON object following Pinecone filter rules. Later can be loaded with json.loads()"
                    'Example: \'{"category": {"$eq": "animal"}}\'. '
                    "Default = '{}'."
                ),
            )
            top_k: int = Field(
                default=5,
                description="Number of results to return. Example: 10. Default = 5.",
            )
            namespace: str = Field(
                default="",
                description="Optional namespace for the operation. Example: 'production'. Default = ''.",
            )

        class PineconeToolSchema(BaseModel):
            ops: Literal["search", "insert", "update", "delete"]
            data: PineconeData

        tool_build_config = BuildToolResult(
            tool_name=tool_name,
            tool_description=tool_description,
            tool_schema=PineconeToolSchema,
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
        data["metadata"] = json.loads(data["metadata"])

        inputs_values["operation"] = ops
        inputs_values["data"] = data

        processed_result = self.process(inputs_values, parameter_values)
        return processed_result

    def _search_ops(
        self,
        pinecone_client: CustomPineconeClient,
        index_name: str,
        text_query: str,
        filter_str: Optional[str],
        top_k: Optional[str],
        namespace: Optional[str],
        embedding_helper_instance: EmbeddingProviderBase,
    ) -> str:
        """
        Perform a search operation in Pinecone.

        Args:
            pinecone_client: The Pinecone client instance.
            index_name: Name of the index to search in.
            text_query: The text query to embed and search for.
            filter_str: Optional filter string in JSON format.
            top_k: Optional number of results to return.
            namespace: Optional namespace to search in.
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
                query_filter = json.loads(filter_str)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid filter JSON format: {str(e)}")

        # Parse top_k
        search_top_k = int(top_k) if top_k else 5
        if search_top_k <= 0:
            raise ValueError("Top_k must be a positive number")

        # Perform search
        search_results = pinecone_client.query(
            vector=query_vector,
            top_k=search_top_k,
            filter_dict=query_filter,
            namespace=namespace,
            include_metadata=True,
            include_values=False,
        )

        # Convert results to JSON-serializable format
        results = []
        if "matches" in search_results:
            for match in search_results["matches"]:
                result_item = {
                    "id": match["id"],
                    "score": match["score"],
                    "metadata": match.get("metadata", {}),
                }
                results.append(result_item)

        return json.dumps(
            {
                "results": results,
                "status": "success",
                "query": text_query,
                "top_k": search_top_k,
                "namespace": namespace or "",
            }
        )

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
        pinecone_client: CustomPineconeClient,
        index_name: str,
        ids: str,
        text_query: str,
        metadata_str: str,
        namespace: Optional[str],
        embedding_helper_instance: EmbeddingProviderBase,
    ) -> str:
        """
        Perform an insert operation in Pinecone.

        Args:
            pinecone_client: The Pinecone client instance.
            index_name: Name of the index to insert into.
            ids: Comma-separated string of IDs to insert.
            text_query: The text to embed and insert as vectors.
            metadata_str: JSON string containing metadata.
            namespace: Optional namespace to insert into.
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

        # Parse metadata if provided
        metadata_dict = {}
        if metadata_str:
            try:
                metadata_dict = json.loads(metadata_str)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid metadata JSON format: {str(e)}")

        # Create vectors for insertion
        vectors = []
        for point_id in id_list:
            vector = PineconeVector(
                id=point_id, values=query_vector, metadata=metadata_dict.copy()
            )
            vectors.append(vector)

        # Perform insert operation
        try:
            upsert_result = pinecone_client.upsert(
                vectors=vectors,
                namespace=namespace,
            )

            return json.dumps(
                {
                    "status": "success",
                    "inserted_count": len(vectors),
                    "ids": id_list,
                    "message": f"Successfully inserted {len(vectors)} vectors into index '{index_name}'",
                    "upsert_result": upsert_result,
                }
            )

        except Exception as e:
            logger.error(f"Error during insert operation: {str(e)}")
            raise ValueError(f"Failed to insert vectors: {str(e)}")

    def _update_ops(
        self,
        pinecone_client: CustomPineconeClient,
        index_name: str,
        ids: str,
        text_query: str,
        metadata_str: str,
        namespace: Optional[str],
        embedding_helper_instance: EmbeddingProviderBase,
    ) -> str:
        """
        Perform an update operation in Pinecone.

        Args:
            pinecone_client: The Pinecone client instance.
            index_name: Name of the index to update.
            ids: Comma-separated string of IDs to update.
            text_query: The text to embed and update as vectors.
            metadata_str: JSON string containing metadata.
            namespace: Optional namespace to update in.
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

        # Parse metadata if provided
        metadata_dict = {}
        if metadata_str:
            try:
                metadata_dict = json.loads(metadata_str)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid metadata JSON format: {str(e)}")

        # Update each vector
        update_results = []
        for point_id in id_list:
            try:
                update_result = pinecone_client.update_vector(
                    vector_id=point_id,
                    values=query_vector,
                    metadata=metadata_dict,
                    namespace=namespace,
                )
                update_results.append({"id": point_id, "status": "success"})
            except Exception as e:
                update_results.append(
                    {"id": point_id, "status": "failed", "error": str(e)}
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
                "message": f"Successfully updated {successful_updates} vectors in index '{index_name}'",
            }
        )

    def _delete_ops(
        self,
        pinecone_client: CustomPineconeClient,
        index_name: str,
        ids: str,
        namespace: Optional[str],
    ) -> str:
        """
        Perform a delete operation in Pinecone.

        Args:
            pinecone_client: The Pinecone client instance.
            index_name: Name of the index to delete from.
            ids: Comma-separated string of IDs to delete.
            namespace: Optional namespace to delete from.

        Returns:
            JSON string containing the delete operation result.
        """
        # Validate IDs
        id_list = self._validate_ids(ids, "delete")

        # Perform delete operation
        try:
            delete_result = pinecone_client.delete(
                ids=id_list,
                namespace=namespace,
            )

            return json.dumps(
                {
                    "status": "success",
                    "deleted_count": len(id_list),
                    "ids": id_list,
                    "message": f"Successfully deleted {len(id_list)} vectors from index '{index_name}'",
                    "delete_result": delete_result,
                }
            )

        except Exception as e:
            logger.error(f"Error during delete operation: {str(e)}")
            raise ValueError(f"Failed to delete vectors: {str(e)}")

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
