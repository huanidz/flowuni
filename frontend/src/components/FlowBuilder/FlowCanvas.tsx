import React, { useState, useCallback, useRef } from 'react';
import FlowToolbar from './FlowToolBar';
import NodePalette from './FlowNodePallete';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
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

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const FlowBuilderContent: React.FC<FlowBuilderContentProps> = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(1);
  const [nodeTypes, setNodeTypes] = useState({});

  // Load node from catalog. This is code for the sidebar
  useNodeTypes(setNodeTypes);
  const { onDragStart, onDrop, onDragOver } = useDragDropHandler(reactFlowInstance, nodeId, setNodes, setNodeId);
  const { onCompileFlow, onRunFlow, onClearFlow } = useFlowActions(nodes, edges, setNodes, setEdges, setNodeId);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      style: {
        stroke: '#555',
        strokeWidth: 2,
      }
    }, eds)),
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
      >
        <NodePalette onDragStart={onDragStart} />
        <FlowToolbar onCompile={onCompileFlow} onRun={onRunFlow} onClear={onClearFlow} />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
