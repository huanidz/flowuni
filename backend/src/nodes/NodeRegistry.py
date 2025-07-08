# src/parsers/NodeRegistry.py

import importlib
import pkgutil
from typing import Dict, Type, Optional
from src.nodes.NodeBase import Node, NodeSpec
import src.nodes.primitives as primitives_pkg

class NodeRegistry:
    def __init__(self):
        self._node_classes: Dict[str, Type[Node]] = {}
        self._load_nodes_from_package(primitives_pkg)

    def _load_nodes_from_package(self, package):
        for _, module_name, _ in pkgutil.iter_modules(package.__path__):
            module = importlib.import_module(f"{package.__name__}.{module_name}")

            # Register all Node subclasses in the module
            for attr_name in dir(module):
                attr = getattr(module, attr_name)
                if (
                    isinstance(attr, type)
                    and issubclass(attr, Node)
                    and attr is not Node
                ):
                    self.register(attr)

    def register(self, node_cls: Type[Node]):
        spec: NodeSpec = node_cls.spec
        if spec.name in self._node_classes:
            raise ValueError(f"Duplicate node name: {spec.name}")
        self._node_classes[spec.name] = node_cls

    def get_node(self, name: str) -> Optional[NodeSpec]:
        cls = self._node_classes.get(name)
        return cls.spec if cls else None

    def create_node_class(self, name: str) -> Optional[Type[Node]]:
        return self._node_classes.get(name)

    def create_node_instance(self, name: str) -> Optional[Node]:
        cls = self._node_classes.get(name)
        return cls() if cls else None

    def get_all_nodes(self) -> Dict[str, NodeSpec]:
        return {name: cls.spec for name, cls in self._node_classes.items()}


# Instantiate a shared global instance
nodeRegistry = NodeRegistry()