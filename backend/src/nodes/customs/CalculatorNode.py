from typing import Any, Dict, Union

from loguru import logger
from pydantic import BaseModel
from src.components.funcs.CalculatorNodeFuncs import safe_eval
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.handles.basics.outputs import NumberOutputHandle
from src.nodes.NodeBase import Node, NodeSpec
from src.schemas.flowbuilder.flow_graph_schemas import ToolConfig
from src.schemas.nodes.node_data_parsers import BuildToolResult


class CalculatorNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Calculator",
        description="Calculator node that will run math expression.",
        inputs=[
            NodeInput(
                name="expression",
                type=TextFieldInputHandle(),
                description="The expression need to be evaluated.",
                enable_as_whole_for_tool=True,
            ),
        ],
        outputs=[
            NodeOutput(
                name="result",
                type=NumberOutputHandle(),
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
        expression: str = inputs.get("expression", "")

        # Log the incoming expression for debugging
        logger.info(f"Evaluating expression: {expression}")

        result = safe_eval(expression)

        return {"result": result}

    def build_tool(
        self, inputs_values: Dict[str, Any], tool_configs: ToolConfig
    ) -> BuildToolResult:
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

    def process_tool(
        self,
        inputs_values: Dict[str, Any],
        parameter_values: Dict[str, Any],
        tool_inputs: Dict[str, Any],
    ) -> Any:
        """
        Process tool inputs for calculator functionality.

        Args:
            inputs_values: Dictionary containing input values
            parameter_values: Dictionary of parameter values
            tool_inputs: Dictionary of tool inputs (expression to evaluate)

        Returns:
            Calculator result
        """
        expression = tool_inputs.get("expression", "")
        result = safe_eval(expression)
        return {"result": result}
