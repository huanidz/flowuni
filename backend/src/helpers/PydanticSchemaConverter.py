import json
import logging
from datetime import date, datetime
from typing import Any, Dict, List, Set, Tuple, Type, Union
from uuid import UUID

from pydantic import BaseModel, create_model

logger = logging.getLogger(__name__)


class PydanticSchemaConverter:
    """Utility class to serialize and load Pydantic models using JSON Schema strings."""

    @staticmethod
    def _jsonschema_to_pytype(field_info: Dict[str, Any]) -> Any:  # noqa
        """
        Convert a JSON Schema field definition to a Python type.

        Args:
            field_info: JSON Schema field definition.

        Returns:
            Corresponding Python type or Pydantic model.
        """
        type_: Union[str, None] = field_info.get("type")
        fmt: Union[str, None] = field_info.get("format")

        # Special formats
        if fmt == "date-time":
            return datetime
        if fmt == "date":
            return date
        if fmt == "uuid":
            return UUID

        # Fallback by JSON Schema type
        if type_ == "string":
            return str
        if type_ == "integer":
            return int
        if type_ == "number":
            return float
        if type_ == "boolean":
            return bool
        if type_ == "array":
            items_schema: Dict[str, Any] = field_info.get("items", {})
            return List[PydanticSchemaConverter._jsonschema_to_pytype(items_schema)]  # type: ignore
        if type_ == "object":
            nested_name: str = field_info.get("title", "NestedModel")
            props: Dict[str, Any] = field_info.get("properties", {})
            required_fields: Set[str] = set(field_info.get("required", []))

            nested_fields: Dict[str, Tuple[Any, Any]] = {}
            for name, sub_info in props.items():
                py_type = PydanticSchemaConverter._jsonschema_to_pytype(sub_info)
                default = ... if name in required_fields else None
                nested_fields[name] = (py_type, default)

            return create_model(nested_name, **nested_fields)

        return Any

    @staticmethod
    def serialize(model_cls: Type[BaseModel]) -> str:
        """
        Serialize a Pydantic model's schema to a JSON string.

        Args:
            model_cls: A Pydantic model class.

        Returns:
            A pretty-printed JSON schema string.

        Raises:
            ValueError: If the model class is invalid or cannot be serialized.
        """
        try:
            if not model_cls:
                raise ValueError("Model class is required")

            schema_dict: Dict[str, Any] = model_cls.model_json_schema()
            return json.dumps(schema_dict)
        except Exception as e:
            logger.error(f"Error serializing model {model_cls}: {str(e)}")
            raise ValueError(f"Failed to serialize model {model_cls}: {str(e)}") from e

    @staticmethod
    def load(schema_str: str, model_name: str = "DynamicModel") -> Type[BaseModel]:
        """
        Load a Pydantic model from a JSON schema string.

        Args:
            schema_str: JSON string containing the schema.
            model_name: Name to use for the dynamically created model.

        Returns:
            A dynamically generated Pydantic model class.

        Raises:
            ValueError: If the schema string is invalid or cannot be parsed.
        """
        try:
            schema: Dict[str, Any] = json.loads(schema_str)

            props: Dict[str, Any] = schema.get("properties", {})
            required_fields: Set[str] = set(schema.get("required", []))

            fields: Dict[str, Tuple[Any, Any]] = {}
            for name, field_info in props.items():
                py_type = PydanticSchemaConverter._jsonschema_to_pytype(field_info)
                default = ... if name in required_fields else None
                fields[name] = (py_type, default)

            return create_model(model_name, **fields)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON schema string: {str(e)}")
            raise ValueError(f"Invalid JSON schema string: {str(e)}") from e
        except Exception as e:
            logger.error(f"Error loading model from schema: {str(e)}")
            raise ValueError(f"Failed to load model from schema: {str(e)}") from e

    @staticmethod
    def get_schema_dict(schema_str: str) -> Dict[str, Any]:
        """
        Parse a JSON schema string and return the dictionary representation.

        Args:
            schema_str: JSON string containing the schema.

        Returns:
            A dictionary representation of the JSON schema.

        Raises:
            ValueError: If the schema string is invalid or cannot be parsed.
        """
        try:
            return json.loads(schema_str)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON schema string: {str(e)}")
            raise ValueError(f"Invalid JSON schema string: {str(e)}") from e
        except Exception as e:
            logger.error(f"Error parsing schema string: {str(e)}")
            raise ValueError(f"Failed to parse schema string: {str(e)}") from e

    @staticmethod
    def load_from_dict(
        schema_dict: Dict[str, Any], model_name: str = "DynamicModel"
    ) -> Type[BaseModel]:
        """
        Load a Pydantic model from a JSON schema dictionary.

        Args:
            schema_dict: Dictionary containing the JSON schema.
            model_name: Name to use for the dynamically created model.

        Returns:
            A dynamically generated Pydantic model class.

        Raises:
            ValueError: If the schema dictionary is invalid or cannot be parsed.
        """
        try:
            if not schema_dict:
                raise ValueError("Schema dictionary is required")

            props: Dict[str, Any] = schema_dict.get("properties", {})
            required_fields: Set[str] = set(schema_dict.get("required", []))

            fields: Dict[str, Tuple[Any, Any]] = {}
            for name, field_info in props.items():
                py_type = PydanticSchemaConverter._jsonschema_to_pytype(field_info)
                default = ... if name in required_fields else None
                fields[name] = (py_type, default)

            return create_model(model_name, **fields)
        except Exception as e:
            logger.error(f"Error loading model from schema dictionary: {str(e)}")
            raise ValueError(
                f"Failed to load model from schema dictionary: {str(e)}"
            ) from e
