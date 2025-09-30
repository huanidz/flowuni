import json
from typing import Any, Dict

import psycopg2
from loguru import logger
from psycopg2.extras import RealDictCursor
from src.consts.node_consts import NODE_GROUP_CONSTS
from src.nodes.core.NodeIcon import NodeIconIconify
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs import (
    EmbeddingProviderInputHandle,
    TextFieldInputHandle,
)
from src.nodes.handles.basics.outputs.StringOutputHandle import StringOutputHandle
from src.nodes.NodeBase import Node, NodeSpec


class PostgresDBNode(Node):
    """Node for executing PostgreSQL queries with optional embedding support."""

    spec: NodeSpec = NodeSpec(
        name="PostgreSQL Database",
        description="Execute PostgreSQL queries with optional embedding support.",
        inputs=[
            NodeInput(
                name="connection_url",
                type=TextFieldInputHandle(
                    placeholder="postgresql://user:password@host:port/database",
                    multiline=False,
                ),
                description="PostgreSQL connection URL",
                required=True,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="query",
                type=TextFieldInputHandle(
                    placeholder="SELECT * FROM table_name;",
                    multiline=True,
                ),
                description="SQL query to execute",
                required=True,
            ),
            NodeInput(
                name="embedding_provider",
                type=EmbeddingProviderInputHandle(),
                description="Embedding provider for vector operations with pgvector extension (optional)",
                required=False,
            ),
        ],
        outputs=[
            NodeOutput(
                name="query_result",
                type=StringOutputHandle(),
                description="Result of the query execution as JSON string",
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
        Execute PostgreSQL query and return results.

        Args:
            input_values: Dictionary containing:
                - connection_url: PostgreSQL connection URL
                - query: SQL query to execute
                - embedding: Optional embedding provider
            parameter_values: Dictionary of parameter values (unused in this node)

        Returns:
            Dictionary with query_result key containing JSON string of query results
        """
        connection_url = input_values.get("connection_url")
        query = input_values.get("query")
        embedding = input_values.get("embedding")

        if not connection_url:
            raise ValueError("Connection URL is required")
        if not query:
            raise ValueError("Query is required")

        logger.info(f"Executing PostgreSQL query: {query[:100]}...")

        try:
            # Connect to PostgreSQL
            conn = psycopg2.connect(connection_url)
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            # Execute query
            cursor.execute(query)

            # Handle different query types
            if (
                query.strip()
                .upper()
                .startswith(("SELECT", "SHOW", "EXPLAIN", "DESCRIBE"))
            ):
                # Query returns results
                results = cursor.fetchall()
                # Convert RealDictRow to dict for JSON serialization
                results = [dict(row) for row in results]
                result_json = json.dumps(results, default=str)
            else:
                # Query is INSERT, UPDATE, DELETE, etc.
                affected_rows = cursor.rowcount
                result_json = json.dumps(
                    {"status": "success", "affected_rows": affected_rows}
                )

            # Commit transaction for non-SELECT queries
            if not query.strip().upper().startswith("SELECT"):
                conn.commit()

            cursor.close()
            conn.close()

            logger.info("PostgreSQL query executed successfully")
            return {"query_result": result_json}

        except psycopg2.Error as e:
            logger.error(f"PostgreSQL error: {str(e)}")
            error_result = json.dumps({"error": str(e), "status": "failed"})
            return {"query_result": error_result}
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            error_result = json.dumps({"error": str(e), "status": "failed"})
            return {"query_result": error_result}

    def build_tool(self, inputs_values: Dict[str, Any], tool_configs: Any) -> Any:
        """Build tool method - not implemented for this node."""
        raise NotImplementedError("PostgresDBNode does not support tool mode")

    def process_tool(
        self,
        inputs_values: Dict[str, Any],
        parameter_values: Dict[str, Any],
        tool_inputs: Dict[str, Any],
    ) -> Any:
        """Process tool method - not implemented for this node."""
        raise NotImplementedError("PostgresDBNode does not support tool mode")
