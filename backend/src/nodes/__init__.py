from src.nodes.categories.customs import (
    AgentNode,
    CalculatorNode,
    EmbeddingProviderNode,
    FanInNode,
    FanOutNode,
    HttpRequestNode,
    LLMProviderNode,
    LLMRouterNode,
    MemoryNode,
)
from src.nodes.categories.database import (
    PineconeDBNode,
    PostgresDBNode,
    QdrantDBNode,
    WeaviateDBNode,
)
from src.nodes.categories.integrations import TavilySearchNode
from src.nodes.categories.primitives import (
    ChatInput,
    ChatOutput,
)
from src.nodes.categories.trials import DelayNode, TrialTextInputNode

custom_nodes = [
    AgentNode,
    CalculatorNode,
    FanInNode,
    FanOutNode,
    HttpRequestNode,
    LLMProviderNode,
    LLMRouterNode,
    MemoryNode,
    EmbeddingProviderNode,
]

database_nodes = [PostgresDBNode, QdrantDBNode, PineconeDBNode, WeaviateDBNode]

primitives_nodes = [ChatInput, ChatOutput]
trials_nodes = [TrialTextInputNode, DelayNode]

integrations_nodes = [TavilySearchNode]

__all__ = [
    *primitives_nodes,
    *custom_nodes,
    *trials_nodes,
    *integrations_nodes,
    *database_nodes,
]
