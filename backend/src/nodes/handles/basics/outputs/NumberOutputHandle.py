from src.nodes.handles.OutputHandleBase import OutputHandleTypeBase


class NumberOutputHandle(OutputHandleTypeBase):
    """Handle for number data outputs"""

    def get_type_name(self) -> str:
        return "number_output"
