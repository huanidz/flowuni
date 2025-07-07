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
  ReactFlowInstance,
} from '@xyflow/react';
import type { Edge, Node, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { FlowBuilderContentProps } from '@/types/FlowBuilderType';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const FlowBuilderContent: React.FC<FlowBuilderContentProps> = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(1);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      // Use currentTarget to ensure we get wrapper bounds
      const bounds = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const position = reactFlowInstance.project({ x, y });

      const newNode: Node = {
        id: `node_${nodeId}`,
        type: type === 'start' ? 'input' : type === 'end' ? 'output' : 'default',
        position,
        data: {
          label:
            type === 'start'
              ? 'Start'
              : type === 'end'
              ? 'End'
              : type === 'process'
              ? 'Process'
              : 'Decision',
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setNodeId((id) => id + 1);
    },
    [nodeId, reactFlowInstance, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  const onRunFlow = () => {
    console.log('Running flow...', nodes, edges);
    alert('Flow executed! Check console for data.');
  };

  const onClearFlow = () => {
    setNodes([]);
    setEdges([]);
    setNodeId(1);
  };

  return (
    <div className="w-full h-screen bg-gray-100">
      <div
        className="relative w-full h-full"
        ref={reactFlowWrapper}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <NodePalette onDragStart={onDragStart} />
        <FlowToolbar onRun={onRunFlow} onClear={onClearFlow} />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          fitView
          minZoom={1}
          maxZoom={2}
          className="bg-gray-50"
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
