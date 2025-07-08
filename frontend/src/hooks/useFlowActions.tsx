import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import axios from 'axios';

const get_flow_graph_data = (nodes: Node[], edges: Edge[]) => {
    const flow_graph_data = {
        nodes: nodes.map(({ id, type, position, data }) => {
            console.log(`Node ${id} data:`, data);
            return { id, type, position, data };
        }),
        edges: edges.map(({ id, source, target, sourceHandle, targetHandle }) => ({ id, source, target, sourceHandle, targetHandle })),
    };
    
    console.log('Complete flow graph data:', JSON.stringify(flow_graph_data, null, 2));
    return flow_graph_data;
};

export const useFlowActions = (
  nodes: Node[],
  edges: Edge[],
  setNodes: (nodes: Node[]) => void,
  setEdges: (edges: Edge[]) => void,
  setNodeId: (id: number) => void
) => {

    const onCompileFlow = useCallback(async () => {
        console.log('=== COMPILATION START ===');
        console.log('Raw nodes:', nodes);
        console.log('Raw edges:', edges);
        
        const flow_graph_data = get_flow_graph_data(nodes, edges);
        console.log('Compiling flow with payload:', flow_graph_data);

        // Check each node's data structure
        nodes.forEach((node, index) => {
            console.log(`Node ${index} (${node.id}):`, {
                type: node.type,
                parameters: node.data.parameters,
                input_values: node.data.input_values,
                fullData: node.data
            });
        });

        try {
            const response = await axios.post('http://localhost:5002/api/flow_execution/compile', flow_graph_data);
            console.log('Compilation successful:', response.data);
        } catch (error) {
            console.error('Error compiling flow:', error);
            if (axios.isAxiosError(error)) {
                console.error('Server responded with:', error.response?.data);
            }
        }
        
        console.log('=== COMPILATION END ===');
    }, [nodes, edges]);

    const onRunFlow = useCallback(() => {
        const flowExport = get_flow_graph_data(nodes, edges);
        console.log('Flow export payload:', flowExport);
    }, [nodes, edges]);

    const onClearFlow = useCallback(() => {
        setNodes([]);
        setEdges([]);
        setNodeId(1);
    }, [setNodes, setEdges, setNodeId]);

    return { onCompileFlow, onRunFlow, onClearFlow };
};