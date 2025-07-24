import { useState, useEffect, useCallback } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';

export const useFlowSelection = (
  initialNodes: Node[],
  initialEdges: Edge[]
) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);

  useEffect(() => {
    setNodes(nds =>
      nds.map(node => ({
        ...node,
        selected: selectedNodeIds.includes(node.id),
      }))
    );
  }, [selectedNodeIds, setNodes]);

  useEffect(() => {
    setEdges(eds =>
      eds.map(edge => ({
        ...edge,
        selected: selectedEdgeIds.includes(edge.id),
      }))
    );
  }, [selectedEdgeIds, setEdges]);

  const onSelectionChange = useCallback(
    ({
      nodes: selectedNodes,
      edges: selectedEdges,
    }: {
      nodes: Node[];
      edges: Edge[];
    }) => {
      setSelectedNodeIds(selectedNodes.map((node: Node) => node.id));
      setSelectedEdgeIds(selectedEdges.map((edge: Edge) => edge.id));
    },
    []
  );

  return {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    selectedNodeIds,
    selectedEdgeIds,
    onSelectionChange,
  };
};
