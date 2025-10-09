from typing import Any, Dict

from pydantic import BaseModel
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.handles.basics.outputs.DataOutputHandle import DataOutputHandle
from src.nodes.NodeBase import Node, NodeSpec
from src.schemas.flowbuilder.flow_graph_schemas import ToolConfig
from src.schemas.nodes.node_data_parsers import BuildToolResult


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
        parameters=[],
        can_be_tool=True,
    )

    async def process(self, inputs, parameters):
        # return {"tool_result": inputs["input_message"], "tool_result2": "hello"}
        return {"tool_result": inputs["input_message"]}

    def build_tool(
        self, inputs_values: Dict[str, Any], tool_configs: ToolConfig
    ) -> BuildToolResult:
        from loguru import logger

        logger.info("build tool bro")

        tool_name = tool_configs.tool_name if tool_configs.tool_name else "Tool"
        tool_description = (
            tool_configs.tool_description
            if tool_configs.tool_description
            else "Tool node that processes messages."
        )

        class ToolSchema(BaseModel):
            input_message: str
            system_instruction: str

        return BuildToolResult(
            tool_name=tool_name,
            tool_description=tool_description,
            tool_schema=ToolSchema,
        )

    def process_tool(
        self,
        inputs_values: Dict[str, Any],
        parameter_values: Dict[str, Any],
        tool_inputs: Dict[str, Any],
    ) -> Any:
        """
        Process tool inputs for tool functionality.

        Args:
            inputs_values: Dictionary containing input values
            parameter_values: Dictionary of parameter values
            tool_inputs: Dictionary of tool inputs

        Returns:
            Tool processing result
        """
        return {"tool_result": tool_inputs.get("input_message", "")}
