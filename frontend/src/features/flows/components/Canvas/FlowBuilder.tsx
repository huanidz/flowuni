import React, { useRef, useCallback, useEffect, useState } from 'react';
import FlowToolbar from './FlowToolBar';
import NodePalette from './FlowNodePallete';
import {
    ReactFlow,
    Controls,
    Background,
    BackgroundVariant,
    useReactFlow,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useNodeTypes } from '../../hooks/useNodeTypes';
import { useNodeUpdate } from '../../hooks/useNodeUpdate';
import { useDragDropHandler } from '@/features/flows/hooks/useDragAndDropHandler';
import { useFlowActions } from '@/features/flows/hooks/useFlowActions';
import { useCurrentFlowState } from '../../hooks/useCurrentFlowState';
import { useConnectionValidation } from '../../hooks/useConnectionValidator';
import { useSelectedNode } from '@/features/flows/hooks/useSelectedNode';
import { addEdge } from '@xyflow/react';
import { type Connection } from '@xyflow/react';
import { NodeConfigSidebar } from '@/features/flows/components/Sidebar/NodeConfigSidebar';
import PlaygroundChatBox from './PlaygroundChatBox';
import useFlowStore from '@/features/flows/stores/flow_stores';
import { ConnectionValidator } from '@/features/flows/utils/NodeConnectionValidator';
import { useNodeStore } from '@/features/nodes';

interface FlowBuilderContentProps {
    flow_id: string;
}

// Separate the main flow component to use ReactFlow hooks
const FlowBuilderContent: React.FC<FlowBuilderContentProps> = ({ flow_id }) => {
    const nodePaletteRef = useRef<HTMLDivElement>(null);

    // Use store for playground chat box state
    const {
        isPlaygroundOpen,
        setPlaygroundOpen,
        playgroundPosition,
        setPlaygroundPosition,
    } = useFlowStore();

    // Use consolidated flow state hook (simplified without duplicate state)
    const {
        nodes: currentNodes,
        edges: currentEdges,
        setNodes: setNodes,
        setEdges: setEdges,
        onNodesChange: onNodesChange,
        onEdgesChange: onEdgesChange,
        initialNodes,
        initialEdges,
        initializeFlow,
        isLoading,
        flowError,
    } = useCurrentFlowState(flow_id);

    // Use selected node state
    const {
        selectedNode,
        nodeSpec,
        isSidebarCollapsed,
        selectNode,
        deselectNode,
        toggleSidebarCollapse,
        closeSidebar,
    } = useSelectedNode(setNodes);

    // Use ReactFlow's instance hook instead of managing state manually
    const reactFlowInstance = useReactFlow();

    // Use node store for accessing node specifications
    const { getNodeSpecByRFNodeType } = useNodeStore();

    // State for tracking highlighted handles
    const [highlightedHandles, setHighlightedHandles] = useState<
        Array<{
            nodeId: string;
            handleId: string;
        }>
    >([]);

    // Function to highlight handles by CSS class
    const highlightHandles = useCallback(
        (handles: Array<{ nodeId: string; handleId: string }>) => {
            // Remove existing highlights
            document.querySelectorAll('.node-input-handle').forEach(element => {
                (element as HTMLElement).classList.remove('highlighted-handle');
            });

            // Add highlights to compatible handles using multiple strategies
            handles.forEach(({ nodeId, handleId }) => {
                let handleElement: Element | null = null;

                // Strategy 1: Try the original selector
                handleElement = document.querySelector(
                    `.react-flow__node[data-id="${nodeId}"] .node-input-handle[id="${handleId}"]`
                );

                // Strategy 2: Try broader selector if first fails
                if (!handleElement) {
                    handleElement = document.querySelector(
                        `.react-flow__node[data-id="${nodeId}"] .node-input-handle`
                    );
                }

                // Strategy 3: Try searching all node-input-handle elements and filter by position/index
                if (!handleElement) {
                    const nodeElement = document.querySelector(
                        `.react-flow__node[data-id="${nodeId}"]`
                    );
                    if (nodeElement) {
                        const nodeHandles =
                            nodeElement.querySelectorAll('.node-input-handle');
                        if (nodeHandles.length > 0) {
                            // Try to find the right handle based on the index in the handleId
                            const handleIndex = parseInt(
                                handleId.split(':').pop() || '0'
                            );
                            if (
                                !isNaN(handleIndex) &&
                                handleIndex < nodeHandles.length
                            ) {
                                handleElement = nodeHandles[handleIndex];
                            } else {
                                // If we can't determine the index, highlight all handles in this node
                                nodeHandles.forEach(el => {
                                    (el as HTMLElement).classList.add(
                                        'highlighted-handle'
                                    );
                                });
                                return; // Skip to next handle
                            }
                        }
                    }
                }

                // Strategy 4: Use data attributes or other identifying features
                if (!handleElement) {
                    const allHandles =
                        document.querySelectorAll('.node-input-handle');
                    for (const element of allHandles) {
                        const parentNode = element.closest('.react-flow__node');
                        if (
                            parentNode &&
                            (parentNode as HTMLElement).getAttribute(
                                'data-id'
                            ) === nodeId
                        ) {
                            // Check if this might be the right handle based on position or other attributes
                            handleElement = element;
                            break;
                        }
                    }
                }

                console.log(
                    'Highlighting handle:',
                    handleElement,
                    'for nodeId:',
                    nodeId,
                    'handleId:',
                    handleId
                );
                if (handleElement) {
                    (handleElement as HTMLElement).classList.add(
                        'highlighted-handle'
                    );
                } else {
                    console.log(
                        'Handle element not found for nodeId:',
                        nodeId,
                        'handleId:',
                        handleId
                    );
                    // Debug: Log all available node-input-handle elements
                    const allHandles =
                        document.querySelectorAll('.node-input-handle');
                    console.log(
                        'Available node-input-handle elements:',
                        allHandles.length
                    );
                    allHandles.forEach((el, index) => {
                        console.log(`Handle ${index}:`, {
                            id: (el as HTMLElement).id,
                            class: (el as HTMLElement).className,
                            nodeId: (
                                el.closest('.react-flow__node') as HTMLElement
                            )?.getAttribute('data-id'),
                            parentNode: el.closest('.react-flow__node'),
                        });
                    });
                }
            });
        },
        []
    );

    // Node state management
    const updateHandlers = useNodeUpdate(setNodes, setEdges, currentEdges);

    // Node types management (With unified update handlers)
    const { nodeTypes, nodeTypesLoaded } = useNodeTypes(
        updateHandlers.updateNodeInputData,
        updateHandlers.updateNodeModeData,
        updateHandlers.updateNodeParameterData,
        updateHandlers.updateNodeToolConfigData,
        updateHandlers.updateNodeExecutionResult,
        updateHandlers.updateNodeExecutionStatus
    );

    // Initialize flow when data is ready
    useEffect(() => {
        if (initialNodes && nodeTypesLoaded) {
            setNodes(initialNodes);
            setEdges(initialEdges || []);
            initializeFlow();
        }
    }, [
        initialNodes,
        initialEdges,
        nodeTypesLoaded,
        initializeFlow,
        setNodes,
        setEdges,
    ]);

    const { onDragStart, onDrop, onDragOver } = useDragDropHandler(
        reactFlowInstance,
        setNodes,
        nodePaletteRef
    );

    const {
        onCompileFlow,
        onRunFlow,
        onRunFlowFromSelectedNode,
        onRunSelectedOnly,
        onClearFlow,
        onSaveFlow,
        onPlaygroundFlow,
    } = useFlowActions(
        currentNodes,
        currentEdges,
        setNodes,
        setEdges,
        updateHandlers
    );

    // Handler for playground button click
    const handlePlaygroundClick = () => {
        setPlaygroundOpen(!isPlaygroundOpen);
        onPlaygroundFlow();
    };

    const { isValidConnection } = useConnectionValidation(
        currentNodes,
        currentEdges
    );

    const onConnectV2 = useCallback(
        (params: Connection) => {
            if (isValidConnection(params)) {
                setEdges(eds => addEdge(params, eds));
            }
        },
        [isValidConnection]
    );

    // Unified loading/error state handling
    if (isLoading || !nodeTypesLoaded) {
        const message = isLoading ? 'Loading flow...' : 'Loading node types...';

        return (
            <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full border-4 border-blue-500 border-t-transparent w-12 h-12 mx-auto mb-4"></div>
                    <p className="text-gray-600">{message}</p>
                </div>
            </div>
        );
    }

    if (flowError) {
        return (
            <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-4">⚠️</div>
                    <p className="text-red-600 mb-2">Error loading flow</p>
                    <p className="text-gray-500 text-sm">
                        {flowError instanceof Error
                            ? flowError.message
                            : 'Unknown error occurred'}
                    </p>
                </div>
            </div>
        );
    }

    const onConnectStart = (
        event: MouseEvent | TouchEvent,
        {
            nodeId,
            handleId,
            handleType,
        }: {
            nodeId: string | null;
            handleId: string | null;
            handleType: string | null;
        }
    ) => {
        console.log('Connection started from:', {
            nodeId,
            handleId,
            handleType,
        });

        // Clear previous highlights
        setHighlightedHandles([]);

        // If connection starts from a source handle, determine which target handles are compatible
        if (nodeId && handleType === 'source') {
            const sourceNode = currentNodes.find(node => node.id === nodeId);
            if (!sourceNode) {
                console.error('Source node not found');
                return;
            }

            const sourceNodeSpec = getNodeSpecByRFNodeType(
                sourceNode.type ?? ''
            );
            if (!sourceNodeSpec) {
                console.error('Source node spec not found');
                return;
            }

            // Create a validator instance to access private methods
            const validator = new ConnectionValidator(
                currentEdges,
                currentNodes,
                getNodeSpecByRFNodeType
            );

            // Get the source output handle using private method access
            const sourceOutputHandle = (validator as any).getSourceOutputHandle(
                handleId,
                sourceNodeSpec
            );
            if (!sourceOutputHandle) {
                console.error('Source output handle not found');
                return;
            }

            // Get source node mode
            const sourceNodeMode = sourceNode.data?.mode as string;

            // Find all connectable target handles
            const connectableHandles: Array<{
                nodeId: string;
                handleId: string;
                handleType: string;
                nodeName: string;
                inputName: string;
                isCompatible: boolean;
            }> = [];

            // Check all nodes for compatible input handles
            currentNodes.forEach(node => {
                if (node.type === undefined) {
                    console.error('Node type not found');
                    return;
                }

                const nodeSpec = getNodeSpecByRFNodeType(node.type);
                if (!nodeSpec) {
                    console.error('Node spec not found');
                    return;
                }

                // Check each input handle for compatibility
                nodeSpec.inputs.forEach((input, index) => {
                    const isCompatible =
                        (validator as any).areTypesCompatible(
                            sourceNodeMode,
                            sourceOutputHandle.type_detail,
                            input.type_detail
                        ) &&
                        input.allow_incoming_edges !== false &&
                        nodeId !== node.id;

                    if (isCompatible) {
                        connectableHandles.push({
                            nodeId: node.id,
                            handleId: `input:${index}`,
                            handleType: 'target',
                            nodeName: (node.data?.label as string) || node.id,
                            inputName: input.name || `Input ${index}`,
                            isCompatible,
                        });
                    }
                });
            });

            // Print out all connectable handles
            console.log('Connectable handles found:', connectableHandles);

            // Also log a summary
            console.log(
                `Found ${connectableHandles.length} connectable handles:`,
                connectableHandles.map(h => `${h.nodeName} (${h.inputName})`)
            );

            // Set highlighted handles
            const handlesToHighlight = connectableHandles.map(h => ({
                nodeId: h.nodeId,
                handleId: h.handleId,
            }));
            console.log('Highlighted handles:', handlesToHighlight);
            setHighlightedHandles(handlesToHighlight);

            // Apply highlighting using CSS class
            setTimeout(() => {
                highlightHandles(handlesToHighlight);
            }, 0);
        }
    };

    const onConnectEnd = () => {
        // Clear highlights
        setHighlightedHandles([]);

        // Remove highlighting styles from all handles
        document.querySelectorAll('.node-input-handle').forEach(element => {
            (element as HTMLElement).classList.remove('highlighted-handle');
        });

        // Also remove from any highlighted handles that might have been added
        document.querySelectorAll('.highlighted-handle').forEach(element => {
            (element as HTMLElement).classList.remove('highlighted-handle');
        });
    };

    return (
        <div className="w-full h-screen bg-gray-100 flex">
            <div
                className="relative flex-grow"
                onDrop={onDrop}
                onDragOver={onDragOver}
                tabIndex={1}
            >
                <NodePalette onDragStart={onDragStart} ref={nodePaletteRef} />
                <FlowToolbar
                    onCompile={onCompileFlow}
                    onRun={onRunFlow}
                    onRunFromSelected={onRunFlowFromSelectedNode}
                    onRunSelectedOnly={onRunSelectedOnly}
                    onClear={onClearFlow}
                    onSave={onSaveFlow}
                    onPlayground={handlePlaygroundClick}
                />

                <ReactFlow
                    nodes={currentNodes}
                    edges={currentEdges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnectV2}
                    onConnectStart={onConnectStart}
                    onConnectEnd={onConnectEnd}
                    isValidConnection={isValidConnection}
                    minZoom={0.88}
                    maxZoom={2}
                    className="bg-gray-50"
                    nodeTypes={nodeTypes}
                    deleteKeyCode="Delete"
                    // Additional built-in props for better UX
                    snapToGrid={true}
                    snapGrid={[15, 15]}
                    attributionPosition="top-right"
                    onNodeClick={(_, node) => {
                        // Only handle node click if it's not already selected
                        if (!selectedNode || selectedNode.id !== node.id) {
                            selectNode(node.id);
                        }
                    }}
                    onPaneClick={() => {
                        deselectNode();
                    }}
                >
                    <Controls />
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={12}
                        size={1}
                    />
                </ReactFlow>
            </div>

            {/* Node Configuration Sidebar */}
            {selectedNode && nodeSpec && (
                <NodeConfigSidebar
                    selectedNode={selectedNode}
                    nodeSpec={nodeSpec}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={toggleSidebarCollapse}
                    onClose={closeSidebar}
                    onInputValueChange={(inputName, value) => {
                        if (
                            selectedNode &&
                            updateHandlers.updateNodeInputData
                        ) {
                            updateHandlers.updateNodeInputData(
                                selectedNode.id,
                                inputName,
                                value
                            );
                        }
                    }}
                    onParameterChange={(paramName, value) => {
                        if (
                            selectedNode &&
                            updateHandlers.updateNodeParameterData
                        ) {
                            updateHandlers.updateNodeParameterData(
                                selectedNode.id,
                                paramName,
                                value
                            );
                        }
                    }}
                    onModeChange={newMode => {
                        if (selectedNode && updateHandlers.updateNodeModeData) {
                            updateHandlers.updateNodeModeData(
                                selectedNode.id,
                                newMode
                            );
                        }
                    }}
                    onToolConfigChange={(toolConfigName, value) => {
                        if (
                            selectedNode &&
                            updateHandlers.updateNodeToolConfigData
                        ) {
                            updateHandlers.updateNodeToolConfigData(
                                selectedNode.id,
                                toolConfigName,
                                value
                            );
                        }
                    }}
                />
            )}

            {/* Playground Chat Box */}
            <PlaygroundChatBox
                isOpen={isPlaygroundOpen}
                onClose={() => setPlaygroundOpen(false)}
                position={playgroundPosition}
                onPositionChange={setPlaygroundPosition}
                nodeUpdateHandlers={updateHandlers}
            />
        </div>
    );
};

// Wrapper component with ReactFlowProvider
const FlowBuilder: React.FC<FlowBuilderContentProps> = ({ flow_id }) => {
    return (
        <ReactFlowProvider>
            <FlowBuilderContent flow_id={flow_id} />
        </ReactFlowProvider>
    );
};

export default FlowBuilder;
