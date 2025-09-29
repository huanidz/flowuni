from typing import Dict, Type

from .adapters.EmbeddingProviderInterface import EmbeddingProviderBase
from .adapters.GoogleEmbeddingProvider import GoogleEmbeddingProvider
from .adapters.OpenAIEmbeddingProvider import OpenAIEmbeddingProvider
from .adapters.OpenRouterEmbeddingProvider import OpenRouterEmbeddingProvider
from .EmbeddingProviderConsts import EmbeddingProviderConsts


class EmbeddingProviderFactory:
    _providers: Dict[str, Type[EmbeddingProviderBase]] = {
        EmbeddingProviderConsts.OPENAI: OpenAIEmbeddingProvider,
        EmbeddingProviderConsts.GOOGLE: GoogleEmbeddingProvider,
        EmbeddingProviderConsts.OPENROUTER: OpenRouterEmbeddingProvider,
    }

    @classmethod
    def get_provider(cls, provider_name: str) -> EmbeddingProviderBase:
        """Get a provider instance by name."""
        provider_class = cls._providers.get(provider_name)
        if not provider_class:
            raise ValueError(f"Unknown provider: {provider_name}")
        return provider_class()

    @classmethod
    def register_provider(cls, name: str, provider_class: Type[EmbeddingProviderBase]):
        """Register a new provider."""
        cls._providers[name] = provider_class

    @classmethod
    def get_supported_providers(cls) -> list:
        """Get list of supported providers."""
        return list(cls._providers.keys())
