from typing import Any, Dict, Union

from pydantic import BaseModel
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.DropdownInputHandle import (
    DropdownInputHandle,
    DropdownOption,
)
from src.nodes.handles.basics.inputs.TableInputHandle import (
    TableColumn,
    TableInputHandle,
)
from src.nodes.handles.basics.inputs.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.handles.basics.outputs.DataOutputHandle import DataOutputHandle
from src.nodes.NodeBase import Node, NodeSpec
from src.schemas.flowbuilder.flow_graph_schemas import ToolConfig
from src.schemas.nodes.node_data_parsers import BuildToolResult


class HttpRequestNode(Node):
    spec: NodeSpec = NodeSpec(
        name="HTTP Request",
        description="HTTP Request node perform request.",
        inputs=[
            NodeInput(
                name="url",
                type=TextFieldInputHandle(),
                description="The URL of the request.",
            ),
            NodeInput(
                name="method",
                type=DropdownInputHandle(
                    options=[
                        DropdownOption(label="GET", value="GET"),
                        DropdownOption(label="POST", value="POST"),
                    ]
                ),
                description="The method of the request.",
                default="GET",
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="headers",
                type=TableInputHandle(
                    columns=[
                        TableColumn(name="Key", label="Key"),
                        TableColumn(name="Value", label="Value"),
                    ]
                ),
                description="The headers of the request.",
                allow_incoming_edges=False,
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

    def process(
        self, inputs: Dict[str, Any], parameters: Dict[str, Any]
    ) -> Dict[str, Union[float, int, str]]:
        """
        Process the calculator node by evaluating the mathematical expression.

        Args:
            inputs: Dictionary containing the expression to evaluate
            parameters: Dictionary of parameters (not used in this node)

        Returns:
            Dictionary containing the evaluation result or error message
        """
        # expression: str = inputs.get("expression", "")

        # # Log the incoming expression for debugging
        # logger.info(f"Evaluating expression: {expression}")

        # result = safe_eval(expression)

        return {"result": "zxc"}

    def build_tool(self, tool_configs: ToolConfig) -> BuildToolResult:
        tool_name = tool_configs.tool_name if tool_configs.tool_name else "Calculator"
        tool_description = (
            tool_configs.tool_description
            if tool_configs.tool_description
            else "Calculator tool that will run math expression."
        )

        class CalculatorSchema(BaseModel):
            expression: str

        return BuildToolResult(
            tool_name=tool_name,
            tool_description=tool_description,
            tool_schema=CalculatorSchema,
        )
