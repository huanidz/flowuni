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
export const useFlowUtilOperations = (
  nodes: Node[],
  edges: Edge[],
  setNodes: (updater: (nodes: Node[]) => Node[]) => void,
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void,
  selectedNodeIds: string[],
  selectedEdgeIds: string[]
) => {

  // Handle connections between nodes
  const onConnect = useCallback((connection: Connection) => {
      const { source, target, targetHandle } = connection;

      if (!source || !target) return;

      // Check if the specific target handle already has an incoming edge
      const hasIncomingEdgeOnHandle = edges.some((edge) => 
        edge.target === target && edge.targetHandle === targetHandle
      );

      if (hasIncomingEdgeOnHandle) {
        return; // Prevent connection - this specific handle already has an edge
      }

      // If the specific handle has no incoming edge, allow connection
      setEdges((eds) => addEdge(connection, eds));
    },
    [edges, setEdges]
  );

  // Handle keyboard shortcuts
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'Delete':
          break;
        default:
          break;
      }
    },
    []
  );

  return {
    onConnect,
    onKeyDown
  };
};