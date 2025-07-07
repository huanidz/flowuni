from src.nodes import __all__
from src.nodes.NodeBase import Node
from loguru import logger
import json

import traceback

def generate_node_catalog_json(output_path: str):
    logger.info("Start generating node catalog...")
    catalog = []

    for _class in __all__:
        try:
            # Init an instance then call get_spec_json()
            instance: Node = _class()
            spec = instance.get_spec_json()
            catalog.append(spec)
            logger.debug(f"Added spec for {_class}")
        except Exception as e:
            logger.error(f"Error processing class {_class}: {e}. {traceback.format_exc()}")

    try:
        logger.info(f"Catalog: {catalog}")
        with open(output_path, 'w') as f:
            json.dump(catalog, f, indent=4)
        logger.success(f"Node catalog successfully generated at {output_path}")
    except IOError as e:
        logger.error(f"Error writing node catalog to {output_path}: {e}")