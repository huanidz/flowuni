from src.nodes.categories.customs import (
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
)
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
]

primitives_nodes = [ChatInput, ChatOutput]
trials_nodes = [TrialTextInputNode, DelayNode]

__all__ = [*primitives_nodes, *custom_nodes, *trials_nodes]
