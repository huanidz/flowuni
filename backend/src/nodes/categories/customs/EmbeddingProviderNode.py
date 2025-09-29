from loguru import logger
from src.nodes.core.NodeIcon import NodeIconIconify
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.DropdownInputHandle import (
    DropdownInputHandle,
    DropdownOption,
)
from src.nodes.handles.basics.inputs.SecretTextInputHandle import SecretTextInputHandle
from src.nodes.handles.basics.outputs.EmbeddingProviderOutputHandle import (
    EmbeddingProviderOutputHandle,
)
from src.nodes.handles.resolvers.basics import (
    ConditionalResolver,
    StaticResolver,
)
from src.nodes.NodeBase import Node, NodeSpec


class EmbeddingProviderNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Embedding Provider",
        description="Embedding provider node that uses provider, embedding model, and API key.",
        inputs=[
            NodeInput(
                name="provider",
                type=DropdownInputHandle(
                    options=[
                        DropdownOption(label="Google", value="google"),
                        DropdownOption(label="OpenAI", value="openai"),
                        DropdownOption(label="Cohere", value="cohere"),
                        DropdownOption(label="Jina", value="jina"),
                    ]
                ),
                description="Embedding provider",
                allow_incoming_edges=False,
                required=True,
            ),
            NodeInput(
                name="embedding_model",
                type=DropdownInputHandle(
                    options=[],
                    client_resolver=ConditionalResolver(
                        type="conditional",
                        field_id="provider",
                        cases={
                            "google": StaticResolver(
                                type="static",
                                options=[
                                    {
                                        "value": "gemini-embedding-001",
                                        "label": "gemini-embedding-001",
                                    },
                                ],
                            ),
                            "openai": StaticResolver(
                                type="static",
                                options=[
                                    {
                                        "value": "text-embedding-3-small",
                                        "label": "text-embedding-3-small",
                                    },
                                    {
                                        "value": "text-embedding-3-large",
                                        "label": "text-embedding-3-large",
                                    },
                                    {
                                        "value": "text-embedding-ada-002",
                                        "label": "text-embedding-ada-002",
                                    },
                                ],
                            ),
                            "cohere": StaticResolver(
                                type="static",
                                options=[
                                    {
                                        "value": "embed-english-v3.0",
                                        "label": "embed-english-v3.0",
                                    },
                                    {
                                        "value": "embed-multilingual-v3.0",
                                        "label": "embed-multilingual-v3.0",
                                    },
                                    {
                                        "value": "embed-english-light-v3.0",
                                        "label": "embed-english-light-v3.0",
                                    },
                                ],
                            ),
                            "jina": StaticResolver(
                                type="static",
                                options=[
                                    {
                                        "value": "jina-embeddings-v2-base-en",
                                        "label": "jina-embeddings-v2-base-en",
                                    },
                                    {
                                        "value": "jina-embeddings-v2-small-en",
                                        "label": "jina-embeddings-v2-small-en",
                                    },
                                    {
                                        "value": "jina-embeddings-v2-base-de",
                                        "label": "jina-embeddings-v2-base-de",
                                    },
                                ],
                            ),
                        },
                    ),
                    searchable=True,
                ),
                description="Embedding model",
                allow_incoming_edges=False,
                required=True,
            ),
            NodeInput(
                name="api_key",
                type=SecretTextInputHandle(allow_visible_toggle=True, multiline=False),
                description="Embedding API Key",
                allow_incoming_edges=False,
                required=True,
            ),
        ],
        outputs=[
            NodeOutput(
                name="embedding_provider",
                type=EmbeddingProviderOutputHandle(),
                description="The configured embedding provider.",
            )
        ],
        parameters=[],
        can_be_tool=False,
        icon=NodeIconIconify(icon_value="carbon:machine-learning-model"),
    )

    def process(self, input_values, parameter_values):
        provider = input_values["provider"]
        embedding_model = input_values["embedding_model"]
        api_key = input_values["api_key"]

        if not provider or not embedding_model or not api_key:
            raise ValueError(
                "Provider, embedding model, and API key are required inputs."
            )

        embedding_provider_data = {
            "provider": provider,
            "embedding_model": embedding_model,
            "api_key": api_key,
        }

        logger.info(f"Embedding provider configured: {provider}, {embedding_model}")

        return {"embedding_provider": embedding_provider_data}

    def build_tool(self):
        raise NotImplementedError("Subclasses must override build_tool")

    def process_tool(self):
        raise NotImplementedError("Subclasses must override process_tool")
