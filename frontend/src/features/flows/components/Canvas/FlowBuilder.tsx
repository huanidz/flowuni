import React, { useCallback, useRef } from 'react';
import FlowToolbar from './FlowToolBar';
import NodePalette from './FlowNodePallete';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAllNodeTypesConstructor } from '../../hooks/useNodeAllTypesConstructor';
import { useDragDropHandler } from '@/features/flows/hooks/useDragAndDropHandler';
import { useFlowActions } from '@/features/flows/hooks/useFlowActions';
import { useCurrentFlowState } from '../../hooks/useCurrentFlowState';
import { useFlowUtilOperations } from '../../hooks/useFlowUtilOperations';

interface FlowBuilderContentProps {
  flow_id: string;
}

// Separate the main flow component to use ReactFlow hooks
const FlowBuilderContent: React.FC<FlowBuilderContentProps> = ({ flow_id }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const nodePaletteRef = useRef<HTMLDivElement>(null);
  
  // Use ReactFlow's built-in state management hooks
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  // Use ReactFlow's instance hook instead of managing state manually
  const reactFlowInstance = useReactFlow();

  // Node types management
  const { nodeTypes, nodeTypesLoaded } = useAllNodeTypesConstructor(setNodes);

  // Use consolidated flow state hook (simplified without duplicate state)
  const {
    initialNodes,
    initialEdges,
    initializeFlow,
    isLoading,
    flowError,
  } = useCurrentFlowState(flow_id);

  // Initialize flow when data is ready
  React.useEffect(() => {
    if (initialNodes && nodeTypesLoaded) {
      setNodes(initialNodes);
      setEdges(initialEdges || []);
      initializeFlow();
    }
  }, [initialNodes, initialEdges, nodeTypesLoaded, initializeFlow, setNodes, setEdges]);

  // Use ReactFlow's built-in connection handler
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Simplified key handling
  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Delete') {
      // ReactFlow will handle node/edge deletion automatically with deleteKeyCode prop
    }
  }, []);

  const setNodesWrapper = (updater: (nodes: Node[]) => Node[]) => {
    setNodes(updater);
  };

  const {
    onDragStart,
    onDrop,
    onDragOver
  } = useDragDropHandler(reactFlowInstance, setNodesWrapper, nodePaletteRef);

  const {
    onCompileFlow,
    onRunFlow,
    onClearFlow,
    onSaveFlow
  } = useFlowActions(
    nodes,
    edges,
    setNodes,
    setEdges,
    [], // selectedNodeIds
    []  // selectedEdgeIds
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
          onConnect={onConnect}
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