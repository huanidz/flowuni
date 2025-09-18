from typing import Any, Dict, Iterator, List, Optional, Tuple

import networkx as nx


class MultiDiGraphUtils:
    @staticmethod
    def get_edge_data_dict(
        graph: nx.MultiDiGraph, u: Any, v: Any
    ) -> Dict[Any, Dict[str, Any]]:
        """
        Get all edge data between nodes u and v.

        Args:
            graph: The MultiDiGraph
            u: Source node
            v: Target node

        Returns:
            Dictionary mapping edge keys to edge data dictionaries
        """
        return graph.get_edge_data(u, v) or {}

    @staticmethod
    def get_first_edge_data(
        graph: nx.MultiDiGraph, u: Any, v: Any
    ) -> Optional[Dict[str, Any]]:
        """
        Get the data of the first edge between nodes u and v.

        Args:
            graph: The MultiDiGraph
            u: Source node
            v: Target node

        Returns:
            Edge data dictionary or None if no edge exists
        """
        edge_data_dict = MultiDiGraphUtils.get_edge_data_dict(graph, u, v)
        if edge_data_dict:
            return next(iter(edge_data_dict.values()))
        return None

    @staticmethod
    def get_edge_data_by_key(
        graph: nx.MultiDiGraph, u: Any, v: Any, key: Any
    ) -> Optional[Dict[str, Any]]:
        """
        Get edge data by key between nodes u and v.

        Args:
            graph: The MultiDiGraph
            u: Source node
            v: Target node
            key: Edge key

        Returns:
            Edge data dictionary or None if no edge exists with the given key
        """
        edge_data_dict = MultiDiGraphUtils.get_edge_data_dict(graph, u, v)
        return edge_data_dict.get(key) if edge_data_dict else None

    @staticmethod
    def get_edges_with_data(
        graph: nx.MultiDiGraph, u: Any, v: Any
    ) -> List[Tuple[Any, Dict[str, Any]]]:
        """
        Get all edges with their data between nodes u and v.

        Args:
            graph: The MultiDiGraph
            u: Source node
            v: Target node

        Returns:
            List of tuples (edge_key, edge_data)
        """
        edge_data_dict = MultiDiGraphUtils.get_edge_data_dict(graph, u, v)
        return list(edge_data_dict.items()) if edge_data_dict else []

    @staticmethod
    def iterate_edges_with_data(
        graph: nx.MultiDiGraph, nbunch=None, data=False, keys=True, default=None
    ) -> Iterator:
        """
        Iterate over edges with data, handling both DiGraph and MultiDiGraph.

        Args:
            graph: The graph (DiGraph or MultiDiGraph)
            nbunch: Container of nodes to iterate over
            data: If True, include edge data
            keys: If True, include edge keys (for MultiDiGraph)
            default: Value to use for edges without data

        Returns:
            Iterator over edges
        """
        if isinstance(graph, nx.MultiDiGraph):
            return graph.edges(nbunch=nbunch, data=data, keys=keys, default=default)
        else:
            return graph.edges(nbunch=nbunch, data=data, default=default)
