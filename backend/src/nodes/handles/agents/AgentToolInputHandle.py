from typing import Any, Dict, Optional

from src.nodes.handles.HandleBase import HandleTypeBase


class AgentToolInputHandle(HandleTypeBase):
    """Handle for agent tool inputs"""

    # tool_name: Optional[str] = None
    # tool_descriptions: Optional[str] = None
    # parameters: Optional[Dict[str, Any]] = None

    max_number_of_tools: Optional[int] = None

    def get_type_name(self) -> str:
        return "agent_tool"

    def validate_value(self, value: Any) -> bool:
        """Validate if the value is a proper tool configuration"""
        if not isinstance(value, dict):
            return False

        # Check if it's a list of tools or a single tool
        if isinstance(value, list):
            # Validate list of tools
            if self.max_number_of_tools and len(value) > self.max_number_of_tools:
                return False
            return all(self._validate_single_tool(tool) for tool in value)
        else:
            # Validate single tool
            return self._validate_single_tool(value)

    def _validate_single_tool(self, tool: Dict[str, Any]) -> bool:
        """Validate a single tool configuration"""
        required_fields = ["name", "description"]
        return all(field in tool for field in required_fields)

    def get_default_value(self) -> Any:
        """Return the default value for agent tools"""
        return []

    def to_json_schema(self) -> Dict[str, Any]:
        """Return JSON schema representation for frontend"""
        schema = {
            "type": "agent_tool",
            "max_number_of_tools": self.max_number_of_tools,
        }
        return schema
