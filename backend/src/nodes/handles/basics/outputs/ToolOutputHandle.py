from src.nodes.handles.OutputHandleBase import OutputHandleTypeBase


class ToolOutputHandle(OutputHandleTypeBase):
    """Handle for tool outputs"""

    def get_type_name(self) -> str:
        return "tool_output"
