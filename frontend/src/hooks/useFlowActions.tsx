import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';

export const useFlowActions = (
  nodes: Node[],
  edges: Edge[],
  setNodes: (nodes: Node[]) => void,
  setEdges: (edges: Edge[]) => void,
  setNodeId: (id: number) => void
) => {
  const onRunFlow = useCallback(() => {
    const flowExport = {
      nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
      edges: edges.map(({ id, source, target, sourceHandle, targetHandle }) => ({ 
        id, source, target, sourceHandle, targetHandle 
      })),
    };
    console.log('Flow export payload:', flowExport);
  }, [nodes, edges]);

  const onClearFlow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setNodeId(1);
  }, [setNodes, setEdges, setNodeId]);

  return { onRunFlow, onClearFlow };
};