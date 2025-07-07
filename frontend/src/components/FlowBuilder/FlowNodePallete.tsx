import React, { useEffect, useState } from 'react';
import nodeRegistry from '@/parsers/NodeRegistry';

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const [nodeOptions, setNodeOptions] = useState<Array<{ name: string; description: string; color: string }>>([]);

  useEffect(() => {
    const loadPaletteNodes = async () => {
      try {
        await nodeRegistry.loadCatalog(); // Ensure catalog is loaded
        const allNodes = nodeRegistry.getAllNodes();
        // For now, assign a default color. In a real app, you might have colors in the catalog or derive them.
        const paletteNodes = allNodes.map(node => ({
          name: node.name,
          description: node.description,
          color: '#3b82f6' // Default color, can be customized
        }));
        setNodeOptions(paletteNodes);
      } catch (error) {
        console.error("Failed to load nodes for palette:", error);
      }
    };
    loadPaletteNodes();
  }, []);

  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 border">
      <h3 className="font-semibold mb-3 text-sm">Node Types</h3>
      <div className="space-y-2">
        {nodeOptions.map((node) => (
          <div
            key={node.name}
            className="flex items-center p-2 rounded cursor-move hover:bg-gray-50 border"
            style={{ borderColor: node.color }}
            draggable
            onDragStart={(e) => onDragStart(e, node.name)}
          >
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: node.color }}
            />
            <span className="text-sm">{node.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette;