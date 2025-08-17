from typing import Any, Dict, List, Optional, Type

from loguru import logger
from pydantic import BaseModel, Field, create_model
from src.nodes.handles.basics.inputs import ToolableJsonInputHandle


def create_pydantic_model_from_table_data(
    input_list: List[Dict[str, Any]], model_name: str
) -> Optional[Type[BaseModel]]:
    """
    Creates a Pydantic model dynamically from a list of dictionaries.

    Args:
        input_list: List of dictionaries with 'name' and 'value' keys
        model_name: Name for the generated Pydantic model

    Returns:
        A Pydantic model class with attributes based on the 'name' fields

    Required: Data must be in this form:

    #     data = [
    #         {"name": "first_name", "value": "John"},
    #         {"name": "last_name", "value": "Doe"},
    #         {"name": "email", "value": "john@example.com"},
    #         {"name": "age", "value": "30"},
    #     ]
    """

    if not input_list:
        return None

    # Extract field names from the list
    field_definitions = {}

    for item in input_list:
        field_name = item.get("name")
        if field_name:
            # All fields are str type as requested
            field_definitions[field_name] = (str, ...)

    # Create the Pydantic model dynamically
    model = create_model(model_name, **field_definitions, __base__=BaseModel)

    return model


# Example usage:
# if __name__ == "__main__":
#     # Sample data
#     data = [
#         {"name": "first_name", "value": "John"},
#         {"name": "last_name", "value": "Doe"},
#         {"name": "email", "value": "john@example.com"},
#         {"name": "age", "value": "30"},
#     ]

#     # Create the model
#     UserModel = create_pydantic_model_from_table_data(data, "UserModel")

#     # Test the model
#     user = UserModel(
#         first_name="Alice", last_name="Smith", email="alice@example.com", age="25"
#     )

#     print(f"Created model: {UserModel.__name__}")
#     print(f"Fields: {list(UserModel.model_fields.keys())}")
#     print(f"Instance: {user}")
#     print(f"Instance dict: {user.model_dump()}")

# =============================================================================


def extract_toolable_items(
    items: List[Dict[str, Any]], item_type: str
) -> List[Dict[str, str]]:
    """
    Extract items that have ToolEnable set to True.

    Args:
        items: List of items with name, value, and ToolEnable fields
        item_type: Type description for logging (e.g., "headers", "query parameters")

    Returns:
        List of dictionaries with name and value keys for toolable items
    """
    toolable_items = [
        {"name": item["name"], "value": item["value"]}
        for item in items
        if item.get("ToolEnable", False)
    ]
    logger.info(f"Toolable {item_type}: {toolable_items}")
    return toolable_items


def create_body_schema_from_toolable_json(
    body: Dict[str, Any],
) -> Optional[Type[BaseModel]]:
    """
    Create body schema from toolable JSON configuration.

    Args:
        body: Body configuration dictionary with selected_type and type_values

    Returns:
        Pydantic model class for the body schema or None if not applicable

    Raises:
        ValueError: If body type is not supported for tools
    """

    if not isinstance(body, Dict):
        return None

    body_type = body.get("selected_type", "")
    if body_type and body_type != ToolableJsonInputHandle.__name__:
        raise ValueError(
            f"Only body type '{ToolableJsonInputHandle.__name__}' is supported for tools, "
            f"got '{body_type}'"
        )

    if body_type != ToolableJsonInputHandle.__name__:
        return None

    from src.helpers.JsonFlattener import JSONFlattener

    json_flattener = JSONFlattener(allow_any_type=True)

    # Extract toolable config from body
    type_values = body.get("type_values", {})
    toolable_config = type_values.get(ToolableJsonInputHandle.__name__, {}).get(
        "toolable_config", {}
    )

    if not toolable_config:
        return None

    json_flattener.set_flattened_json(toolable_config)
    body_schema = json_flattener.create_pydantic_model(
        model_name="BodyJsonSchema", only_toolable=True
    )
    logger.info(
        f"Created body schema with {len(body_schema.model_fields) if body_schema else 0} fields"
    )
    return body_schema


def has_valid_schema_fields(schema: Optional[Type[BaseModel]]) -> bool:
    """
    Check if schema exists and has valid fields.

    Args:
        schema: Pydantic model class to check

    Returns:
        True if schema exists and has model_fields, False otherwise
    """
    return schema and hasattr(schema, "model_fields") and schema.model_fields


def build_merged_tool_schema(
    header_schema: Optional[Type[BaseModel]],
    query_schema: Optional[Type[BaseModel]],
    body_schema: Optional[Type[BaseModel]],
    tool_name: str,
) -> Type[BaseModel]:
    """
    Build the final merged schema from individual schemas.

    Args:
        header_schema: Pydantic model for headers
        query_schema: Pydantic model for query parameters
        body_schema: Pydantic model for body
        tool_name: Name for the merged tool schema

    Returns:
        Merged Pydantic model class

    Raises:
        ValueError: If no valid schemas are provided
    """
    schema_fields = {}
    field_descriptions = {
        "headers": "HTTP headers for the request",
        "query_params": "Query parameters for the request URL",
        "body": "JSON body content for the request",
    }

    # Add schemas if they have valid fields
    if has_valid_schema_fields(header_schema):
        schema_fields["headers"] = header_schema

    if has_valid_schema_fields(query_schema):
        schema_fields["query_params"] = query_schema

    if has_valid_schema_fields(body_schema):
        schema_fields["body"] = body_schema

    # Validate that we have at least one toolable field
    if not schema_fields:
        raise ValueError(
            "No toolable fields found. Enable 'ToolEnable' for at least one field "
            "in headers, query parameters, or configure toolable JSON body."
        )

    # Create the merged schema with proper field definitions
    merged_fields = {}
    for field_name, field_schema in schema_fields.items():
        merged_fields[field_name] = (
            field_schema,
            Field(description=field_descriptions[field_name]),
        )

    tool_schema = create_model(
        tool_name,
        **merged_fields,
        __base__=BaseModel,
    )

    logger.info(
        f"Successfully created merged tool schema '{tool_name}' with fields: "
        f"{list(schema_fields.keys())}"
    )

    return tool_schema
