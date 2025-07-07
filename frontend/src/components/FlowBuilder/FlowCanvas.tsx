import React, { useState, useCallback } from 'react';
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
} from '@xyflow/react';
import type { Edge, Node, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Initial nodes
const initialNodes: Node[] = [];

// Initial edges
const initialEdges: Edge[] = [];

export default function FlowBuilder() {
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(5);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const reactFlowBounds = (event.target as Element).getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode: Node = {
        id: `node_${nodeId}`,
        type: type === 'start' ? 'input' : type === 'end' ? 'output' : 'default',
        position,
        data: { 
          label: type === 'start' ? 'Start' : 
                type === 'end' ? 'End' : 
                type === 'process' ? 'Process' : 
                'Decision' 
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setNodeId((id) => id + 1);
    },
    [nodeId, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onRunFlow = () => {
    // Simple flow execution - just highlight connected nodes
    console.log('Running flow...');
    console.log('Nodes:', nodes);
    console.log('Edges:', edges);
    
    // You can add flow execution logic here
    alert('Flow executed! Check console for flow data.');
  };

  const onClearFlow = () => {
    setNodes([]);
    setEdges([]);
    setNodeId(1);
  };

  return (
    <div className="w-full h-screen bg-gray-100">
      <div className="relative w-full h-full">
        <NodePalette onDragStart={onDragStart} />
        <FlowToolbar onRun={onRunFlow} onClear={onClearFlow} />
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
          className="bg-gray-50"
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}