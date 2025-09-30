import json
from typing import Any, Dict

import psycopg2
from loguru import logger
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel, Field
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
from src.schemas.nodes.node_data_parsers import BuildToolResult


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
                enable_as_whole_for_tool=True,
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
                enable_for_tool=True,
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

    def build_tool(
        self, inputs_values: Dict[str, Any], tool_configs: Any
    ) -> BuildToolResult:
        """Build tool method for PostgreSQL database operations."""
        from typing import Literal

        connection_url = inputs_values.get("connection_url")

        # Validate required inputs
        if not connection_url:
            raise ValueError("Connection URL is required")

        # Test connection to get database information
        db_info = None
        try:
            conn = psycopg2.connect(connection_url)
            cursor = conn.cursor()

            # Get database name and version
            cursor.execute("SELECT version(), current_database()")
            version, db_name = cursor.fetchone()

            # Get available tables (excluding system tables)
            cursor.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            tables = cursor.fetchall()
            table_names = [table[0] for table in tables]

            cursor.close()
            conn.close()

            db_info = {
                "database_name": db_name,
                "version": version,
                "available_tables": table_names[
                    :10
                ],  # Limit to first 10 tables for brevity
            }

            logger.info(f"Successfully connected to PostgreSQL database: {db_name}")

        except psycopg2.Error as e:
            logger.error(f"Failed to connect to PostgreSQL for tool building: {str(e)}")
            db_info = {"error": f"Could not connect to database: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error during tool building: {str(e)}")
            db_info = {"error": f"Unexpected error: {str(e)}"}

        # Create additional tool description with database info
        additional_desc = ""
        if db_info and "error" not in db_info:
            additional_desc = f"""

<database_information>
```json
{json.dumps(db_info, indent=2)}
```
</database_information>"""

        DEFAULT_TOOL_DESC = """Tool for executing SQL queries on PostgreSQL database. (Supports SELECT, INSERT, UPDATE, DELETE, and other SQL operations)."""
        tool_name = (
            tool_configs.tool_name
            if tool_configs.tool_name
            else "postgresql_database_tool"
        )
        tool_description = (
            tool_configs.tool_description
            if tool_configs.tool_description
            else DEFAULT_TOOL_DESC
        ) + additional_desc

        class PostgresToolSchema(BaseModel):
            query: str = Field(
                ...,
                description=(
                    "SQL query to execute. Supports SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP and other PostgreSQL operations. "
                    "Example: 'SELECT * FROM users WHERE active = true;' or 'INSERT INTO products (name, price) VALUES (\\'Laptop\\', 999.99);'"
                ),
            )

        tool_build_config = BuildToolResult(
            tool_name=tool_name,
            tool_description=tool_description,
            tool_schema=PostgresToolSchema,
        )

        return tool_build_config

    def process_tool(
        self,
        inputs_values: Dict[str, Any],
        parameter_values: Dict[str, Any],
        tool_inputs: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Process tool method for PostgreSQL database operations."""
        query = tool_inputs.get("query")

        if not query:
            raise ValueError("Query is required for PostgreSQL tool execution")

        # Override the inputs_values with the tool inputs
        inputs_values["query"] = query

        # Call the existing process method to handle the query execution
        processed_result = self.process(inputs_values, parameter_values)
        return processed_result
