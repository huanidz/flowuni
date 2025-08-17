import json
from typing import Any, Dict, Union

import requests
from loguru import logger
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
from src.nodes.utils.http_request_node_utils import (
    build_merged_tool_schema,
    create_body_schema_from_toolable_json,
    create_pydantic_model_from_table_data,
    extract_toolable_items,
)
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

    def process(  # noqa
        self, inputs: Dict[str, Any], parameters: Dict[str, Any]
    ) -> Dict[str, Union[float, int, str, dict]]:
        """
        Process the HTTP request node by making an HTTP request.

        Args:
            inputs: Dictionary containing the request parameters
            parameters: Dictionary of parameters (not used in this node)

        Returns:
            Dictionary containing the HTTP response or error message
        """
        try:
            # Validate URL
            url = inputs.get("url", "").strip()
            if not url:
                return {"result": {"error": "URL cannot be empty"}}

            # Validate HTTP method
            method = inputs.get("method", "GET").upper()
            supported_methods = ["GET", "POST", "PUT", "PATCH", "DELETE"]
            if method not in supported_methods:
                return {
                    "result": {
                        "error": f"Unsupported HTTP method: {method}. Supported methods: {supported_methods}"  # noqa
                    }
                }

            # Process headers
            headers_dict = {}
            headers = inputs.get("headers", [])
            if headers:
                for header in headers:
                    if (
                        isinstance(header, dict)
                        and "name" in header
                        and "value" in header
                    ):
                        name = header.get("name", "").strip()
                        value = header.get("value", "").strip()
                        if name and value:  # Only add non-empty headers
                            headers_dict[name] = value

            # Process query parameters
            params_dict = {}
            query_params = inputs.get("query_params", [])
            if query_params:
                for param in query_params:
                    if isinstance(param, dict) and "name" in param and "value" in param:
                        name = param.get("name", "").strip()
                        value = param.get("value", "").strip()
                        if name and value:  # Only add non-empty params
                            params_dict[name] = value

            # Process body
            body_data = None
            body = inputs.get("body", {})
            if body and isinstance(body, dict):
                # Check if body has the expected structure
                if "type_values" in body:
                    type_values = body.get("type_values", {})
                    # Always use TextFieldInputHandle as specified
                    text_field_value = type_values.get("TextFieldInputHandle")
                    if text_field_value and text_field_value.strip():
                        try:
                            # Try to parse as JSON
                            body_data = json.loads(text_field_value)
                        except json.JSONDecodeError:
                            # If not valid JSON, use as string
                            body_data = text_field_value.strip()
                elif body:
                    # Handle case where body is directly provided (fallback)
                    body_data = body

            # Add Content-Type header if body is present and no Content-Type is set
            if (
                body_data is not None
                and "Content-Type" not in headers_dict
                and "content-type" not in headers_dict
            ):
                if isinstance(body_data, dict):
                    headers_dict["Content-Type"] = "application/json"
                else:
                    headers_dict["Content-Type"] = "text/plain"

            # Make HTTP request
            logger.info(f"Making {method} request to {url}")

            request_kwargs = {
                "method": method,
                "url": url,
                "headers": headers_dict if headers_dict else None,
                "params": params_dict if params_dict else None,
                "timeout": 30,  # 30 second timeout
            }

            # Add body for methods that support it
            if method in ["POST", "PUT", "PATCH"] and body_data is not None:
                if isinstance(body_data, dict):
                    request_kwargs["json"] = body_data
                else:
                    request_kwargs["data"] = body_data

            response = requests.request(**request_kwargs)

            # Process response
            result = {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "url": response.url,
            }

            # Try to parse response as JSON, fallback to text
            try:
                result["data"] = response.json()
            except json.JSONDecodeError:
                result["data"] = response.text

            # Add success/error status
            result["success"] = 200 <= response.status_code < 300

            return {"result": str(result)}

        except requests.exceptions.Timeout:
            logger.error("HTTP request timed out")
            return {"result": str({"error": "Request timed out"})}
        except requests.exceptions.ConnectionError:
            logger.error("HTTP connection error")
            return {
                "result": str(
                    {"error": "Connection error - unable to reach the server"}
                )
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"HTTP request error: {e}")
            return str({"result": {"error": f"Request failed: {str(e)}"}})
        except Exception as e:
            logger.error(f"Unexpected error in HTTP request: {e}")
            return str({"result": {"error": f"Unexpected error: {str(e)}"}})

    def build_tool(
        self, inputs_values: Dict[str, Any], tool_configs: ToolConfig
    ) -> BuildToolResult:
        """
        Build a tool schema by merging headers, query parameters, and body schemas.

        Args:
            inputs_values: Dictionary containing input values from the node
            tool_configs: Tool configuration containing name and description

        Returns:
            BuildToolResult containing the merged tool schema

        Raises:
            ValueError: If body type is not 'Toolable Json' or no toolable fields found
            RuntimeError: If schema creation fails
        """
        tool_name = (
            tool_configs.tool_name if tool_configs.tool_name else "HttpRequestTool"
        )
        tool_description = (
            tool_configs.tool_description
            if tool_configs.tool_description
            else "HTTP Request tool that sends HTTP requests with configurable headers, query parameters, and body."  # noqa
        )

        # Extract input values
        headers = inputs_values.get("headers", [])
        query_params = inputs_values.get("query_params", [])
        body = inputs_values.get("body", {})

        # Create individual schemas
        toolable_headers = extract_toolable_items(headers, "headers")
        HeaderToolSchema = create_pydantic_model_from_table_data(
            input_list=toolable_headers, model_name="HeaderToolSchema"
        )

        toolable_query_params = extract_toolable_items(query_params, "query parameters")
        QueryToolSchema = create_pydantic_model_from_table_data(
            input_list=toolable_query_params, model_name="QueryToolSchema"
        )

        BodyJsonSchema = create_body_schema_from_toolable_json(body)

        # Build merged schema
        tool_schema = build_merged_tool_schema(
            HeaderToolSchema, QueryToolSchema, BodyJsonSchema, tool_name
        )

        return BuildToolResult(
            tool_name=tool_name,
            tool_description=tool_description,
            tool_schema=tool_schema,
        )
