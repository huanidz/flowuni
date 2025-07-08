from src.nodes import __all__
from src.nodes.NodeBase import Node
from loguru import logger
import traceback

import json

def generate_node_catalog():
    """Generate node catalog in memory without writing to file"""
    logger.info("Start generating node catalog...")
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

    logger.success(f"Generated catalog with {len(catalog)} nodes")
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