import json
from typing import Any, Dict

import requests
from loguru import logger
from pydantic import BaseModel, Field
from src.nodes.core.NodeIcon import NodeIconIconify
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.SecretTextInputHandle import SecretTextInputHandle
from src.nodes.handles.basics.inputs.TextFieldInputHandle import (
    TextFieldInputHandle,
)
from src.nodes.handles.basics.outputs.StringOutputHandle import StringOutputHandle
from src.nodes.NodeBase import Node, NodeSpec
from src.schemas.flowbuilder.flow_graph_schemas import ToolConfig
from src.schemas.nodes.node_data_parsers import BuildToolResult


class TavilySearchNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Tavily Search",
        description="Search the web using Tavily API.",
        inputs=[
            NodeInput(
                name="search_query",
                type=TextFieldInputHandle(),
                description="The search query to send to Tavily API.",
                required=True,
                enable_as_whole_for_tool=True,
            ),
            NodeInput(
                name="api_key",
                type=SecretTextInputHandle(allow_visible_toggle=True, multiline=False),
                description="Your Tavily API key.",
                required=True,
                allow_incoming_edges=False,
            ),
        ],
        outputs=[
            NodeOutput(
                name="result",
                type=StringOutputHandle(),
                description="The search results as a JSON string.",
                enable_for_tool=True,
            ),
        ],
        parameters=[],
        can_be_tool=True,
        icon=NodeIconIconify(icon_value="hugeicons:global-search"),
    )

    async def process(  # noqa
        self, inputs: Dict[str, Any], parameters: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Process the Tavily search node by making a search request to Tavily API.

        Args:
            inputs: Dictionary containing the search query and API key
            parameters: Dictionary of parameters (not used in this node)

        Returns:
            Dictionary containing the search results as a JSON string
        """
        # Validate inputs
        search_query = inputs.get("search_query", "").strip()
        api_key = inputs.get("api_key", "").strip()

        if not search_query:
            raise ValueError("Search query cannot be empty")

        if not api_key:
            raise ValueError("API key cannot be empty")

        # Make API request to Tavily
        logger.info(f"Making Tavily search request: {search_query}")

        url = "https://api.tavily.com/search"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }
        payload = {"query": search_query}

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
        except requests.exceptions.Timeout:
            logger.error("Tavily API request timed out")
            raise ValueError("Request timed out")
        except requests.exceptions.ConnectionError:
            logger.error("Tavily API connection error")
            raise ValueError("Connection error - unable to reach the Tavily API")
        except requests.exceptions.RequestException as e:
            logger.error(f"Tavily API request error: {e}")
            raise ValueError(f"Request failed: {str(e)}")

        # Process response
        if response.status_code == 200:
            result = response.json()
            return {"result": json.dumps(result)}
        else:
            error_msg = f"API request failed with status code {response.status_code}"
            try:
                error_details = response.json()
                error_msg = f"{error_msg}: {json.dumps(error_details)}"
            except json.JSONDecodeError:
                error_msg = f"{error_msg}: {response.text}"
            logger.error(error_msg)
            raise ValueError(error_msg)

    def build_tool(
        self, inputs_values: Dict[str, Any], tool_configs: ToolConfig
    ) -> BuildToolResult:
        """
        Build a tool schema for the Tavily search node.

        Args:
            inputs_values: Dictionary containing input values from the node
            tool_configs: Tool configuration containing name and description

        Returns:
            BuildToolResult containing the tool schema
        """
        tool_name = (
            tool_configs.tool_name if tool_configs.tool_name else "TavilySearchTool"
        )
        tool_description = (
            tool_configs.tool_description
            if tool_configs.tool_description
            else "Web search tool that uses Tavily API to search the internet for information."
        )

        class TavilySearchToolSchema(BaseModel):
            search_query: str = Field(..., description="The search query to search for")

        return BuildToolResult(
            tool_name=tool_name,
            tool_description=tool_description,
            tool_schema=TavilySearchToolSchema,
        )

    def process_tool(self, inputs_values, parameter_values, tool_inputs):
        """
        Process the Tavily search as a tool.

        Args:
            inputs_values: Dictionary containing input values from the node
            parameter_values: Dictionary of parameters (not used in this node)
            tool_inputs: Dictionary containing tool inputs

        Returns:
            Dictionary containing the search results as a JSON string
        """
        # Merge the inputs_values with the tool inputs
        merged_inputs = {**inputs_values, **tool_inputs}

        # Process with the merged inputs
        res = self.process(merged_inputs, parameter_values)
        return res
