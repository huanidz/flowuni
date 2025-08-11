from src.nodes.handles.OutputHandleBase import OutputHandleTypeBase


class ToolableDataOutputHandle(OutputHandleTypeBase):
    """Handle for general data outputs"""

    def get_type_name(self) -> str:
        return "data_output"
