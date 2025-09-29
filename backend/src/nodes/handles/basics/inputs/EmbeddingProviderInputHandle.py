from src.nodes.handles.InputHandleBase import InputHandleTypeBase


class EmbeddingProviderInputHandle(InputHandleTypeBase):
    """Handle for embedding provider inputs"""

    def get_type_name(self) -> str:
        return "embedding_provider_input_field"

    def validate_value(self, value: any) -> bool:
        pass

    def get_default_value(self) -> any:
        pass

    def to_json_schema(self) -> dict:
        pass
