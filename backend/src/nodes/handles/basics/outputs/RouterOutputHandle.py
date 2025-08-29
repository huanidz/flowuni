from src.nodes.handles.OutputHandleBase import OutputHandleTypeBase


class RouterOutputHandle(OutputHandleTypeBase):
    """Handle for general data outputs"""

    def get_type_name(self) -> str:
        return "router_output"
