import React, { useEffect, useState, forwardRef } from 'react'; // Import forwardRef
import { useNodeRegistry } from '@/features/nodes';


interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, node_type: string) => void;
}

const NodePalette = forwardRef<HTMLDivElement, NodePaletteProps>(
  ({ onDragStart }, ref) => {
    // Sử dụng forwardRef
    const [nodeOptions, setNodeOptions] = useState<
      Array<{ name: string; description: string; color: string }>
    >([]);

    const { nodes, getAllNodes } = useNodeRegistry();

    useEffect(() => {
      const loadPaletteNodes = async () => {
        try {
          const allNodes = getAllNodes();
          console.log(allNodes);
          const paletteNodes = allNodes.map(node => ({
            name: node.name,
            description: node.description || '',
            color: '#3b82f6', // Default color, can be customized
          }));
          setNodeOptions(paletteNodes);
        } catch (error) {
          console.error('Failed to load nodes for palette:', error);
        }
      };
      loadPaletteNodes();
    }, [nodes]);

    return (
      <div
        className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 p-5 max-h-[70vh] overflow-y-auto"
        ref={ref} // Gán ref cho div ngoài cùng
      >
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800 text-lg">Node Library</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 w-80">
          {nodeOptions.map(node => (
            <div
              key={node.name}
              className="group relative flex flex-col p-3 rounded-lg cursor-move hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-white"
              draggable
              onDragStart={e => onDragStart(e, node.name)}
            >
              {/* Drag indicator */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </div>

              {/* Node icon and indicator */}
              <div className="flex items-center mb-2">
                <div
                  className="w-4 h-4 rounded-full mr-2 shadow-sm ring-2 ring-white"
                  style={{ backgroundColor: node.color }}
                />
                <div className="w-2 h-2 bg-gray-300 rounded-full opacity-50" />
              </div>

              {/* Node name */}
              <div className="font-medium text-sm text-gray-800 mb-1 leading-tight">
                {node.name}
              </div>

              {/* Node description */}
              {node.description && (
                <div className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {node.description}
                </div>
              )}

              {/* Hover effect overlay */}
              <div
                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-200"
                style={{ backgroundColor: node.color }}
              />
            </div>
          ))}
        </div>

        {nodeOptions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Loading nodes...</p>
          </div>
        )}
      </div>
    );
  }
);

export default NodePalette;
