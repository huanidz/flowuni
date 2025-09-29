from typing import TYPE_CHECKING, List

from ...models.core import EmbeddingInput, EmbeddingResponse
from .EmbeddingProviderInterface import EmbeddingProviderBase

if TYPE_CHECKING:
    from google import genai
    from google.genai import types


class GoogleEmbeddingProvider(EmbeddingProviderBase):
    def __init__(self):
        super().__init__()
        self.client: genai.Client = None
        self.embed_config: types.EmbedContentConfig = None

    def init(self, model: str, api_key: str, **kwargs):
        """Initialize the Google provider with model and API key."""
        super().init(model, api_key, **kwargs)
        try:
            from google import genai
            from google.genai import types

            model_client = genai.Client(
                api_key=api_key,
            )

            self.client = model_client
            self.embed_config = types.EmbedContentConfig(
                task_type="SEMANTIC_SIMILARITY",
                output_dimensionality=512,
            )
        except ImportError:
            raise ImportError(
                "Google Generative AI library is not installed. Please install it with: pip install google-generativeai"
            )

    def get_embeddings(self, input: EmbeddingInput) -> EmbeddingResponse:
        """Get embeddings for the given text using Google."""
        if not self.client:
            raise ValueError("Provider not initialized. Call init() first.")

        result = self.client.models.embed_content(
            model=self.model, contents=[input.text], config=self.embed_config
        )
        embedding = result.embeddings[0].values
        return EmbeddingResponse(embeddings=embedding)

    def get_batch_embeddings(
        self, inputs: List[EmbeddingInput]
    ) -> List[EmbeddingResponse]:
        """Get embeddings for a batch of texts using Google."""
        if not self.client:
            raise ValueError("Provider not initialized. Call init() first.")

        input_texts = [input.text for input in inputs]
        result = self.client.models.embed_content(
            model=self.model, contents=input_texts, config=self.embed_config
        )
        embedding_response: List[EmbeddingResponse] = [
            EmbeddingResponse(embeddings=embed.values) for embed in result.embeddings
        ]
        return embedding_response
