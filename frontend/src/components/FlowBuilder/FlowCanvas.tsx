import React, { useState, useCallback, useRef } from 'react';
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
import type { Edge, Node, Connection, ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { FlowBuilderContentProps } from '@/types/FlowBuilderType';

import { useNodeTypes } from '@/hooks/useNodeTypes';
import { useDragDropHandler } from '@/hooks/useDragAndDropHandler';
import { useFlowActions } from '@/hooks/useFlowActions';
import { useFlowSelection } from '@/hooks/useFlowSelection';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const FlowBuilderContent: React.FC<FlowBuilderContentProps> = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

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
  } = useFlowSelection(initialNodes, initialEdges);

  const [nodeId, setNodeId] = useState(1);
  const [nodeTypes, setNodeTypes] = useState({});

  // Enhanced node data update function
  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  }, [setNodes]);

  // Enhanced node parameter update function
  const updateNodeParameter = useCallback((nodeId: string, parameterName: string, value: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                parameters: {
                  ...(node.data.parameters || {}), // Ensure parameters is an object
                  [parameterName]: value
                }
              }
            }
          : node
      )
    );
  }, [setNodes]);

  // Create node types with update functions
  useNodeTypes(setNodeTypes, updateNodeData, updateNodeParameter);
  
  const { onDragStart, onDrop, onDragOver } = useDragDropHandler(reactFlowInstance, nodeId, setNodes, setNodeId);
  const { onCompileFlow, onRunFlow, onClearFlow, onDeleteSelectedElements, onKeyDown } = useFlowActions(
    nodes,
    edges,
    setNodes,
    setEdges,
    setNodeId,
    selectedNodeIds,
    selectedEdgeIds
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);


  return (
    <div className="w-full h-screen bg-gray-100">
      <div
        className="relative w-full h-full"
        ref={reactFlowWrapper}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onKeyDown={onKeyDown}
        tabIndex={1} // Make the div focusable to capture keyboard events
      >
        <NodePalette onDragStart={onDragStart} />
        <FlowToolbar onCompile={onCompileFlow} onRun={onRunFlow} onClear={onClearFlow} />

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

export default function FlowBuilder() {
  return (
    <ReactFlowProvider>
      <FlowBuilderContent flow_id="template" />
    </ReactFlowProvider>
  );
}