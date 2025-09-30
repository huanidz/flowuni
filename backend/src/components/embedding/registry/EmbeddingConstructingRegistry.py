from typing import Any, Dict, List, Literal

from pydantic import BaseModel

from ..providers.EmbeddingProviderConsts import EmbeddingProviderConsts


class EmbeddingProviderConfigItem(BaseModel):
    provider_name: str
    type: Literal["predefined", "http"]
    predefined_models: List[str] = []
    http_url: str = ""
    response_path: str = ""


class EmbeddingSupportConfig(BaseModel):
    supported_providers: List[EmbeddingProviderConfigItem]


class EmbeddingConstructingRegistry:
    """Registry for constructing embedding provider configuration."""

    @staticmethod
    def prepare_openai_embedding_provider_config() -> EmbeddingProviderConfigItem:
        return EmbeddingProviderConfigItem(
            provider_name=EmbeddingProviderConsts.OPENAI,
            type="predefined",
            predefined_models=[
                "text-embedding-ada-002",
                "text-embedding-3-small",
                "text-embedding-3-large",
            ],
        )

    @staticmethod
    def prepare_google_embedding_provider_config() -> EmbeddingProviderConfigItem:
        return EmbeddingProviderConfigItem(
            provider_name=EmbeddingProviderConsts.GOOGLE,
            type="predefined",
            predefined_models=["models/embedding-001", "models/text-embedding-004"],
        )

    @staticmethod
    def prepare_openrouter_embedding_provider_config() -> EmbeddingProviderConfigItem:
        return EmbeddingProviderConfigItem(
            provider_name=EmbeddingProviderConsts.OPENROUTER,
            type="http",
            http_url="https://openrouter.ai/api/v1/models",
            response_path="$.data.*.id",
        )

    @classmethod
    def get_constructing_support_config(cls) -> Dict[str, Any]:
        config = EmbeddingSupportConfig(
            supported_providers=[
                cls.prepare_openai_embedding_provider_config(),
                cls.prepare_google_embedding_provider_config(),
                cls.prepare_openrouter_embedding_provider_config(),
            ]
        )
        return config.model_dump()
