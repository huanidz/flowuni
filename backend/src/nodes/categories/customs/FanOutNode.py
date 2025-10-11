from typing import Any, Dict, Union

from loguru import logger
from src.nodes.core.NodeIcon import NodeIconIconify
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.handles.basics.outputs.DataOutputHandle import DataOutputHandle
from src.nodes.NodeBase import Node, NodeSpec


class FanOutNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Fan Out",
        description="A node that takes a single input and passes it through to the output.",
        inputs=[
            NodeInput(
                name="input",
                type=TextFieldInputHandle(),
                description="The input data to be passed through.",
                required=True,
            ),
        ],
        outputs=[
            NodeOutput(
                name="output",
                type=DataOutputHandle(),
                description="The output data (same as input).",
            ),
        ],
        parameters=[],
        can_be_tool=False,
        icon=NodeIconIconify(icon_value="material-symbols:call-split"),
    )

    async def process(
        self, inputs: Dict[str, Any], parameters: Dict[str, Any]
    ) -> Dict[str, Union[str, dict]]:
        """
        Process the fan-out node by passing the input directly to the output.

        Args:
            inputs: Dictionary containing the input data
            parameters: Dictionary of parameters (not used in this node)

        Returns:
            Dictionary containing the output data (same as input)
        """
        input_data = inputs.get("input", "")

        # Log the incoming input for debugging
        logger.info(f"FanOutNode processing input: {input_data}")

        # Simply pass through the input data
        return {"output": input_data}

    def build_tool(self, inputs_values: Dict[str, Any], tool_configs):
        raise NotImplementedError("Subclasses must override build_tool")

    def process_tool(
        self,
        inputs_values: Dict[str, Any],
        parameter_values: Dict[str, Any],
        tool_inputs: Dict[str, Any],
    ) -> Any:
        raise NotImplementedError("Subclasses must override process_tool")
