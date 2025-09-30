from abc import ABC, abstractmethod
from typing import List

from ...models.core import EmbeddingInput, EmbeddingResponse


class EmbeddingProviderBase(ABC):
    def __init__(self):
        self.model = None
        self.api_key = None

    def init(self, model: str, api_key: str, **kwargs):
        """Initialize the provider with model and API key."""
        self.model = model
        self.api_key = api_key

    @abstractmethod
    def get_embeddings(self, input: EmbeddingInput) -> EmbeddingResponse:
        """Get embeddings for the given text."""
        pass

    @abstractmethod
    def get_batch_embeddings(
        self, inputs: List[EmbeddingInput]
    ) -> List[EmbeddingResponse]:
        """Get embeddings for a batch of texts."""
        pass
