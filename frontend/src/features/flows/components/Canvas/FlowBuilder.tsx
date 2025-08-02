import React, { useCallback, useRef, useState } from 'react';
import FlowToolbar from './FlowToolBar';
import NodePalette from './FlowNodePallete';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
} from '@xyflow/react';
import type { ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useNodeTypes } from '@/features/flows/hooks/useNodeTypes';
import { useDragDropHandler } from '@/features/flows/hooks/useDragAndDropHandler';
import { useFlowActions } from '@/features/flows/hooks/useFlowActions';
import { useFlowState } from '@/features/flows/hooks/useFlowState';
import { useNodeOperations } from '@/features/flows/hooks/useNodeOperations';

interface FlowBuilderContentProps {
  flow_id: string;
}

const FlowBuilder: React.FC<FlowBuilderContentProps> = ({ flow_id }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const nodePaletteRef = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  // Use consolidated flow state hook
  const {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    initialNodes,
    initialEdges,
    isLoading,
    flowError,
    nodeRegistryLoaded
  } = useFlowState(flow_id);

  // Initialize flow when data is ready
  React.useEffect(() => {
    if (initialNodes.length > 0 && initialEdges.length > 0 && nodeRegistryLoaded) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [initialNodes, initialEdges, nodeRegistryLoaded, setNodes, setEdges]);

  const [nodeTypes, setNodeTypes] = useState({});

  // Create node types with update functions
  const { updateNodeData, updateNodeParameter } = useNodeOperations(
    nodes,
    edges,
    setNodes,
    setEdges,
    [],
    []
  );
  useNodeTypes(setNodeTypes, updateNodeData, updateNodeParameter);

  const { onDragStart, onDrop, onDragOver } = useDragDropHandler(
    reactFlowInstance,
    setNodes,
    nodePaletteRef
  );

  const {
    onCompileFlow,
    onRunFlow,
    onClearFlow,
    onSaveFlow,
  } = useFlowActions(
    nodes,
    edges,
    setNodes,
    setEdges,
    [],
    []
  );

  const { onConnect, onKeyDown } = useNodeOperations(
    nodes,
    edges,
    setNodes,
    setEdges,
    [],
    []
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  // Unified loading/error state handling
  if (isLoading) {
    const message = isLoading ? 'Loading flow...' : 'Loading node registry...';
    
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          {isLoading ? (
            <div className="animate-spin rounded-full border-4 border-blue-500 border-t-transparent w-12 h-12 mx-auto mb-4"></div>
          ) : (
            <div className="animate-pulse rounded-full bg-blue-500 w-4 h-4 mx-auto mb-4"></div>
          )}
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  // Handle error states
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
        ref={reactFlowWrapper}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onKeyDown={onKeyDown}
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
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={() => {}}
          onConnect={onConnect}
          onInit={onInit}
          minZoom={1}
          maxZoom={2}
          className="bg-gray-50"
          nodeTypes={nodeTypes}
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default FlowBuilder;