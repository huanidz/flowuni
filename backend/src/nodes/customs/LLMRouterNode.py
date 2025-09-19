import json
from typing import Any, Dict, List, Union

from loguru import logger
from pydantic import BaseModel, Field
from src.components.agents.AgentBase import Agent
from src.components.llm.models.core import (
    ChatMessage,
)
from src.components.llm.providers.adapters.LLMProviderInterface import LLMProviderBase
from src.components.llm.providers.LLMProviderFactory import LLMProviderFactory
from src.consts.node_consts import NODE_TAGS_CONSTS, SPECIAL_NODE_INPUT_CONSTS
from src.models.parsers.LLMProviderParser import LLMProviderParser
from src.nodes.core.NodeIcon import NodeIconIconify
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs import (
    LLMProviderInputHandle,
    TextFieldInputHandle,
)
from src.nodes.handles.basics.outputs import RouterOutputHandle
from src.nodes.handles.basics.outputs.RouterOutputHandle import RouterOutputData
from src.nodes.NodeBase import Node, NodeSpec
from src.schemas.flowbuilder.flow_graph_schemas import ToolConfig
from src.schemas.nodes.node_data_parsers import BuildToolResult


class LLMRouterNode(Node):
    spec: NodeSpec = NodeSpec(
        name="LLM Router",
        description="Router node that uses LLM to determine routing decisions.",
        inputs=[
            NodeInput(
                name="llm_provider",
                type=LLMProviderInputHandle(),
                description="LLM provider for routing decisions",
                required=True,
            ),
            NodeInput(
                name="additional_instruction",
                type=TextFieldInputHandle(
                    multiline=True,
                ),
                description="Additional instruction for the LLM to determine routing better.",  # noqa
                required=False,
            ),
            NodeInput(
                name="input_text",
                type=TextFieldInputHandle(),
                description="The input text to be routed based on LLM analysis.",
                required=True,
            ),
            NodeInput(
                name=SPECIAL_NODE_INPUT_CONSTS.ROUTER_ROUTE_LABELS,
                type=TextFieldInputHandle(
                    hidden=True
                ),  # Not allow user to input into this field, this is for internal use
                description="The routing labels.",
            ),
        ],
        outputs=[
            NodeOutput(
                name="routed_output",
                type=RouterOutputHandle(),
                description="The routing output from the node.",
            ),
        ],
        parameters=[],
        icon=NodeIconIconify(icon_value="tabler:route-alt-right"),
        tags=[NODE_TAGS_CONSTS.ROUTING],
    )

    def process(
        self, inputs: Dict[str, Any], parameters: Dict[str, Any]
    ) -> Dict[str, Union[float, int, str]]:
        llm_provider = inputs["llm_provider"]
        input_text = inputs["input_text"]
        additional_instruction = inputs.get("additional_instruction", "")
        sample_label_decisions = inputs[SPECIAL_NODE_INPUT_CONSTS.ROUTER_ROUTE_LABELS]
        logger.info(f"👉 sample_label_decisions: {sample_label_decisions}")
        sample_label_decisions = json.loads(sample_label_decisions)
        logger.info(f"👉 input_text: {input_text}")
        logger.info(f"👉 sample_label_decisions: {sample_label_decisions}")

        if not llm_provider:
            raise ValueError(
                "LLM provider is required. Please use a LLMProvider node to connect to this input."  # noqa
            )

        parsed_provider = LLMProviderParser.model_validate_json(llm_provider)

        llm_provider_instance: LLMProviderBase = LLMProviderFactory.get_provider(
            provider_name=parsed_provider.provider
        )
        routing_prompt = self._get_routing_prompt(input_text, sample_label_decisions)
        llm_provider_instance.init(
            model=parsed_provider.model,
            system_prompt=self._get_routing_system_prompt(additional_instruction),
            api_key=parsed_provider.api_key,
        )

        chat_message = ChatMessage(role="user", content=routing_prompt)
        agent = Agent(
            llm_provider=llm_provider_instance,
            system_prompt=self._get_routing_system_prompt(additional_instruction),
            tools=[],
        )
        route_decision_structured_output = agent.chat_structured(
            message=chat_message,
            prev_histories=[],
            output_schema=self._get_routing_structured_schema(),
        )

        route_decision: List[str] = (
            route_decision_structured_output.route_label_decisons
        )

        # Unique the labels
        route_decision = list(set(route_decision))

        output_data = RouterOutputData(
            route_value=input_text,
            route_label_decisons=route_decision,
        )

        return {"routed_output": output_data.model_dump()}

    def build_tool(
        self, inputs_values: Dict[str, Any], tool_configs: ToolConfig
    ) -> BuildToolResult:
        raise NotImplementedError("Subclasses must override build_tool")

    def process_tool(
        self,
        inputs_values: Dict[str, Any],
        parameter_values: Dict[str, Any],
        tool_inputs: Dict[str, Any],
    ) -> Any:
        raise NotImplementedError("Subclasses must override process_tool")

    def _get_routing_prompt(self, input_text: str, sample_labels: str) -> str:
        prompt = f"""Analyze the following input and determine which route it should take.

Available routes: {sample_labels}

Input text: {input_text}

Please respond with only the route name that best matches this input.
        """

        return prompt

    def _get_routing_system_prompt(self, additional_instruction: str) -> str:
        base_prompt = "You are an expert at routing text inputs based on their content."
        if additional_instruction:
            base_prompt += f" {additional_instruction}"
        return base_prompt

    def _get_routing_structured_schema(self) -> BaseModel:
        """Get the structured schema for the routing output."""

        class RoutingOutputSchema(BaseModel):
            route_label_decisons: List[str] = Field(
                default_factory=list,
                description="The decided route labels. It can be empty or multiple labels.",
            )  # noqa

        return RoutingOutputSchema
