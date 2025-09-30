from src.nodes.handles.OutputHandleBase import OutputHandleTypeBase


class EmbeddingProviderOutputHandle(OutputHandleTypeBase):
    """Handle for string outputs"""

    def get_type_name(self) -> str:
        return "embedding_provider_output"
