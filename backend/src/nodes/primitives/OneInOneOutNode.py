from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.DropdownInputHandle import (
    DropdownInputHandle,
    DropdownOption,
)
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
                name="departments",
                type=DropdownInputHandle(
                    options=[
                        DropdownOption(label="IT", value="IT"),
                        DropdownOption(label="Finance", value="Finance"),
                        DropdownOption(label="Marketing", value="Marketing"),
                        DropdownOption(label="Sales", value="Sales"),
                    ]
                ),
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

    def _fetch_departments(self):
        return ["IT", "Finance", "Marketing", "Sales"]
