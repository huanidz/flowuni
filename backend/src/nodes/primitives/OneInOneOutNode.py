from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.DropdownInputHandle import DropdownInputHandle
from src.nodes.handles.basics.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.NodeBase import Node, NodeSpec


class OneInOneOutNode(Node):
    spec: NodeSpec = NodeSpec(
        name="One-in-One-out Node",
        description="A node that accepts user input and returns a message.",
        inputs=[
            NodeInput(
                name="message_in",
                type=TextFieldInputHandle(
                    max_length=100, placeholder="Enter a message", multiline=True
                ),
                description="The message to be sent.",
            ),
            NodeInput(
                name="message_in2",
                type=DropdownInputHandle,
                description="The message to be sent.",
            ),
        ],
        outputs=[
            NodeOutput(
                name="message_out", type=str, description="The message received."
            )
        ],
        parameters={},
    )

    def process(self, inputs, parameters):
        return {"message_out": inputs["message_in"]}
