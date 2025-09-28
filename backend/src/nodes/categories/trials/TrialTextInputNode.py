from src.consts.node_consts import NODE_GROUP_CONSTS
from src.nodes.core import NodeInput, NodeOutput
from src.nodes.core.NodeIcon import NodeIconIconify
from src.nodes.handles.basics.inputs import TextFieldInputHandle
from src.nodes.handles.basics.outputs import StringOutputHandle
from src.nodes.NodeBase import Node, NodeSpec


class TrialTextInputNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Trial Text Input",
        description="A node that accepts text input and returns it as output for trial purposes.",
        inputs=[
            NodeInput(
                name="text_input",
                type=TextFieldInputHandle(multiline=True),
                description="The text input to be processed.",
                required=True,
                allow_incoming_edges=False,
            )
        ],
        outputs=[
            NodeOutput(
                name="text_output",
                type=StringOutputHandle(),
                description="The text output that mirrors the input.",
            )
        ],
        parameters=[],
        icon=NodeIconIconify(icon_value="material-symbols:text-fields"),
        group=NODE_GROUP_CONSTS.TRIAL,
        tags=["input", "text", "trial"],
    )

    def process(self, inputs, parameters):
        """Process the text input and return it as output."""
        return {"text_output": inputs["text_input"]}

    def build_tool(self, inputs_values, tool_configs):
        """Not implemented for this trial node."""
        raise NotImplementedError("Subclasses must override build_tool")

    def process_tool(self, inputs_values, parameter_values, tool_inputs):
        """Not implemented for this trial node."""
        raise NotImplementedError("Subclasses must override process_tool")
