import json
import logging
from typing import Any, Dict, Type

from json_schema_to_pydantic import create_model as json_schema_to_pydantic
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class PydanticSchemaConverter:
    """Utility class to serialize and load Pydantic models using JSON Schema strings."""

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

            schema_dict: Dict[str, Any] = model_cls.model_json_schema(
                by_alias=False, mode="serialization"
            )
            return json.dumps(schema_dict)
        except Exception as e:
            logger.error(f"Error serializing model {model_cls}: {str(e)}")
            raise ValueError(f"Failed to serialize model {model_cls}: {str(e)}") from e

    @staticmethod
    def load_from_dict(json_schema_dict: Dict[str, Any]) -> Type[BaseModel]:
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
            return json_schema_to_pydantic(json_schema_dict)
        except Exception as e:
            logger.error(f"Error loading model from schema dictionary: {str(e)}")
            raise ValueError(
                f"Failed to load model from schema dictionary: {str(e)}"
            ) from e
