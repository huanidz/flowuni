import React, { useRef, useCallback, useEffect } from 'react';
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
import { useConnectionHighlighting } from '../../hooks/useHandleConnectionHighlighting';
import { useSelectedNode } from '@/features/flows/hooks/useSelectedNode';
import { addEdge } from '@xyflow/react';
import { type Connection } from '@xyflow/react';
import { NodeConfigSidebar } from '@/features/flows/components/Sidebar/NodeConfigSidebar';
import PlaygroundChatBox from './PlaygroundChatBox';
import useFlowStore from '@/features/flows/stores/flow_stores';
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
    const { handleConnectionStart, handleConnectionEnd } =
        useConnectionHighlighting({
            currentNodes,
            currentEdges,
            getNodeSpecByRFNodeType,
        });

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
        onResetAllData,
        onResetExecutionData,
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

    return (
        <div className="w-full h-screen bg-gray-100 flex">
            <div
                className="relative flex-grow"
                onDrop={event => onDrop(event, currentNodes)}
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
                    onResetAllData={onResetAllData}
                    onResetExecutionData={onResetExecutionData}
                    onSave={onSaveFlow}
                    onPlayground={handlePlaygroundClick}
                    nodes={currentNodes}
                    edges={currentEdges}
                />

                <ReactFlow
                    nodes={currentNodes}
                    edges={currentEdges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnectV2}
                    onConnectStart={handleConnectionStart}
                    onConnectEnd={handleConnectionEnd}
                    isValidConnection={isValidConnection}
                    minZoom={0.7}
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
                flowId={flow_id}
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
