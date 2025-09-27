from typing import Any, Dict, List, Literal

from pydantic import BaseModel
from src.components.llm.providers.LLMProviderConsts import LLMProviderName


class LLMProviderConfigItem(BaseModel):
    provider_name: str
    type: Literal["predefined", "http"]
    predefined_models: List[str] = []
    http_url: str = ""
    response_path: str = ""


class LLMSupportConfig(BaseModel):
    supported_providers: List[LLMProviderConfigItem]


class LLMConstructingRegistry:
    """Registry for constructing provider configuration."""

    @staticmethod
    def prepare_google_gemini_provider_config() -> LLMProviderConfigItem:
        return LLMProviderConfigItem(
            provider_name=LLMProviderName.GOOGLE_GEMINI,
            type="predefined",
            predefined_models=["gemini-2.5-flash", "gemini-2.5-pro"],
        )

    @staticmethod
    def prepare_openrouter_provider_config() -> LLMProviderConfigItem:
        return LLMProviderConfigItem(
            provider_name=LLMProviderName.OPENROUTER,
            type="http",
            http_url="https://openrouter.ai/api/v1/models",
            response_path="$.data.*.id",
        )

    @classmethod
    def get_constructing_support_config(cls) -> Dict[str, Any]:
        config = LLMSupportConfig(
            supported_providers=[
                cls.prepare_google_gemini_provider_config(),
                cls.prepare_openrouter_provider_config(),
            ]
        )
        return config.model_dump()
