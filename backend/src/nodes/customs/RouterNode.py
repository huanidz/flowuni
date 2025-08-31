from typing import Any, Dict, Union

from loguru import logger
from src.consts.node_consts import NODE_LABEL_CONSTS, SPECIAL_NODE_INPUT_CONSTS
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.handles.basics.outputs import RouterOutputHandle
from src.nodes.handles.basics.outputs.RouterOutputHandle import RouterOutputData
from src.nodes.NodeBase import Node, NodeSpec
from src.schemas.flowbuilder.flow_graph_schemas import ToolConfig
from src.schemas.nodes.node_data_parsers import BuildToolResult


class RouterNode(Node):
    spec: NodeSpec = NodeSpec(
        name=NODE_LABEL_CONSTS.ROUTER,
        description="Router node that will route input to other nodes.",
        inputs=[
            NodeInput(
                name="input_text",
                type=TextFieldInputHandle(),
                description="The input need to be routed.",
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
        parameters={},
    )

    def process(
        self, inputs: Dict[str, Any], parameters: Dict[str, Any]
    ) -> Dict[str, Union[float, int, str]]:
        sample_label_decisions = inputs[SPECIAL_NODE_INPUT_CONSTS.ROUTER_ROUTE_LABELS]
        logger.info(f"👉 sample_label_decisions: {sample_label_decisions}")

        output_data = RouterOutputData(
            route_value=inputs["input_text"],
            route_label_decisons=sample_label_decisions,
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
