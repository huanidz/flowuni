// hooks/useFlowSelection.ts
import { useState, useEffect, useCallback } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';

export const useFlowSelection = (
  initialNodes: Node[] = [],
  initialEdges: Edge[] = []
) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);

  // Update nodes and edges when initial data changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

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

  // Method to reinitialize with new data
  const reinitializeFlow = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
  }, [setNodes, setEdges]);

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
    reinitializeFlow,
  };
};