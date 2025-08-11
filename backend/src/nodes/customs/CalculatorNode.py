from pydantic import BaseModel
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.handles.basics.outputs.DataOutputHandle import DataOutputHandle
from src.nodes.NodeBase import Node, NodeSpec


class CalculatorNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Calculator",
        description="Calculator node that will run math expression.",
        inputs=[
            NodeInput(
                name="expression",
                type=TextFieldInputHandle(),
                description="The expression need to be evaluated.",
                enable_for_tool=True,
            ),
        ],
        outputs=[
            NodeOutput(
                name="result",
                type=DataOutputHandle(),
                description="The response from agent.",
                enable_for_tool=True,
            ),
        ],
        parameters={},
        can_be_tool=True,
    )

    def process(self, inputs, parameters):
        # return {"tool_result": inputs["input_message"], "tool_result2": "hello"}
        return {"tool_result": inputs["input_message"]}

    def build_tool(self):
        class CalculatorSchema(BaseModel):
            expression: str

        return CalculatorSchema
