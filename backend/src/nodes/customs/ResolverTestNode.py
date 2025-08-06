from src.node_components.llm.providers.LLMProviderConsts import LLMProviderName
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.DropdownInputHandle import (
    DropdownInputHandle,
    DropdownOption,
)

# resolvers
from src.nodes.handles.resolvers.basics.HttpResolver import HttpResolver
from src.nodes.NodeBase import Node, NodeSpec


class ResolverTestNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Resolver Test",
        description="Test node for resolvers",
        inputs=[
            NodeInput(
                name="provider",
                type=DropdownInputHandle(
                    options=[
                        DropdownOption(label=str(provider), value=str(provider))
                        for provider in LLMProviderName.get_all()
                    ]
                ),
                description="LLM provider",
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="model",
                type=DropdownInputHandle(
                    options=[],
                    client_resolver=HttpResolver(
                        type="http",
                        url="https://api.openai.com/v1/models",
                        method="GET",
                        response_path="data[*].id",
                        error_path="error.message",
                    ),
                ),
                description="LLM model",
                allow_incoming_edges=False,
            ),
        ],
        outputs=[
            NodeOutput(
                name="response", type=str, description="The response from agent."
            )
        ],
        parameters={},
    )

    def process(self, input_values, parameter_values):
        provider = input_values["provider"]
        model = input_values["model"]

        string = f"provider: {provider}, model: {model}"

        return {"response": string}
