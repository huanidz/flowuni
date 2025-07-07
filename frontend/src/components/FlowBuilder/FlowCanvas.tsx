import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { FlowBuilderContentProps } from '@/types/FlowBuilderType';
import nodeRegistry from '@/parsers/NodeRegistry';
import { NodeFactory } from '@/parsers/NodeFactory';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const FlowBuilderContent: React.FC<FlowBuilderContentProps> = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(1);
  const [nodeTypes, setNodeTypes] = useState({});

  useEffect(() => {
      const loadNodes = async () => {
          try {
              await nodeRegistry.loadCatalog();
              const allNodes = nodeRegistry.getAllNodes();
              const customNodeTypes: { [key: string]: React.FC<any> } = {};
              allNodes.forEach(nodeSpec => {
                  const CustomNodeComponent = NodeFactory.createNodeComponent(nodeSpec.name);
                  if (CustomNodeComponent) {
                      customNodeTypes[nodeSpec.name] = CustomNodeComponent;
                  }
              });
              setNodeTypes(customNodeTypes);
          } catch (error) {
              console.error("Failed to load node catalog or create node components:", error);
          }
      };
      loadNodes();
  }, []);

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
      const position = reactFlowInstance.screenToFlowPosition({ x, y });

      const nodeSpec = nodeRegistry.getNode(type);
      if (!nodeSpec) {
          console.error(`Node type "${type}" not found in registry.`);
          return;
      }

      const customNode: Node = {
        id: 'nodeId_' + nodeId,
        type, // This 'type' now directly corresponds to the node name from the catalog
        position,
        data: {
            label: nodeSpec.name,
            nodeType: nodeSpec.name,
            parameters: Object.fromEntries(
                Object.entries(nodeSpec.parameters).map(([key, paramSpec]) => [key, (paramSpec as any).default])
            )
        },
        style: { background: '#fff', color: '#000' },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };

      console.log(customNode);

      setNodes((nds) => [...nds, customNode]);
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