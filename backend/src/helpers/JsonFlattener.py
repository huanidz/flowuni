import json
import uuid
from typing import Any, Dict, List, Optional, Type, Union

from loguru import logger
from pydantic import BaseModel, Field, create_model


class JSONFlattener:
    """
    A class to flatten nested JSON objects and create hierarchical Pydantic models
    based on the toolable configuration.
    """

    TYPE_MAPPING = {
        "string": str,
        "number": float,  # Always use float for numbers
        "boolean": bool,
        "null": type(None),
        "array": List[Any],
    }

    def __init__(self, allow_any_type: bool = True):
        self.flattened_data = {}
        self.allow_any_type = allow_any_type
        self.created_models = {}  # Cache for created models
        self.model_registry = {}  # Registry to track model names and prevent duplicates
        self.original_data = None  # Store original data for advanced null handling

    def _get_python_type(self, value: Any) -> str:
        """
        Determine the Python type string based on the value.

        Args:
            value: The value to determine type for

        Returns:
            String representation of the type
        """
        if value is None:
            return "null"
        elif isinstance(value, bool):
            return "boolean"
        elif isinstance(value, (int, float)):
            return "number"
        elif isinstance(value, str):
            return "string"
        elif isinstance(value, list):
            return "array"
        elif isinstance(value, dict):
            return "object"
        else:
            logger.warning(f"Unknown type for value: {value}, defaulting to 'string'")
            return "string"

    def _flatten_object(
        self, obj: Dict[str, Any], parent_key: str = "", separator: str = "."
    ) -> Dict[str, Dict[str, Any]]:
        """
        Recursively flatten a nested dictionary.

        Args:
            obj: Dictionary to flatten
            parent_key: Parent key prefix
            separator: Key separator (default: '.')

        Returns:
            Flattened dictionary with metadata
        """
        try:
            items = []

            for key, value in obj.items():
                new_key = f"{parent_key}{separator}{key}" if parent_key else key

                if isinstance(value, dict) and value:
                    # Recursively flatten nested objects
                    items.extend(
                        self._flatten_object(value, new_key, separator).items()
                    )
                elif isinstance(value, list) and value:
                    # Handle arrays
                    self._process_array(value, new_key, items)
                else:
                    # Handle primitive values
                    items.append(
                        (
                            new_key,
                            {
                                "toolable": False,  # Default = False as per requirement
                                "defaultValue": value,
                                "type": self._get_python_type(value),
                            },
                        )
                    )

            return dict(items)

        except Exception as e:
            logger.error(f"Error flattening object: {e}")
            raise ValueError(f"Failed to flatten object: {e}")

    def _process_array(self, array: List[Any], key: str, items: List[tuple]) -> None:
        """
        Process array values and add them to the items list.

        Args:
            array: List to process
            key: Key for the array
            items: List to append processed items to
        """
        try:
            if not array:
                items.append(
                    (key, {"toolable": False, "defaultValue": [], "type": "array"})
                )
                return

            # Check if array contains objects
            if isinstance(array[0], dict):
                # For object arrays, use [*] and analyze all objects for null handling
                all_fields = {}

                # Collect all possible fields from all objects in array
                for obj in array:
                    if isinstance(obj, dict):
                        for obj_key, obj_value in obj.items():
                            field_key = f"{key}[*].{obj_key}"
                            if field_key not in all_fields:
                                all_fields[field_key] = []
                            all_fields[field_key].append(obj_value)

                # For each field, determine the best type based on non-null values
                for field_key, values in all_fields.items():
                    best_value = self._resolve_array_field_type(values)
                    items.append(
                        (
                            field_key,
                            {
                                "toolable": False,
                                "defaultValue": best_value,
                                "type": self._get_python_type(best_value),
                            },
                        )
                    )
            else:
                # For primitive arrays, store the entire array
                items.append(
                    (key, {"toolable": False, "defaultValue": array, "type": "array"})
                )

        except Exception as e:
            logger.error(f"Error processing array for key {key}: {e}")
            raise ValueError(f"Failed to process array: {e}")

    def _resolve_array_field_type(self, values: List[Any]) -> Any:
        """
        Resolve the type of a field that appears in an array of objects.
        Uses the first non-null value, or handles null case based on allow_any_type.

        Args:
            values: List of values for this field across array objects

        Returns:
            Representative value for type inference
        """
        non_null_values = [v for v in values if v is not None]

        if non_null_values:
            # Use first non-null value
            return non_null_values[0]
        else:
            # All values are null
            if self.allow_any_type:
                return None  # Will be handled as Any type later
            else:
                raise ValueError(
                    "Ambiguous null field and allow_any_type is False, can't build the model"  # noqa
                )

    def flatten_json(
        self, json_data: Union[str, Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Flatten JSON data into the required format.

        Args:
            json_data: JSON string or dictionary to flatten

        Returns:
            Flattened dictionary with metadata
        """
        try:
            if isinstance(json_data, str):
                data = json.loads(json_data)
            else:
                data = json_data.copy()

            if not isinstance(data, dict):
                raise ValueError("Input must be a JSON object (dictionary)")

            # Store original data for advanced null handling
            self.original_data = data
            self.flattened_data = self._flatten_object(data)
            return self.flattened_data

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON format: {e}")
            raise ValueError(f"Invalid JSON format: {e}")
        except Exception as e:
            logger.error(f"Error flattening JSON: {e}")
            raise

    def update_toolable_flags(self, toolable_config: Dict[str, bool]) -> None:
        """
        Update the toolable flags for specific keys.

        Args:
            toolable_config: Dictionary mapping field keys to toolable boolean values
        """
        try:
            for key, is_toolable in toolable_config.items():
                if key in self.flattened_data:
                    self.flattened_data[key]["toolable"] = is_toolable
                else:
                    logger.warning(f"Key '{key}' not found in flattened data")

        except Exception as e:
            logger.error(f"Error updating toolable flags: {e}")
            raise

    def _build_hierarchy_tree(
        self, toolable_fields: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Build a hierarchical tree structure from flat field paths.

        Args:
            toolable_fields: Fields marked as toolable

        Returns:
            Nested dictionary representing the hierarchy
        """
        hierarchy = {}

        for field_path, field_info in toolable_fields.items():
            parts = field_path.split(".")
            current = hierarchy

            # Navigate/create the path
            for i, part in enumerate(parts):
                is_array = "[*]" in part
                clean_part = part.replace("[*]", "")

                if i == len(parts) - 1:
                    # Last part - this is the actual field
                    if is_array:
                        # This shouldn't happen for leaf fields in your use case
                        current[clean_part] = {
                            "_field_info": field_info,
                            "_is_array": True,
                            "_is_leaf": True,
                        }
                    else:
                        current[clean_part] = {
                            "_field_info": field_info,
                            "_is_leaf": True,
                        }
                else:
                    # Intermediate part - create nested structure
                    if clean_part not in current:
                        current[clean_part] = {"_is_leaf": False, "_is_array": is_array}
                    elif is_array:
                        current[clean_part]["_is_array"] = True

                    current = current[clean_part]

        return hierarchy

    def _create_model_from_hierarchy(
        self, name: str, hierarchy: Dict[str, Any], is_array_item: bool = False
    ) -> Type[BaseModel]:
        """
        Create a Pydantic model from a hierarchy node.

        Args:
            name: Base name for the model
            hierarchy: Hierarchy dictionary for this level
            is_array_item: Whether this model represents an array item

        Returns:
            Pydantic model class
        """
        model_name = self._generate_clean_model_name(name, is_array_item)

        # Check if we already created this model
        if model_name in self.created_models:
            return self.created_models[model_name]

        model_fields = {}

        for field_name, field_data in hierarchy.items():
            if field_name.startswith("_"):
                continue  # Skip metadata

            safe_field_name = self._make_safe_field_name(field_name)

            if field_data.get("_is_leaf", False):
                # This is a leaf field - create a simple field
                field_info = field_data["_field_info"]
                field_type = self._get_field_type(field_info)
                default_value = field_info.get("defaultValue")

                if default_value is not None:
                    model_fields[safe_field_name] = (
                        field_type,
                        Field(default=default_value),
                    )
                else:
                    if field_info.get("type") == "null":
                        if self.allow_any_type:
                            model_fields[safe_field_name] = (
                                Optional[Any],
                                Field(default=None),
                            )
                        else:
                            raise ValueError(
                                f"Ambiguous null field '{field_name}' and allow_any_type is False"
                            )
                    else:
                        model_fields[safe_field_name] = (
                            Optional[field_type],
                            Field(default=None),
                        )
            else:
                # This is a nested object - create a nested model
                nested_model = self._create_model_from_hierarchy(
                    field_name, field_data, field_data.get("_is_array", False)
                )

                if field_data.get("_is_array", False):
                    model_fields[safe_field_name] = (
                        List[nested_model],
                        Field(default_factory=list),
                    )
                else:
                    model_fields[safe_field_name] = (
                        Optional[nested_model],
                        Field(default=None),
                    )

        if not model_fields:
            model_fields["__empty__"] = (Optional[str], Field(default=None))

        # Create the model
        model = create_model(model_name, **model_fields)
        self.created_models[model_name] = model

        logger.info(
            f"Created model '{model_name}' with fields: {list(model_fields.keys())}"
        )
        return model

    def _generate_clean_model_name(
        self, base_name: str, is_array_item: bool = False
    ) -> str:
        """
        Generate a clean model name without UUID suffix.

        Args:
            base_name: Base name for the model
            is_array_item: Whether this is an array item model

        Returns:
            Clean model name
        """
        clean_name = "".join(word.capitalize() for word in base_name.split("_"))
        if not clean_name:
            clean_name = "Model"

        # Don't add "Item" suffix for array items in this case
        # as we want clean names like "Manager", "Department", "Company"
        return clean_name

    def create_pydantic_model(
        self, model_name: str = "DynamicModel", only_toolable: bool = True
    ) -> Type[BaseModel]:
        """
        Create a hierarchical Pydantic model from the flattened data.

        Args:
            model_name: Name for the generated model
            only_toolable: If True, only include fields where toolable=True

        Returns:
            Pydantic model class with nested structure
        """
        try:
            if not self.flattened_data:
                raise ValueError(
                    "No flattened data available. Call flatten_json() first."
                )

            # Filter toolable fields
            if only_toolable:
                toolable_fields = {
                    k: v
                    for k, v in self.flattened_data.items()
                    if v.get("toolable", False)
                }
            else:
                toolable_fields = self.flattened_data.copy()

            if not toolable_fields:
                logger.warning("No toolable fields found. Creating empty model.")
                return create_model(
                    f"{model_name}_{uuid.uuid4().hex[:8]}",
                    __empty__=(Optional[str], Field(default=None)),
                )

            # Build hierarchy tree
            hierarchy = self._build_hierarchy_tree(toolable_fields)

            # Create the root model from hierarchy
            root_model = self._create_model_from_hierarchy(model_name, hierarchy)

            logger.info(
                f"Successfully created hierarchical Pydantic model '{root_model.__name__}'"
            )
            return root_model

        except Exception as e:
            logger.error(f"Error creating Pydantic model: {e}")
            raise

    def _make_safe_field_name(self, field_name: str) -> str:
        """
        Convert field name to a valid Python identifier.

        Args:
            field_name: Original field name

        Returns:
            Safe field name for Python
        """
        # For simple field names, just return as is if valid
        if field_name.replace("_", "").replace("[*]", "").replace(".", "").isalnum():
            safe_name = field_name.replace(".", "_").replace("[*]", "_all")

            # Remove consecutive underscores
            while "__" in safe_name:
                safe_name = safe_name.replace("__", "_")

            # Remove leading/trailing underscores
            safe_name = safe_name.strip("_")

            # Ensure it doesn't start with a number
            if safe_name and safe_name[0].isdigit():
                safe_name = f"field_{safe_name}"

            return safe_name if safe_name else "field"

        # Fallback for complex names
        safe_name = "".join(c if c.isalnum() else "_" for c in field_name)
        while "__" in safe_name:
            safe_name = safe_name.replace("__", "_")
        safe_name = safe_name.strip("_")

        if safe_name and safe_name[0].isdigit():
            safe_name = f"field_{safe_name}"

        return safe_name if safe_name else "field"

    def _get_field_type(self, field_info: Dict[str, Any]) -> Type:
        """
        Get the appropriate Python type for a field.

        Args:
            field_info: Field information dictionary

        Returns:
            Python type
        """
        type_str = field_info.get("type", "string")
        default_value = field_info.get("defaultValue")

        if type_str == "null":
            if default_value is None:
                if self.allow_any_type:
                    return Any
                else:
                    raise ValueError(
                        "Null field encountered and allow_any_type is False"
                    )
            else:
                # Infer type from non-null default value
                return type(default_value)
        elif type_str == "array":
            # For arrays, we need to infer the element type
            if isinstance(default_value, list) and default_value:
                element_type = type(default_value[0])
                return List[element_type]
            else:
                return List[Any] if self.allow_any_type else List[str]
        elif type_str in self.TYPE_MAPPING:
            base_type = self.TYPE_MAPPING[type_str]
            if isinstance(base_type, type(None)):
                return Any if self.allow_any_type else str
            return base_type
        else:
            logger.warning(f"Unknown type '{type_str}', defaulting to str")
            return str

    def get_flattened_json(self) -> str:
        """
        Get the flattened data as a formatted JSON string.

        Returns:
            JSON string of flattened data
        """
        try:
            return json.dumps(self.flattened_data, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error converting to JSON: {e}")
            raise

    def set_flattened_json(self, json_dict: dict) -> None:
        """
        Set the flattened data from a JSON string.

        Args:
            json_data: JSON dict
        """
        try:
            self.flattened_data = json_dict
        except Exception as e:
            logger.error(f"Error parsing JSON: {e}")
            raise

    def get_created_models(self) -> Dict[str, Type[BaseModel]]:
        """
        Get all created models.

        Returns:
            Dictionary of model names to model classes
        """
        return self.created_models.copy()


# def main():
#     """
#     Example usage of the JSONFlattener class.
#     """
#     # Sample input data
#     sample_data = {
#         "user": {
#             "id": 12345,
#             "name": "Arjun Patel",
#             "isActive": True,
#             "profile": {
#                 "age": 29,
#                 "height": 1.82,
#                 "preferences": {
#                     "notifications": False,
#                     "languages": ["English", "Hindi", "Spanish"],
#                     "theme": "dark",
#                     "dailyLimit": None,
#                 },
#             },
#             "accounts": [
#                 {"type": "checking", "balance": 1050.75, "currency": "USD"},
#                 {"type": "savings", "balance": 5000, "currency": "USD"},
#             ],
#             "lastLogin": "2025-08-15T14:30:00Z",
#         }
#     }

#     try:
#         # Create flattener instance
#         flattener = JSONFlattener(allow_any_type=True)

#         # Flatten the JSON
#         flattened = flattener.flatten_json(sample_data)
#         print("Flattened JSON:")
#         print(flattener.get_flattened_json())

#         # Update some fields to be toolable
#         toolable_config = {
#             "user.name": True,
#             "user.profile.age": True,
#             "user.profile.preferences.theme": True,
#             "user.accounts[*].balance": True,
#             "user.accounts[*].type": True,
#         }

#         flattener.update_toolable_flags(toolable_config)

#         # Create Pydantic model with only toolable fields
#         ToolableModel = flattener.create_pydantic_model(
#             "ToolableUserModel", only_toolable=True
#         )

#         print(f"\nCreated Pydantic model: {ToolableModel}")
#         print(f"Model fields: {list(ToolableModel.__annotations__.keys())}")

#         # Show created nested models
#         print(f"\nAll created models: {list(flattener.get_created_models().keys())}")

#         # Create an instance of the model
#         instance = ToolableModel()
#         print(f"Model instance: {instance}")

#     except Exception as e:
#         logger.error(f"Error in main execution: {e}")
