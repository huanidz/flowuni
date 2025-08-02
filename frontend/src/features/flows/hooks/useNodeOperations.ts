import { useCallback } from 'react';
import type { Node, Edge, Connection } from '@xyflow/react';
import { addEdge } from '@xyflow/react';

/**
 * Custom hook for managing node operations in the FlowBuilder component
 * 
 * This hook consolidates the node manipulation logic that was previously
 * spread across the component. It handles:
 * - Node data and parameter updates
 * - Connection logic between nodes
 * - Node creation and deletion
 */
export const useNodeOperations = (
  nodes: Node[],
  edges: Edge[],
  setNodes: (updater: (nodes: Node[]) => Node[]) => void,
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void,
  selectedNodeIds: string[],
  selectedEdgeIds: string[]
) => {
  // Enhanced node data update function for list-based parameters and inputs
  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      // TODO: Implement
    },
    [setNodes]
  );

  // Enhanced node parameter update function
  // Not doing anything now.
  const updateNodeParameter = useCallback(
    () => {},
    []
  );

  // Handle connections between nodes
  const onConnect = useCallback((connection: Connection) => {
      const { source, target } = connection;

      if (!source || !target) return;

      // Check if target already has an incoming edge
      const hasIncomingEdge = edges.some((edge) => edge.target === target);

      if (hasIncomingEdge) {
        return; // Prevent connection
      }

      // If no incoming edge, allow connection
      setEdges((eds) => addEdge(connection, eds));
    },
    [edges, setEdges]
  );

  // Delete selected elements
  const onDeleteSelectedElements = useCallback(() => {
    // Filter out selected nodes
    const remainingNodes = nodes.filter(node => !selectedNodeIds.includes(node.id));
    
    // Filter out edges that are either:
    // 1. Explicitly selected (selectedEdgeIds)
    // 2. Connected to any deleted node (source or target is in selectedNodeIds)
    const remainingEdges = edges.filter(edge => 
      !selectedEdgeIds.includes(edge.id) && 
      !selectedNodeIds.includes(edge.source) && 
      !selectedNodeIds.includes(edge.target)
    );
    
    setNodes(() => remainingNodes);
    setEdges(() => remainingEdges);
  }, [nodes, edges, selectedNodeIds, selectedEdgeIds, setNodes, setEdges]);

  // Handle keyboard shortcuts
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'Delete':
          onDeleteSelectedElements();
          break;
        default:
          break;
      }
    },
    [onDeleteSelectedElements]
  );

  return {
    updateNodeData,
    updateNodeParameter,
    onConnect,
    onDeleteSelectedElements,
    onKeyDown
  };
};