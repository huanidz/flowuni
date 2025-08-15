from src.nodes.handles.OutputHandleBase import OutputHandleTypeBase


class StringOutputHandle(OutputHandleTypeBase):
    """Handle for string outputs"""

    def get_type_name(self) -> str:
        return "string_output"
