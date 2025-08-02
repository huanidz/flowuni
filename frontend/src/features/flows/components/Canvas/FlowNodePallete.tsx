import React, { useEffect, useState, forwardRef } from 'react';
import { useNodeRegistry } from '@/features/nodes';

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, node_type: string) => void;
}

const NodePalette = forwardRef<HTMLDivElement, NodePaletteProps>(({ onDragStart }, ref) => {
  const [nodeOptions, setNodeOptions] = useState<Array<{ name: string; description: string }>>([]);

  const { nodes, getAllNodes } = useNodeRegistry();

  useEffect(() => {
    const loadPaletteNodes = async () => {
      try {
        const allNodes = getAllNodes();
        const paletteNodes = allNodes.map(node => ({
          name: node.name,
          description: node.description || '',
        }));
        setNodeOptions(paletteNodes);
      } catch (error) {
        console.error('Failed to load nodes for palette:', error);
      }
    };
    loadPaletteNodes();
  }, [nodes]);

  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded border p-4 max-h-[70vh] overflow-y-auto" ref={ref}>
      <h3 className="font-semibold mb-4">Node Library</h3>
      
      <div className="grid grid-cols-2 gap-2 w-80">
        {nodeOptions.map(node => (
          <div
            key={node.name}
            className="p-2 rounded border cursor-move hover:bg-gray-50"
            draggable
            onDragStart={e => onDragStart(e, node.name)}
          >
            <div className="font-medium text-sm mb-1">{node.name}</div>
            {node.description && (
              <div className="text-xs text-gray-600">{node.description}</div>
            )}
          </div>
        ))}
      </div>

      {nodeOptions.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500">Loading nodes...</p>
        </div>
      )}
    </div>
  );
});

export default NodePalette;
