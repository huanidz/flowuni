from loguru import logger
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.core.NodeParameterSpec import ParameterSpec
from src.nodes.handles.basics.inputs import NumberInputHandle
from src.nodes.handles.basics.inputs.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.handles.basics.outputs import StringOutputHandle
from src.nodes.NodeBase import Node, NodeSpec


class StringTransformNode(Node):
    spec: NodeSpec = NodeSpec(
        name="String Transform",
        description="A node that transforms a string.",
        inputs=[
            NodeInput(
                name="input",
                type=TextFieldInputHandle(),
                description="The string to be transformed.",
            ),
            NodeInput(
                name="num_input",
                type=NumberInputHandle(),
                description="The string to be transformed.",
            ),
        ],
        outputs=[
            NodeOutput(
                name="output",
                type=StringOutputHandle(),
                description="The transformed string.",
            )
        ],
        parameters=[
            ParameterSpec(
                name="delay",
                type=TextFieldInputHandle(),
                default=0,
                description="Delay in seconds.",
            )
        ],
        can_be_tool=False,
    )

    def process(self, input_values, parameter_values):
        input_string = input_values["input"]

        logger.info(f"👉 parameter_values: {parameter_values}")

        import time

        time.sleep(1)

        if not input_string:
            return {"output": ""}

        # Implement your transformation logic here
        transformed_string = str(input_string).upper()

        return {"output": transformed_string}

    def build_tool(self):
        raise NotImplementedError("Subclasses must override build_tool")

    def process_tool(self):
        raise NotImplementedError("Subclasses must override process_tool")
