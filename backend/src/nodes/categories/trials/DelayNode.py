import asyncio
import time
from typing import Any, Dict

from src.consts.node_consts import NODE_GROUP_CONSTS
from src.nodes.core import NodeInput, NodeOutput
from src.nodes.core.NodeIcon import NodeIconIconify
from src.nodes.handles.basics.inputs import NumberInputHandle, TextFieldInputHandle
from src.nodes.handles.basics.outputs import StringOutputHandle
from src.nodes.NodeBase import Node, NodeSpec


class DelayNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Delay",
        description="A node that simulates a delay/sleep before outputting the text input.",
        inputs=[
            NodeInput(
                name="delay_seconds",
                type=NumberInputHandle(min_value=0, step=0.1, integer_only=False),
                description="The number of seconds to delay before outputting the text.",
                required=True,
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="text_input",
                type=TextFieldInputHandle(multiline=True),
                description="The text input to be output after the delay.",
                required=True,
                allow_incoming_edges=True,
            ),
        ],
        outputs=[
            NodeOutput(
                name="text_output",
                type=StringOutputHandle(),
                description="The text output after the delay.",
            )
        ],
        parameters=[],
        icon=NodeIconIconify(icon_value="material-symbols:timer"),
        group=NODE_GROUP_CONSTS.TRIAL,
        tags=["delay", "sleep", "text", "trial"],
    )

    async def process(
        self, inputs: Dict[str, Any], parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process the inputs with a delay and return the text as output."""
        delay_seconds = float(inputs["delay_seconds"])
        text_input = inputs["text_input"]

        # Simulate delay/sleep
        if delay_seconds > 0:
            await asyncio.sleep(delay_seconds)

        return {"text_output": text_input}

    def build_tool(self, inputs_values, tool_configs):
        """Not implemented for this trial node."""
        raise NotImplementedError("Subclasses must override build_tool")

    def process_tool(self, inputs_values, parameter_values, tool_inputs):
        """Not implemented for this trial node."""
        raise NotImplementedError("Subclasses must override process_tool")
