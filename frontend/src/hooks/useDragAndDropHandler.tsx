import { useCallback } from 'react';
import type { Node, ReactFlowInstance } from '@xyflow/react';
import { Position } from '@xyflow/react';
import nodeRegistry from '@/parsers/NodeRegistry';

export const useDragDropHandler = (
  reactFlowInstance: ReactFlowInstance | null,
  nodeId: number,
  setNodes: (updater: (nodes: Node[]) => Node[]) => void,
  setNodeId: (updater: (id: number) => number) => void,
  nodePaletteRef: React.RefObject<HTMLDivElement | null> // Cập nhật kiểu của nodePaletteRef
) => {
  const onDragStart = useCallback(
    (event: React.DragEvent, node_type: string) => {
      event.dataTransfer.setData('application/reactflow', node_type);
      event.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!reactFlowInstance) return;

      // Kiểm tra xem vị trí thả có nằm trong NodePalette hay không
      if (nodePaletteRef.current) {
        const paletteRect = nodePaletteRef.current.getBoundingClientRect();
        if (
          event.clientX >= paletteRect.left &&
          event.clientX <= paletteRect.right &&
          event.clientY >= paletteRect.top &&
          event.clientY <= paletteRect.bottom
        ) {
          console.log('Drop avoided: Dropped on NodePalette.');
          return; // Không cho phép thả vào NodePalette
        }
      }

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const bounds = (
        event.currentTarget as HTMLDivElement
      ).getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const position = reactFlowInstance.screenToFlowPosition({ x, y });

      const nodeSpec = nodeRegistry.getNode(type);
      if (!nodeSpec) {
        console.error(`Node type "${type}" not found in registry.`);
        return;
      }

      // Initialize parameters with default values
      const initialParameters = Object.fromEntries(
        Object.entries(nodeSpec.parameters).map(([key, paramSpec]) => [
          key,
          (paramSpec as any).default || '',
        ])
      );

      // Initialize input values with default values
      const initialInputValues = Object.fromEntries(
        Object.entries(nodeSpec.inputs).map(([key, value]) => [
          key,
          value || '', // Giả sử giá trị mặc định là chuỗi rỗng nếu không có
        ])
      );

      const customNode: Node = {
        id: `nodeId_${type}_${nodeId}`,
        type,
        position,
        data: {
          label: nodeSpec.name,
          node_type: nodeSpec.name,
          parameters: initialParameters,
          input_values: initialInputValues,
          output_values: {},
        },
        style: { background: '#fff', color: '#000' },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };

      setNodes(nds => [...nds, customNode]);
      setNodeId(id => id + 1);
    },
    [nodeId, reactFlowInstance, setNodes, setNodeId, nodePaletteRef] // Thêm nodePaletteRef vào dependencies
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return { onDragStart, onDrop, onDragOver };
};
