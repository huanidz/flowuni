from src.nodes.NodeRegistry import NodeRegistry
from src.services.NodeService import NodeService


def get_node_service():
    return NodeService()


def get_node_registry():
    return NodeRegistry()
