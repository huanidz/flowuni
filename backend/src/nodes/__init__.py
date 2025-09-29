from src.nodes.categories.customs import (
    AgentNode,
    CalculatorNode,
    ComparisonRouterNode,
    EmbeddingProviderNode,
    FanInNode,
    FanOutNode,
    HttpRequestNode,
    LLMProviderNode,
    LLMRouterNode,
    MemoryNode,
    RouterNode,
    StringAggregatorNode,
    StringTransformNode,
)
from src.nodes.categories.database import PostgresDBNode
from src.nodes.categories.integrations import TavilySearchNode
from src.nodes.categories.primitives import (
    ChatInput,
    ChatOutput,
)
from src.nodes.categories.trials import DelayNode, TrialTextInputNode

custom_nodes = [
    AgentNode,
    CalculatorNode,
    ComparisonRouterNode,
    FanInNode,
    FanOutNode,
    HttpRequestNode,
    LLMProviderNode,
    LLMRouterNode,
    MemoryNode,
    RouterNode,
    StringAggregatorNode,
    StringTransformNode,
    EmbeddingProviderNode,
]

database_nodes = [PostgresDBNode]

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
