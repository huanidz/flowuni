import React from 'react';

const NodePalette = ({ onDragStart }: { onDragStart: (event: React.DragEvent, nodeType: string) => void }) => {
  const nodeOptions = [
    { type: 'start', label: 'Start', color: '#22c55e' },
    { type: 'process', label: 'Process', color: '#3b82f6' },
    { type: 'decision', label: 'Decision', color: '#f59e0b' },
    { type: 'end', label: 'End', color: '#ef4444' },
  ];

  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 border">
      <h3 className="font-semibold mb-3 text-sm">Node Types</h3>
      <div className="space-y-2">
        {nodeOptions.map((node) => (
          <div
            key={node.type}
            className="flex items-center p-2 rounded cursor-move hover:bg-gray-50 border"
            style={{ borderColor: node.color }}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
          >
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: node.color }}
            />
            <span className="text-sm">{node.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette;