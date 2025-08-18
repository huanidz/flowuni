from typing import List

from src.helpers.HumanizeJsonSchema import schema_for_llm
from src.helpers.PydanticSchemaConverter import PydanticSchemaConverter
from src.schemas.nodes.node_data_parsers import ToolDataParser


class ToolHelper:
    """Helper class for tool-related operations."""

    # Constants for string templates to avoid repeated creation
    TOOL_START_BLOCK = "<tool>\n"
    TOOL_END_BLOCK = "\n</tool>"
    TOOL_NAME_PREFIX = "- name: "
    TOOL_DESCRIPTION_PREFIX = "- description: "
    TOOL_SCHEMA_PREFIX = "- parameters: "

    @staticmethod
    def get_tools_string_representation(tools: List[ToolDataParser]) -> str:
        """
        Convert a list of tools to a string representation.

        Args:
            tools: List of ToolDataParser objects to convert.

        Returns:
            String representation of all tools concatenated together.
        """
        if not tools:
            return "<tools>\nNo tool provided\n</tools>"

        # Use list comprehension for better performance and readability
        tool_strings = [
            ToolHelper._format_tool_string(idx, tool) for idx, tool in enumerate(tools)
        ]

        start_block = "<tools>\n"
        end_block = "\n</tools>"

        tool_strings.insert(0, start_block)
        tool_strings.append(end_block)

        return "".join(tool_strings)

    @staticmethod
    def _format_tool_string(idx: int, tool: ToolDataParser) -> str:
        """
        Format a single tool into its string representation.

        Args:
            tool: ToolDataParser object to format.

        Returns:
            Formatted string representation of the tool.
        """

        TOOL_SCHEMA_STRING = ""

        if tool.tool_schema:
            SchemaClass = PydanticSchemaConverter.load_from_dict(tool.tool_schema)
            TOOL_SCHEMA_STRING = f"{schema_for_llm(SchemaClass)}"
        else:
            TOOL_SCHEMA_STRING = "No parameter needed."

        return (
            f"Tool_{idx + 1}.\n"
            f"{ToolHelper.TOOL_NAME_PREFIX}{tool.tool_name}\n"
            f"{ToolHelper.TOOL_DESCRIPTION_PREFIX}{tool.tool_description}\n"
            f"{ToolHelper.TOOL_SCHEMA_PREFIX}{TOOL_SCHEMA_STRING}\n\n"
        )
