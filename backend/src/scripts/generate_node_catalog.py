from src.nodes import __all__
from src.nodes.NodeBase import Node
from loguru import logger
import traceback
from typing import Type, Any
from pydantic import BaseModel

import json

def _serialize_type(t: Type) -> Any:
    """
    Serialize a type for JSON output.
    If it's a Pydantic model, embed its JSON schema.
    Otherwise return the class name.
    """
    # If it's a Pydantic model, embed its JSON schema:
    if isinstance(t, type) and issubclass(t, BaseModel):
        return {
            "type": t.__name__,
            "schema": t.model_json_schema()
        }
    # Otherwise just return the class name:
    return getattr(t, "__name__", str(t))

def generate_node_catalog():
    """Generate node catalog in memory without writing to file"""
    logger.debug("Start generating node catalog...")
    catalog = []

    for _class in __all__:
        try:
            # Init an instance then call get_spec_json()
            instance: Node = _class()
            spec = instance.get_spec_json()
            catalog.append(spec)
            logger.debug(f"Added spec for {_class.__name__}")
        except Exception as e:
            logger.error(f"Error processing class {_class.__name__}: {e}. {traceback.format_exc()}")

    logger.debug(f"Generated catalog with {len(catalog)} nodes")
    return catalog

def generate_node_catalog_json(output_path: str):
    """Write catalog to JSON file (for non-API use cases)"""
    try:
        catalog = generate_node_catalog()
        with open(output_path, 'w') as f:
            json.dump(catalog, f, indent=4)
        logger.success(f"Node catalog successfully generated at {output_path}")
    except IOError as e:
        logger.error(f"Error writing node catalog to {output_path}: {e}")
        raise


# Updated Node class get_spec_json method to handle new structure
class NodeMixin:
    """Mixin to add updated get_spec_json method for the new NodeSpec structure"""
    
    def get_spec_json(self) -> dict[str, Any]:
        """
        Return a JSON‑serializable dict describing:
         - name, description
         - inputs  (list of NodeInput objects)
         - outputs (list of NodeOutput objects)
         - parameters (param → {type name, default, description})
        """
        raw = self.spec.model_dump()  # gives you a dict with raw types still in it
        
        # Serialize inputs (now a list of NodeInput objects)
        serialized_inputs = []
        for input_spec in self.spec.inputs:
            serialized_inputs.append({
                "name": input_spec.name,
                "type": _serialize_type(input_spec.type),
                "default": input_spec.default,
                "description": input_spec.description,
                "required": input_spec.required
            })
        raw["inputs"] = serialized_inputs

        # Serialize outputs (now a list of NodeOutput objects)
        serialized_outputs = []
        for output_spec in self.spec.outputs:
            serialized_outputs.append({
                "name": output_spec.name,
                "type": _serialize_type(output_spec.type),
                "default": output_spec.default,
                "description": output_spec.description
            })
        raw["outputs"] = serialized_outputs

        # Rebuild parameters into a JSON‑safe form (unchanged from before)
        params = {}
        for name, p in self.spec.parameters.items():
            params[name] = {
                "name": p.name,
                "type": _serialize_type(p.type),
                "default": p.default,
                "description": p.description,
            }
        raw["parameters"] = params

        return raw

    def get_spec_json_str(self) -> str:
        """Pretty‑print the above dict as JSON."""
        return json.dumps(self.get_spec_json(), indent=2)