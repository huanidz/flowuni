import React, { useEffect, useState, forwardRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useNodeRegistry } from '@/features/nodes';

interface NodePaletteProps {
    onDragStart: (event: React.DragEvent, node_type: string) => void;
}

interface NodePalleteSchema {
    name: string;
    description: string;
    group: string;
}

const NodePalette = forwardRef<HTMLDivElement, NodePaletteProps>(
    ({ onDragStart }, ref) => {
        const [nodeGroups, setNodeGroups] = useState<
            Record<string, NodePalleteSchema[]>
        >({});
        const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
            new Set()
        );

        const { nodes, getAllNodeSpecs } = useNodeRegistry();

        useEffect(() => {
            const loadPaletteNodes = async () => {
                try {
                    const allNodes = getAllNodeSpecs();
                    const groupedNodes: Record<string, NodePalleteSchema[]> =
                        {};

                    allNodes.forEach(node => {
                        const group = node.group || 'Ungrouped';
                        if (!groupedNodes[group]) {
                            groupedNodes[group] = [];
                        }
                        groupedNodes[group].push({
                            name: node.name,
                            description: node.description || '',
                            group: group,
                        });
                    });

                    setNodeGroups(groupedNodes);
                } catch (error) {
                    console.error('Failed to load nodes for palette:', error);
                }
            };
            loadPaletteNodes();
        }, [nodes]);

        const toggleGroupCollapse = (groupName: string) => {
            setCollapsedGroups(prev => {
                const newSet = new Set(prev);
                if (newSet.has(groupName)) {
                    newSet.delete(groupName);
                } else {
                    newSet.add(groupName);
                }
                return newSet;
            });
        };

        return (
            <div
                className="absolute top-4 left-4 z-10 bg-white rounded border p-4 max-h-[70vh] overflow-y-auto"
                ref={ref}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Node Library</h3>
                </div>

                <div className="space-y-4 w-80">
                    {Object.entries(nodeGroups).map(
                        ([groupName, groupNodes]) => (
                            <div key={groupName} className="border rounded-lg">
                                <div
                                    className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() =>
                                        toggleGroupCollapse(groupName)
                                    }
                                >
                                    <h4 className="font-medium text-sm">
                                        {groupName}
                                    </h4>
                                    <button className="p-1">
                                        {collapsedGroups.has(groupName) ? (
                                            <ChevronDown size={16} />
                                        ) : (
                                            <ChevronUp size={16} />
                                        )}
                                    </button>
                                </div>

                                <div
                                    className={`transition-all duration-300 ease-in-out ${
                                        collapsedGroups.has(groupName)
                                            ? 'max-h-0 overflow-hidden opacity-0'
                                            : 'max-h-screen opacity-100'
                                    }`}
                                >
                                    <div className="grid grid-cols-2 gap-2 p-3">
                                        {groupNodes.map(node => (
                                            <div
                                                key={node.name}
                                                className="p-2 rounded border cursor-move hover:bg-gray-50"
                                                draggable
                                                onDragStart={e =>
                                                    onDragStart(e, node.name)
                                                }
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
                                </div>
                            </div>
                        )
                    )}

                    {Object.keys(nodeGroups).length === 0 && (
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
