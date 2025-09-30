from typing import Any, Dict, Union

from loguru import logger
from src.nodes.core.NodeIcon import NodeIconIconify
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.handles.basics.outputs.DataOutputHandle import DataOutputHandle
from src.nodes.NodeBase import Node, NodeSpec


class FanInNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Fan In",
        description="A node that takes multiple inputs and combines them into a single output.",
        inputs=[
            NodeInput(
                name="input",
                type=TextFieldInputHandle(),
                description="The input data to be combined (can accept multiple connections).",
                required=True,
                allow_multiple_incoming_edges=True,
            ),
        ],
        outputs=[
            NodeOutput(
                name="output",
                type=DataOutputHandle(),
                description="The combined output data.",
            ),
        ],
        parameters=[],
        can_be_tool=False,
        icon=NodeIconIconify(icon_value="material-symbols:call-merge"),
    )

    def process(
        self, inputs: Dict[str, Any], parameters: Dict[str, Any]
    ) -> Dict[str, Union[str, dict]]:
        """
        Process the fan-in node by combining multiple inputs into a single output.

        Args:
            inputs: Dictionary containing the input data (can be a single value or a list)
            parameters: Dictionary of parameters (not used in this node)

        Returns:
            Dictionary containing the combined output data
        """
        input_data = inputs.get("input", "")

        # Log the incoming input for debugging
        logger.info(f"FanInNode processing input: {input_data}")

        # Handle different input types
        if isinstance(input_data, list):
            # If it's a list, join the elements with a newline
            result = "\n".join(str(item) for item in input_data)
        else:
            # If it's a single value, pass it through
            result = str(input_data)

        return {"output": result}

    def build_tool(self, inputs_values: Dict[str, Any], tool_configs):
        raise NotImplementedError("Subclasses must override build_tool")

    def process_tool(
        self,
        inputs_values: Dict[str, Any],
        parameter_values: Dict[str, Any],
        tool_inputs: Dict[str, Any],
    ) -> Any:
        raise NotImplementedError("Subclasses must override process_tool")
