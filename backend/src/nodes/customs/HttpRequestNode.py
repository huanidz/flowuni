from typing import Any, Dict, List, Union

from pydantic import BaseModel
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs import ToolableJsonInputHandle
from src.nodes.handles.basics.inputs.DropdownInputHandle import (
    DropdownInputHandle,
    DropdownOption,
)
from src.nodes.handles.basics.inputs.DynamicTypeInputHandle import (
    DynamicTypeInputHandle,
    DynamicTypeItem,
)
from src.nodes.handles.basics.inputs.TableInputHandle import (
    TableColumn,
    TableColumnDType,
    TableInputHandle,
)
from src.nodes.handles.basics.inputs.TextFieldInputHandle import (
    TextFieldInputFormatEnum,
    TextFieldInputHandle,
)
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
                        DropdownOption(label="PUT", value="PUT"),
                        DropdownOption(label="PATCH", value="PATCH"),
                        DropdownOption(label="DELETE", value="DELETE"),
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
                        TableColumn(
                            name="name", label="name", dtype=TableColumnDType.STRING
                        ),
                        TableColumn(
                            name="value", label="value", dtype=TableColumnDType.STRING
                        ),
                        TableColumn(
                            name="ToolEnable",
                            label="ToolEnable",
                            dtype=TableColumnDType.BOOLEAN,
                        ),
                    ]
                ),
                description="The headers of the request.",
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="query_params",
                type=TableInputHandle(
                    columns=[
                        TableColumn(
                            name="name", label="name", dtype=TableColumnDType.STRING
                        ),
                        TableColumn(
                            name="value", label="value", dtype=TableColumnDType.STRING
                        ),
                        TableColumn(
                            name="ToolEnable",
                            label="ToolEnable",
                            dtype=TableColumnDType.BOOLEAN,
                        ),
                    ]
                ),
                description="The query params of the request.",
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="body",
                type=DynamicTypeInputHandle(
                    type_options=[
                        DynamicTypeItem(
                            type_label="Json",
                            type_name=TextFieldInputHandle.__name__,
                            details=TextFieldInputHandle(
                                multiline=True,
                                format=TextFieldInputFormatEnum.JSON,
                            ),
                        ),
                        DynamicTypeItem(
                            type_label="Toolable Json",
                            type_name=ToolableJsonInputHandle.__name__,
                            details=ToolableJsonInputHandle(),
                        ),
                        DynamicTypeItem(
                            type_label="Form",
                            type_name=TableInputHandle.__name__,
                            details=TableInputHandle(
                                columns=[
                                    TableColumn(
                                        name="name",
                                        label="name",
                                        dtype=TableColumnDType.STRING,
                                    ),
                                    TableColumn(
                                        name="value",
                                        label="value",
                                        dtype=TableColumnDType.STRING,
                                    ),
                                    TableColumn(
                                        name="ToolEnable",
                                        label="ToolEnable",
                                        dtype=TableColumnDType.BOOLEAN,
                                    ),
                                ]
                            ),
                        ),
                    ]
                ),
                description="The JSON body of the request.",
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

    def build_tool(
        self, inputs_values: Dict[str, Any], tool_configs: ToolConfig
    ) -> BuildToolResult:
        tool_name = (
            tool_configs.tool_name if tool_configs.tool_name else "HttpRequestTool"
        )
        tool_description = (
            tool_configs.tool_description
            if tool_configs.tool_description
            else "HttpRequest tool that will send http request."
        )

        class HttpRequestHeaderSchema(BaseModel):
            name: str
            value: str

        class HttpRequestQuerySchema(BaseModel):
            name: str
            value: str

        class HttpRequestBodySchema(BaseModel):
            name: str
            value: str

        class HttpRequestSchema(BaseModel):
            headers: List[HttpRequestHeaderSchema]
            query_params: List[HttpRequestQuerySchema]
            body: List[HttpRequestBodySchema]

        return BuildToolResult(
            tool_name=tool_name,
            tool_description=tool_description,
            tool_schema=HttpRequestSchema,
        )
