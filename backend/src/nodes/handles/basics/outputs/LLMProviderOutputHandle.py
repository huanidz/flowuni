from src.nodes.handles.OutputHandleBase import OutputHandleTypeBase


class LLMProviderOutputHandle(OutputHandleTypeBase):
    """Handle for string outputs"""

    def get_type_name(self) -> str:
        return "llm_provider_output"
