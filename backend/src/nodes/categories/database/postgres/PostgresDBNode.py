import json
import re
from typing import Any, Dict, List

import psycopg2
from loguru import logger
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel, Field
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
    TextFieldInputHandle,
)
from src.nodes.handles.basics.outputs.StringOutputHandle import StringOutputHandle
from src.nodes.NodeBase import Node, NodeSpec
from src.schemas.nodes.node_data_parsers import BuildToolResult


def extract_table_names_from_query(query: str) -> set:
    """
    Extract table names from SQL query.

    Args:
        query: SQL query string

    Returns:
        Set of table names found in the query
    """
    if not query:
        return set()

    # Normalize query to uppercase for case-insensitive matching
    normalized_query = query.upper()

    # Common SQL keywords that indicate table references
    table_indicators = [
        r"FROM\s+([A-Za-z_][A-Za-z0-9_]*)",
        r"JOIN\s+([A-Za-z_][A-Za-z0-9_]*)",
        r"INTO\s+([A-Za-z_][A-Za-z0-9_]*)",
        r"UPDATE\s+([A-Za-z_][A-Za-z0-9_]*)",
        r"TABLE\s+([A-Za-z_][A-Za-z0-9_]*)",
    ]

    table_names = set()

    for pattern in table_indicators:
        matches = re.findall(pattern, normalized_query, re.IGNORECASE)
        for match in matches:
            # Clean up the table name (remove schema prefixes if present)
            table_name = match.split(".")[-1] if "." in match else match
            table_names.add(table_name.lower())

    return table_names


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
                name="table_names",
                type=TextFieldInputHandle(
                    placeholder="users,products,orders",
                    multiline=False,
                ),
                description="Table names to work with (comma-separated)",
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
                - embedding_provider: Optional embedding provider
            parameter_values: Dictionary of parameter values (unused in this node)

        Returns:
            Dictionary with query_result key containing JSON string of query results
        """
        connection_url = input_values.get("connection_url")
        table_names_input = input_values.get("table_names", "")
        query = input_values.get("query")

        if not connection_url:
            raise ValueError("Connection URL is required")
        if not table_names_input:
            raise ValueError("Table names are required")
        if not query:
            raise ValueError("Query is required")

        # Parse allowed table names
        allowed_tables = {
            name.strip().lower()
            for name in table_names_input.split(",")
            if name.strip()
        }

        # Extract table names from query and validate
        query_tables = extract_table_names_from_query(query)
        unauthorized_tables = query_tables - allowed_tables

        if unauthorized_tables:
            raise ValueError(
                f"Query uses tables not in allowed list: {', '.join(unauthorized_tables)}. "
                f"Allowed tables: {', '.join(allowed_tables)}"
            )

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
        table_names_input = inputs_values.get("table_names", "")

        # Validate required inputs
        if not connection_url:
            raise ValueError("Connection URL is required")
        if not table_names_input:
            raise ValueError("Table names are required")

        # Parse comma-separated table names
        table_names_list = [
            name.strip() for name in table_names_input.split(",") if name.strip()
        ]

        # Test connection to get database information
        db_info = None
        try:
            conn = psycopg2.connect(connection_url)
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            # Get database name and version
            cursor.execute("SELECT version(), current_database()")
            version, db_name = cursor.fetchone()

            # Get detailed information for specified tables
            table_descriptions = []
            for table_name in table_names_list:
                try:
                    # Get table structure (similar to \d command)
                    cursor.execute(
                        """
                        SELECT
                            column_name,
                            data_type,
                            is_nullable,
                            column_default,
                            character_maximum_length,
                            numeric_precision,
                            numeric_scale
                        FROM information_schema.columns
                        WHERE table_name = %s AND table_schema = 'public'
                        ORDER BY ordinal_position
                    """,
                        (table_name,),
                    )

                    columns = cursor.fetchall()

                    # Get primary keys
                    cursor.execute(
                        """
                        SELECT c.column_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.constraint_column_usage ccu
                          ON tc.constraint_name = ccu.constraint_name
                        JOIN information_schema.columns c
                          ON ccu.column_name = c.column_name
                         AND ccu.table_name = c.table_name
                        WHERE tc.table_name = %s
                          AND tc.table_schema = 'public'
                          AND tc.constraint_type = 'PRIMARY KEY'
                        ORDER BY ccu.ordinal_position
                    """,
                        (table_name,),
                    )

                    primary_keys = [row["column_name"] for row in cursor.fetchall()]

                    # Get foreign keys
                    cursor.execute(
                        """
                        SELECT
                            ccu.column_name,
                            tc.table_name as foreign_table_name,
                            ccu.table_name as table_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.constraint_column_usage ccu
                          ON tc.constraint_name = ccu.constraint_name
                        WHERE tc.table_name = %s
                          AND tc.table_schema = 'public'
                          AND tc.constraint_type = 'FOREIGN KEY'
                    """,
                        (table_name,),
                    )

                    foreign_keys = cursor.fetchall()

                    # Get table size estimate
                    cursor.execute(
                        """
                        SELECT
                            schemaname,
                            tablename,
                            attname,
                            n_distinct,
                            most_common_vals,
                            most_common_freqs
                        FROM pg_stats
                        WHERE tablename = %s
                    """,
                        (table_name,),
                    )

                    table_stats = cursor.fetchall()

                    table_info = {
                        "table_name": table_name,
                        "columns": [dict(col) for col in columns],
                        "primary_keys": primary_keys,
                        "foreign_keys": [dict(fk) for fk in foreign_keys],
                        "statistics": [dict(stat) for stat in table_stats]
                        if table_stats
                        else [],
                    }
                    table_descriptions.append(table_info)

                except Exception as e:
                    logger.warning(
                        f"Could not get description for table {table_name}: {str(e)}"
                    )
                    table_descriptions.append(
                        {
                            "table_name": table_name,
                            "error": f"Could not describe table: {str(e)}",
                        }
                    )

            cursor.close()
            conn.close()

            db_info = {
                "database_name": db_name,
                "version": version,
                "specified_tables": table_descriptions,
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
            # Format table descriptions for the tool description
            table_desc_parts = []

            for table_info in db_info.get("specified_tables", []):
                table_name = table_info.get("table_name", "Unknown")

                if "error" in table_info:
                    table_desc_parts.append(
                        f"❌ **{table_name}**: {table_info['error']}"
                    )
                else:
                    columns = table_info.get("columns", [])
                    primary_keys = table_info.get("primary_keys", [])
                    foreign_keys = table_info.get("foreign_keys", [])

                    # Format columns
                    column_info = []
                    for col in columns:
                        col_name = col.get("column_name", "unknown")
                        data_type = col.get("data_type", "unknown")
                        is_nullable = col.get("is_nullable", "YES")
                        default_val = col.get("column_default")

                        nullable_str = "NULL" if is_nullable == "YES" else "NOT NULL"
                        default_str = f" DEFAULT {default_val}" if default_val else ""
                        column_info.append(
                            f"  - `{col_name}` {data_type} {nullable_str}{default_str}"
                        )

                    # Format primary keys
                    pk_str = (
                        f" 🔑 Primary Keys: {', '.join(primary_keys)}"
                        if primary_keys
                        else ""
                    )

                    # Format foreign keys
                    fk_info = []
                    for fk in foreign_keys:
                        fk_info.append(
                            f"  - `{fk.get('column_name')}` → `{fk.get('foreign_table_name')}`"
                        )
                    fk_str = (
                        "\n🔗 Foreign Keys:\n" + "\n".join(fk_info) if fk_info else ""
                    )

                    table_desc_parts.append(f"""📋 **{table_name}**
{chr(10).join(column_info)}{pk_str}{fk_str}""")

            table_descriptions_text = "\n\n".join(table_desc_parts)

            additional_desc = f"""

