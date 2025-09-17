from src.nodes.core import NodeInput, NodeOutput
from src.nodes.core.NodeIcon import NodeIconIconify
from src.nodes.handles.basics.inputs import TextFieldInputHandle
from src.nodes.handles.basics.outputs import StringOutputHandle
from src.nodes.NodeBase import Node, NodeSpec


class ChatInput(Node):
    spec: NodeSpec = NodeSpec(
        name="Chat Input",
        description="A node that accepts user input and returns a message.",
        inputs=[
            NodeInput(
                name="message_in",
                type=TextFieldInputHandle(multiline=True, hidden=True),
                description="The message to be sent.",
            )
        ],
        outputs=[
            NodeOutput(
                name="user_message",
                type=StringOutputHandle(),
                description="The message received.",
            )
        ],
        parameters=[],
        icon=NodeIconIconify(icon_value="material-symbols:input"),
    )

    def process(self, inputs, parameters):
        return {"user_message": inputs["message_in"]}

    def build_tool(self, inputs_values, tool_configs):
        raise NotImplementedError("Subclasses must override build_tool")

    def process_tool(self, inputs_values, parameter_values, tool_inputs):
        raise NotImplementedError("Subclasses must override process_tool")
