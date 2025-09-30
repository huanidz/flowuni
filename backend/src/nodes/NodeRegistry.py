import importlib
import pkgutil
from typing import Dict, Optional, Type

import src.nodes.categories as categories_pkg
from loguru import logger
from src.nodes.NodeBase import Node, NodeSpec


class NodeRegistry:
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self._node_classes: Dict[str, Type[Node]] = {}
        self._load_categories_recursively(categories_pkg)

    def _load_categories_recursively(self, package):
        """Load nodes from all category subdirectories."""
        for finder, name, ispkg in pkgutil.walk_packages(
            package.__path__, package.__name__ + "."
        ):
            try:
                module = importlib.import_module(name)
            except Exception as e:
                if self.verbose:
                    logger.debug(f"Failed to import module {name}: {e}")
                continue

            for attr_name in dir(module):
                attr = getattr(module, attr_name)
                if (
                    isinstance(attr, type)
                    and issubclass(attr, Node)
                    and attr is not Node
                ):
                    try:
                        self.register(attr)
                    except ValueError as e:
                        if self.verbose:
                            logger.debug(f"Skipping duplicate or invalid node: {e}")

    def register(self, node_cls: Type[Node]):
        spec: NodeSpec = node_cls.spec
        if spec.name in self._node_classes:
            raise ValueError(f"Duplicate node name: {spec.name}")
        self._node_classes[spec.name] = node_cls

    def get_node_spec_by_name(self, name: str) -> Optional[NodeSpec]:
        cls = self._node_classes.get(name)
        return cls.spec if cls else None

    def get_node_class_by_name(self, name: str) -> Optional[Type[Node]]:
        return self._node_classes.get(name)

    def create_node_class(self, name: str) -> Optional[Type[Node]]:
        return self._node_classes.get(name)

    def create_node_instance(self, name: str) -> Optional[Node]:
        cls = self._node_classes.get(name)
        return cls() if cls else None

    def get_all_nodes(self) -> Dict[str, NodeSpec]:
        return {name: cls.spec for name, cls in self._node_classes.items()}