<database_information>
**Database**: {db_info.get("database_name", "Unknown")}
**Version**: {db_info.get("version", "Unknown").split(" ")[0]}

**Available Tables**:
{table_descriptions_text}
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
                description="""
        PostgreSQL query string to execute. Only output raw SQL text.

        🔹 **Table Restrictions:**
        - You can ONLY query tables specified in the 'table_names' input.
        - Queries using unauthorized tables will be rejected.
        - Use only the table names provided in the database information section.

        🔹 **Embedding placeholders:**
        - Use {{embed:"some text"}} to represent an embedding of literal text.
        - Example:
        SELECT id, title, embedding <=> {{embed:"detective"}} AS distance
        FROM movies
        ORDER BY distance
        LIMIT 5;

        🔹 **Operators for pgvector:**
        - `<=>` → cosine distance (smaller is more similar)
        - `<#>` → L2 distance
        - `<->` → inner product (larger is more similar)

        🔹 **General rules:**
        - Always generate valid PostgreSQL syntax.
        - Never insert raw embedding arrays directly; always use the {{embed:...}} placeholder.
        - If you forget a LIMIT clause, the node may append a default one to avoid huge result sets.
        - Only reference tables that are explicitly listed in the database information.

        ✔ Example (vector search):
        SELECT id, title, overview, embedding <=> {{embed:"space adventure"}} AS distance
        FROM movies
        WHERE language = 'en'
        ORDER BY distance
        LIMIT 10;

        ✔ Example (normal SQL):
        SELECT * FROM users WHERE active = true;
        """,
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
        """Process tool method for PostgreSQL database operations with embedding support."""
        query = tool_inputs.get("query")

        if not query:
            raise ValueError("Query is required for PostgreSQL tool execution")

        # Check if query contains embedding placeholders and replace them
        original_query = query
        query = self._process_embedding_in_query(query, inputs_values)

        # Override the inputs_values with the tool inputs
        inputs_values["query"] = query

        # Call the existing process method to handle the query execution
        processed_result = self.process(inputs_values, parameter_values)
        return processed_result

    def _process_embedding_in_query(
        self, query: str, inputs_values: Dict[str, Any]
    ) -> str:
        """
        Process embedding placeholders in the query and replace them with actual embeddings.

        Args:
            query: SQL query that may contain {{embed:"text"}} placeholders
            inputs_values: Dictionary containing input values including embedding_provider

        Returns:
            Modified query with embeddings replaced
        """
        # Pattern to match {{embed:"text"}} placeholders
        embedding_pattern = r'\{\{embed:"([^"]+)"\}\}'

        # Find all embedding placeholders in the query
        matches = re.findall(embedding_pattern, query)

        if not matches:
            # No embedding placeholders found, return original query
            return query

        # Check if embedding provider is available
        embedding_provider = inputs_values.get("embedding_provider")
        if not embedding_provider:
            raise ValueError(
                "Embedding provider is required when using {{embed:...}} placeholders in query"
            )

        # Initialize embedding provider
        try:
            embedding_helper_instance = EmbeddingProviderFactory.get_provider(
                provider_name=embedding_provider["provider"]
            )
            embedding_helper_instance.init(
                model=embedding_provider["embedding_model"],
                api_key=embedding_provider["api_key"],
            )
        except Exception as e:
            logger.error(f"Failed to initialize embedding provider: {str(e)}")
            raise ValueError(f"Failed to initialize embedding provider: {str(e)}")

        # Process each embedding placeholder
        for text_to_embed in matches:
            try:
                # Generate embedding for the text
                embedding_vector = self._get_embeddings(
                    text_to_embed, embedding_helper_instance
                )

                # Convert embedding vector to PostgreSQL array format
                embedding_array_str = f"[{','.join(map(str, embedding_vector))}]"

                # Replace the placeholder in the query
                placeholder = f'{{{{embed:"{text_to_embed}"}}}}'
                query = query.replace(placeholder, embedding_array_str)

                logger.info(
                    f"Replaced embedding placeholder for text: '{text_to_embed[:50]}...' with vector of {len(embedding_vector)} dimensions"
                )

            except Exception as e:
                logger.error(
                    f"Failed to generate embedding for text '{text_to_embed}': {str(e)}"
                )
                raise ValueError(
                    f"Failed to generate embedding for text '{text_to_embed}': {str(e)}"
                )

        return query

    def _get_embeddings(
        self, text: str, embedding_helper_instance: EmbeddingProviderBase
    ) -> List[float]:
        """
        Generate embeddings for the given text.

        Args:
            text: Text to generate embeddings for
            embedding_helper_instance: Initialized embedding provider instance

        Returns:
            List of float values representing the embedding vector
        """
        embed_input = EmbeddingInput(text=text)

        embed_output: EmbeddingResponse = embedding_helper_instance.get_embeddings(
            input=embed_input
        )
        embeddings = embed_output.embeddings

        return embeddings
