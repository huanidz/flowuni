import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import FlowToolbar from './FlowToolBar';
import NodePalette from './FlowNodePallete';
import {
  ReactFlow,
  Controls,
  Background,
  addEdge,
  BackgroundVariant,
  ReactFlowProvider,
} from '@xyflow/react';
import type { Connection, ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useNodeTypes } from '@/hooks/useNodeTypes';
import { useDragDropHandler } from '@/hooks/useDragAndDropHandler';
import { useFlowActions } from '@/hooks/useFlowActions';
import { useFlowSelection } from '@/hooks/useFlowSelection';
import { useGetFlowDetail } from '@/features/flows/hooks';
import { useNodeRegistry } from '@/features/nodes';
import { parseFlowDefinition } from '@/features/flows/utils';

interface FlowBuilderContentProps {
  flow_id: string;
}

const FlowBuilderContent: React.FC<FlowBuilderContentProps> = ({ flow_id }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const nodePaletteRef = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  // Get flow detail from backend
  const { data: flowDetailResponse, isLoading: isLoadingFlow, error: flowError } = 
    useGetFlowDetail({ 
      flowId: flow_id, 
      enabled: !!flow_id 
    });

  // Get node registry status
  const { loaded: nodeRegistryLoaded } = useNodeRegistry();

  // Parse flow definition when data is available
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!flowDetailResponse?.data?.flow_definition || !nodeRegistryLoaded) {
      return { initialNodes: [], initialEdges: [] };
    }

    const parsed = parseFlowDefinition(flowDetailResponse.data.flow_definition);
    console.log('Parsed flow definition:', parsed);
    
    return {
      initialNodes: parsed.nodes,
      initialEdges: parsed.edges,
    };
  }, [flowDetailResponse?.data?.flow_definition, nodeRegistryLoaded]);

  const {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    onSelectionChange,
    selectedNodeIds,
    selectedEdgeIds,
    reinitializeFlow,
  } = useFlowSelection(initialNodes, initialEdges);

  const [nodeId, setNodeId] = useState(1);
  const [nodeTypes, setNodeTypes] = useState({});

  // Update nodeId counter based on existing nodes
  useEffect(() => {
    if (nodes.length > 0) {
      const maxId = Math.max(
        ...nodes.map(node => {
          const match = node.id.match(/nodeId_.*_(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
      );
      setNodeId(maxId + 1);
    }
  }, [nodes]);

  // Enhanced node data update function
  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      setNodes(nds =>
        nds.map(node =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...newData } }
            : node
        )
      );
    },
    [setNodes]
  );

  // Enhanced node parameter update function
  const updateNodeParameter = useCallback(
    (nodeId: string, parameterName: string, value: any) => {
      setNodes(nds =>
        nds.map(node =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  parameters: {
                    ...(node.data.parameters || {}),
                    [parameterName]: value,
                  },
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  // Create node types with update functions
  useNodeTypes(setNodeTypes, updateNodeData, updateNodeParameter);

  const { onDragStart, onDrop, onDragOver } = useDragDropHandler(
    reactFlowInstance,
    nodeId,
    setNodes,
    setNodeId,
    nodePaletteRef
  );

  const {
    onCompileFlow,
    onRunFlow,
    onClearFlow,
    onDeleteSelectedElements,
    onKeyDown,
  } = useFlowActions(
    nodes,
    edges,
    setNodes,
    setEdges,
    setNodeId,
    selectedNodeIds,
    selectedEdgeIds
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  // Handle loading states
  if (isLoadingFlow) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full border-4 border-blue-500 border-t-transparent w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flow...</p>
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

  // Handle case where node registry is not loaded yet
  if (!nodeRegistryLoaded) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse rounded-full bg-blue-500 w-4 h-4 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading node registry...</p>
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
        />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={onSelectionChange}
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

export interface FlowCanvasProps {
  flow_id: string;
}

export default function FlowCanvas({ flow_id }: FlowCanvasProps) {

  return (
    <ReactFlowProvider>
      <FlowBuilderContent flow_id={flow_id} />
    </ReactFlowProvider>
  );
}