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
import { addEdge } from '@xyflow/react';
import { type Connection } from '@xyflow/react';

interface FlowBuilderContentProps {
  flow_id: string;
}

// Separate the main flow component to use ReactFlow hooks
const FlowBuilderContent: React.FC<FlowBuilderContentProps> = ({ flow_id }) => {
  const nodePaletteRef = useRef<HTMLDivElement>(null);
    
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

  // Use ReactFlow's instance hook instead of managing state manually
  const reactFlowInstance = useReactFlow();

  // Node state management
  const updateHandlers = useNodeUpdate(setNodes, setEdges, currentEdges);
  
  // Node types management (With unified update handlers)
  const { nodeTypes, nodeTypesLoaded } = useNodeTypes(
    updateHandlers.updateNodeInputData,
    updateHandlers.updateNodeModeData,
    updateHandlers.updateNodeParameterData,
    updateHandlers.updateNodeToolConfigData
  );


  // Initialize flow when data is ready
  useEffect(() => {
    if (initialNodes && nodeTypesLoaded) {
      setNodes(initialNodes);
      setEdges(initialEdges || []);
      initializeFlow();
    }
  }, [initialNodes, initialEdges, nodeTypesLoaded, initializeFlow, setNodes, setEdges]);

  const {
    onDragStart,
    onDrop,
    onDragOver
  } = useDragDropHandler(reactFlowInstance, setNodes, nodePaletteRef);

  const {
    onCompileFlow,
    onRunFlow,
    onClearFlow,
    onSaveFlow
  } = useFlowActions(
    currentNodes,
    currentEdges,
    setNodes,
    setEdges,
  );


  const { isValidConnection } = useConnectionValidation(currentNodes, currentEdges);

  const onConnectV2 = useCallback((params: Connection) => {
    if (isValidConnection(params)) {
      setEdges(eds => addEdge(params, eds));
    }
  }, [isValidConnection]);

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
            {flowError instanceof Error ? flowError.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-100">
      <div
        className="relative w-full h-full"
        onDrop={onDrop}
        onDragOver={onDragOver}
        tabIndex={1}
      >
        <NodePalette onDragStart={onDragStart} ref={nodePaletteRef} />
        <FlowToolbar
          onCompile={onCompileFlow}
          onRun={onRunFlow}
          onClear={onClearFlow}
          onSave={onSaveFlow}
        />

        <ReactFlow
          nodes={currentNodes}
          edges={currentEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnectV2}
          isValidConnection={isValidConnection}
          minZoom={1}
          maxZoom={2}
          className="bg-gray-50"
          nodeTypes={nodeTypes}
          deleteKeyCode="Delete"
          // Additional built-in props for better UX
          snapToGrid={true}
          snapGrid={[15, 15]}
          attributionPosition="top-right"
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
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