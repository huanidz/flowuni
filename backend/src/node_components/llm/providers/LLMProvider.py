from src.node_components.llm.providers.adapters.LLMAdapterBase import LLMAdapter
from src.node_components.llm.providers.LLMProviderConsts import LLMProviderName


class LLMProvider:
    def __init__(self):
        pass

    @staticmethod
    def get_provider(provider_name: str) -> LLMAdapter:
        if provider_name == LLMProviderName.GOOGLE_GEMINI:
            from src.node_components.llm.providers.adapters import (
                GoogleGeminiProvider,
            )

            return GoogleGeminiProvider()

        else:
            raise ValueError(f"Unknown provider: {provider_name}")
