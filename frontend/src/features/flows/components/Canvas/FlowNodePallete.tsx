import React, { useEffect, useState, forwardRef, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { useNodeRegistry } from '@/features/nodes';

interface NodePaletteProps {
    onDragStart: (event: React.DragEvent, node_type: string) => void;
}

interface NodeSpec {
    name: string;
    description: string;
    group: string;
}

// Simple fuzzy search function
const fuzzyMatch = (query: string, text: string): boolean => {
    if (!query) return true;

    // Convert both to lowercase for case-insensitive search
    const lowerQuery = query.toLowerCase();
    const lowerText = text.toLowerCase();

    // Check if all characters in query appear in order in text
    let queryIndex = 0;
    for (
        let i = 0;
        i < lowerText.length && queryIndex < lowerQuery.length;
        i++
    ) {
        if (lowerText[i] === lowerQuery[queryIndex]) {
            queryIndex++;
        }
    }

    return queryIndex === lowerQuery.length;
};

const NodePalette = forwardRef<HTMLDivElement, NodePaletteProps>(
    ({ onDragStart }, ref) => {
        const [nodeGroups, setNodeGroups] = useState<
            Record<string, NodeSpec[]>
        >({});
        const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
            new Set()
        );
        const [searchQuery, setSearchQuery] = useState<string>('');
        const { nodes, getAllNodeSpecs } = useNodeRegistry();

        useEffect(() => {
            const loadPaletteNodes = async () => {
                try {
                    const allNodes = getAllNodeSpecs();
                    const groupedNodes: Record<string, NodeSpec[]> = {};
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

        // Filter nodes based on search query
        const filteredNodeGroups = useMemo(() => {
            if (!searchQuery.trim()) {
                return nodeGroups;
            }

            const filteredGroups: Record<string, NodeSpec[]> = {};

            Object.entries(nodeGroups).forEach(([groupName, groupNodes]) => {
                const filteredNodes = groupNodes.filter(node =>
                    fuzzyMatch(searchQuery, node.name)
                );

                if (filteredNodes.length > 0) {
                    filteredGroups[groupName] = filteredNodes;
                }
            });

            return filteredGroups;
        }, [nodeGroups, searchQuery]);

        return (
            <div
                className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[70vh] overflow-y-auto"
                ref={ref}
            >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 rounded-t-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">
                        Node Library
                    </h3>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search nodes..."
                            className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <Search
                            size={16}
                            className="absolute left-3 top-2.5 text-gray-400"
                        />
                    </div>
                </div>
                <div className="p-3 w-96">
                    {Object.entries(filteredNodeGroups).map(
                        ([groupName, groupNodes]) => (
                            <div key={groupName} className="mb-4 last:mb-2">
                                <div
                                    className="flex justify-between items-center px-3 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer rounded-md transition-colors border border-gray-200 mb-2"
                                    onClick={() =>
                                        toggleGroupCollapse(groupName)
                                    }
                                >
                                    <h4 className="font-medium text-sm text-gray-700 capitalize">
                                        {groupName}
                                    </h4>
                                    <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                                        {collapsedGroups.has(groupName) ? (
                                            <ChevronDown
                                                size={14}
                                                className="text-gray-600"
                                            />
                                        ) : (
                                            <ChevronUp
                                                size={14}
                                                className="text-gray-600"
                                            />
                                        )}
                                    </button>
                                </div>
                                {!collapsedGroups.has(groupName) && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {groupNodes.map(node => (
                                            <div
                                                key={node.name}
                                                className="p-3 rounded-md border border-gray-200 cursor-move hover:border-blue-300 hover:bg-blue-50 transition-all duration-150 bg-white shadow-sm"
                                                draggable
                                                onDragStart={e =>
                                                    onDragStart(e, node.name)
                                                }
                                            >
                                                <div className="font-medium text-sm mb-1 text-gray-800">
                                                    {node.name}
                                                </div>
                                                {node.description && (
                                                    <div className="text-xs text-gray-500 leading-relaxed">
                                                        {node.description}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    )}
                    {Object.keys(filteredNodeGroups).length === 0 && (
                        <div className="py-8 text-center">
                            {searchQuery ? (
                                <p className="text-sm text-gray-500">
                                    No nodes found matching "{searchQuery}"
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Loading nodes...
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }
);

export default NodePalette;
