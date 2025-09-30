import React, { useEffect, useState, forwardRef, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Wrench, Disc3 } from 'lucide-react';
import { useNodeRegistry } from '@/features/nodes';
import type { NodeSpec } from '@/features/nodes/types';
import { NodeIconDisplayer } from '@/features/flows/components/NodeIconDisplayer/NodeIconDisplayer';
import { NODE_TAGS } from '@/features/nodes/consts';

interface NodePaletteProps {
    onDragStart: (event: React.DragEvent, node_type: string) => void;
    searchDelay?: number;
}

interface NodeNameWithIconsProps {
    name: string;
    canBeTool?: boolean;
    icon?: import('@/features/nodes/types').NodeIcon;
    tags?: string[];
}

// Utility: Convert NodeIcon to NodeIconData format
const convertToIconData = (icon?: NodeNameWithIconsProps['icon']) => {
    if (!icon) return null;
    return {
        icon_type: icon.icon_type as any,
        icon_value: icon.icon_value,
        color: icon.color,
    };
};

// Utility: Fuzzy search matching
const fuzzyMatch = (query: string, text: string): boolean => {
    if (!query) return true;

    const lowerQuery = query.toLowerCase();
    const lowerText = text.toLowerCase();
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

// Component: Node name display with icons
const NodeNameWithIcons: React.FC<NodeNameWithIconsProps> = ({
    name,
    canBeTool,
    icon,
    tags,
}) => {
    const iconData = convertToIconData(icon);
    const hasSessionTag = tags?.includes(NODE_TAGS.SESSION_ENABLED);

    return (
        <div className="flex justify-between items-center min-h-[24px]">
            <div className="flex items-center gap-2">
                {iconData && (
                    <div className="flex items-center justify-center w-5 h-5">
                        <NodeIconDisplayer icon={iconData} size={18} />
                    </div>
                )}
                <span className="font-semibold text-sm text-gray-900 leading-tight">
                    {name}
                </span>
            </div>

            <div className="flex items-center gap-1">
                {canBeTool && (
                    <div className="flex items-center justify-center w-5 h-5 bg-blue-50 rounded-md">
                        <Wrench size={14} className="text-blue-500" />
                    </div>
                )}
                {hasSessionTag && (
                    <div className="flex items-center justify-center w-5 h-5 bg-purple-50 rounded-md">
                        <Disc3 size={14} className="text-purple-500" />
                    </div>
                )}
            </div>
        </div>
    );
};

// Component: Individual node card
const NodeCard: React.FC<{
    node: NodeSpec;
    onDragStart: (e: React.DragEvent, nodeName: string) => void;
}> = ({ node, onDragStart }) => (
    <div
        className="p-3 rounded-lg border border-gray-200 cursor-move hover:border-blue-300 hover:bg-blue-50 hover:shadow-md transition-all duration-200 bg-white shadow-sm transform hover:-translate-y-0.5"
        draggable
        onDragStart={e => onDragStart(e, node.name)}
    >
        <NodeNameWithIcons
            name={node.name}
            canBeTool={node.can_be_tool}
            icon={node.icon}
            tags={node.tags}
        />
        {node.description && (
            <div className="text-xs text-gray-500 leading-relaxed mt-2 line-clamp-2">
                {node.description}
            </div>
        )}
    </div>
);

// Component: Node group section
const NodeGroup: React.FC<{
    groupName: string;
    nodes: NodeSpec[];
    isCollapsed: boolean;
    onToggle: () => void;
    onDragStart: (e: React.DragEvent, nodeName: string) => void;
}> = ({ groupName, nodes, isCollapsed, onToggle, onDragStart }) => (
    <div className="mb-5 last:mb-2">
        <div
            className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 cursor-pointer rounded-lg transition-all duration-200 border border-gray-200 mb-3 shadow-sm"
            onClick={onToggle}
        >
            <h4 className="font-semibold text-sm text-gray-800 capitalize flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                {groupName}
            </h4>
            <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors duration-200">
                {isCollapsed ? (
                    <ChevronDown size={16} className="text-gray-600" />
                ) : (
                    <ChevronUp size={16} className="text-gray-600" />
                )}
            </button>
        </div>
        {!isCollapsed && (
            <div className="grid grid-cols-2 gap-3">
                {nodes.map(node => (
                    <NodeCard
                        key={node.name}
                        node={node}
                        onDragStart={onDragStart}
                    />
                ))}
            </div>
        )}
    </div>
);

// Component: Empty state
const EmptyState: React.FC<{ searchQuery: string }> = ({ searchQuery }) => (
    <div className="py-12 text-center px-4">
        <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Search size={24} className="text-gray-400" />
            </div>
        </div>
        <p className="text-sm text-gray-500 font-medium">
            {searchQuery
                ? `No nodes found matching "${searchQuery}"`
                : 'Loading nodes...'}
        </p>
        {searchQuery && (
            <p className="text-xs text-gray-400 mt-2">
                Try different keywords or browse categories
            </p>
        )}
    </div>
);

// Main component
const NodePalette = forwardRef<HTMLDivElement, NodePaletteProps>(
    ({ onDragStart, searchDelay = 300 }, ref) => {
        const [nodeGroups, setNodeGroups] = useState<
            Record<string, NodeSpec[]>
        >({});
        const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
            new Set()
        );
        const [searchQuery, setSearchQuery] = useState('');
        const [debouncedQuery, setDebouncedQuery] = useState('');
        const { nodes, getAllNodeSpecs } = useNodeRegistry();

        // Load and group nodes
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
                            group,
                            can_be_tool: node.can_be_tool || false,
                            inputs: node.inputs || [],
                            outputs: node.outputs || [],
                            parameters: node.parameters || [],
                            icon: node.icon,
                            tags: node.tags,
                        });
                    });

                    setNodeGroups(groupedNodes);
                } catch (error) {
                    console.error('Failed to load nodes for palette:', error);
                }
            };
            loadPaletteNodes();
        }, [nodes, getAllNodeSpecs]);

        // Debounce search query
        useEffect(() => {
            const timerId = setTimeout(() => {
                setDebouncedQuery(searchQuery);
            }, searchDelay);
            return () => clearTimeout(timerId);
        }, [searchQuery, searchDelay]);

        // Filter nodes based on search
        const filteredNodeGroups = useMemo(() => {
            if (!debouncedQuery.trim()) {
                return nodeGroups;
            }

            const filteredGroups: Record<string, NodeSpec[]> = {};
            Object.entries(nodeGroups).forEach(([groupName, groupNodes]) => {
                const filteredNodes = groupNodes.filter(node =>
                    fuzzyMatch(debouncedQuery, node.name)
                );
                if (filteredNodes.length > 0) {
                    filteredGroups[groupName] = filteredNodes;
                }
            });

            return filteredGroups;
        }, [nodeGroups, debouncedQuery]);

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

        const hasFilteredNodes = Object.keys(filteredNodeGroups).length > 0;

        return (
            <div
                className="absolute top-4 left-4 z-10 bg-white rounded-xl shadow-xl border border-gray-100 max-h-[70vh] overflow-y-auto backdrop-blur-sm bg-opacity-95 transition-all duration-300 animate-fadeIn"
                ref={ref}
            >
                <div className="sticky top-0 bg-white bg-opacity-95 backdrop-blur-sm border-b border-gray-100 px-5 py-4 rounded-t-xl">
                    <h3 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        Node Library
                    </h3>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search nodes..."
                            className="w-full px-4 py-2.5 pl-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <Search
                            size={18}
                            className="absolute left-3.5 top-2.5 text-gray-400 transition-transform duration-200 hover:scale-110"
                        />
                    </div>
                </div>

                <div className="p-4 w-96 max-w-full">
                    {hasFilteredNodes ? (
                        Object.entries(filteredNodeGroups).map(
                            ([groupName, groupNodes]) => (
                                <NodeGroup
                                    key={groupName}
                                    groupName={groupName}
                                    nodes={groupNodes}
                                    isCollapsed={collapsedGroups.has(groupName)}
                                    onToggle={() =>
                                        toggleGroupCollapse(groupName)
                                    }
                                    onDragStart={onDragStart}
                                />
                            )
                        )
                    ) : (
                        <EmptyState searchQuery={debouncedQuery} />
                    )}
                </div>
            </div>
        );
    }
);

NodePalette.displayName = 'NodePalette';

export default NodePalette;
