import { useCallback } from 'react';
import type { Node, ReactFlowInstance } from '@xyflow/react';
import { Position } from '@xyflow/react';
import nodeRegistry from '@/parsers/NodeRegistry';

export const useDragDropHandler = (
  reactFlowInstance: ReactFlowInstance | null,
  nodeId: number,
  setNodes: (updater: (nodes: Node[]) => Node[]) => void,
  setNodeId: (updater: (id: number) => number) => void
) => {
  const onDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const bounds = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const position = reactFlowInstance.screenToFlowPosition({ x, y });

      const nodeSpec = nodeRegistry.getNode(type);
      if (!nodeSpec) {
        console.error(`Node type "${type}" not found in registry.`);
        return;
      }

      const customNode: Node = {
        id: `nodeId_${type}_${nodeId}`,
        type,
        position,
        data: {
          label: nodeSpec.name,
          nodeType: nodeSpec.name,
          parameters: Object.fromEntries(
            Object.entries(nodeSpec.parameters).map(([key, paramSpec]) => [
              key, 
              (paramSpec as any).default
            ])
          )
        },
        style: { background: '#fff', color: '#000' },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };

      console.log('Dropped node:', customNode);
      setNodes((nds) => [...nds, customNode]);
      setNodeId((id) => id + 1);
    },
    [nodeId, reactFlowInstance, setNodes, setNodeId]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return { onDragStart, onDrop, onDragOver };
};