from typing import List

from src.helpers.PydanticSchemaConverter import PydanticSchemaConverter
from src.schemas.nodes.node_data_parsers import ToolDataParser


class ToolHelper:
    """Helper class for tool-related operations."""

    # Constants for string templates to avoid repeated creation
    TOOL_START_BLOCK = "<tool>\n"
    TOOL_END_BLOCK = "\n</tool>"
    TOOL_NAME_PREFIX = "tool_name: "
    TOOL_DESCRIPTION_PREFIX = "tool_description: "
    TOOL_SCHEMA_PREFIX = "tool_schema: "

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
            return ""

        # Use list comprehension for better performance and readability
        tool_strings = [ToolHelper._format_tool_string(tool) for tool in tools]

        return "".join(tool_strings)

    @staticmethod
    def _format_tool_string(tool: ToolDataParser) -> str:
        """
        Format a single tool into its string representation.

        Args:
            tool: ToolDataParser object to format.

        Returns:
            Formatted string representation of the tool.
        """
        tool_schema = PydanticSchemaConverter.serialize(
            PydanticSchemaConverter.load_from_dict(tool.tool_schema)
        )

        return (
            f"{ToolHelper.TOOL_START_BLOCK}"
            f"{ToolHelper.TOOL_NAME_PREFIX}{tool.tool_name}\n"
            f"{ToolHelper.TOOL_DESCRIPTION_PREFIX}{tool.tool_description}\n"
            # f"{ToolHelper.TOOL_SCHEMA_PREFIX}{tool_schema}"
            f"{ToolHelper.TOOL_END_BLOCK}"
        )
