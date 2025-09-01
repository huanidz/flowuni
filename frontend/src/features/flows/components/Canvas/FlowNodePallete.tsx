import React, { useEffect, useState, forwardRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useNodeRegistry } from '@/features/nodes';

interface NodePaletteProps {
    onDragStart: (event: React.DragEvent, node_type: string) => void;
}

const NodePalette = forwardRef<HTMLDivElement, NodePaletteProps>(
    ({ onDragStart }, ref) => {
        const [nodeOptions, setNodeOptions] = useState<
            Array<{ name: string; description: string }>
        >([]);
        const [isCollapsed, setIsCollapsed] = useState(false);

        const { nodes, getAllNodeSpecs } = useNodeRegistry();

        useEffect(() => {
            const loadPaletteNodes = async () => {
                try {
                    const allNodes = getAllNodeSpecs();
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
            <div
                className="absolute top-4 left-4 z-10 bg-white rounded border p-4 max-h-[70vh] overflow-y-auto"
                ref={ref}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Node Library</h3>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        {isCollapsed ? (
                            <ChevronUp size={16} />
                        ) : (
                            <ChevronDown size={16} />
                        )}
                    </button>
                </div>

                <div
                    className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-screen opacity-100'}`}
                >
                    <div className="grid grid-cols-2 gap-2 w-80">
                        {nodeOptions.map(node => (
                            <div
                                key={node.name}
                                className="p-2 rounded border cursor-move hover:bg-gray-50"
                                draggable
                                onDragStart={e => onDragStart(e, node.name)}
                            >
                                <div className="font-medium text-sm mb-1">
                                    {node.name}
                                </div>
                                {node.description && (
                                    <div className="text-xs text-gray-600">
                                        {node.description}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {nodeOptions.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="text-sm text-gray-500">
                                Loading nodes...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }
);

export default NodePalette;
