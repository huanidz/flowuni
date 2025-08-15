from pydantic import BaseModel
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.handles.basics.outputs.DataOutputHandle import DataOutputHandle
from src.nodes.NodeBase import Node, NodeSpec


class ToolNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Tool",
        description="Tool node that use tools to process the message.",
        inputs=[
            NodeInput(
                name="input_message",
                type=TextFieldInputHandle(),
                description="The message to be processed by agent.",
                enable_as_whole_for_tool=True,
            ),
            NodeInput(
                name="system_instruction",
                type=TextFieldInputHandle(),
                description="Agent instruction",
            ),
        ],
        outputs=[
            NodeOutput(
                name="tool_result",
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
        from loguru import logger

        logger.info("build tool bro")

        class ToolSchema(BaseModel):
            input_message: str
            system_instruction: str

        return ToolSchema
