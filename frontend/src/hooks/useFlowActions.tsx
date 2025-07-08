import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import axios from 'axios';

// Helper function to prepare the data payload
const get_flow_graph_data = (nodes: Node[], edges: Edge[]) => {
    const flow_graph_data = {
        nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
        edges: edges.map(({ id, source, target, sourceHandle, targetHandle }) => ({ id, source, target, sourceHandle, targetHandle })),
    };
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
        const flow_graph_data = get_flow_graph_data(nodes, edges);
        console.log('Compiling flow with payload:', flow_graph_data);

        try {
            // 👇 Send a POST request to the backend
            const response = await axios.post('http://localhost:5002/api/flow_execution/compile', flow_graph_data);
            
            console.log('Compilation successful:', response.data);
            // You can add further logic here, like showing a success notification
            // alert(`Compilation successful: ${response.data.message}`);

        } catch (error) {
            console.error('Error compiling flow:', error);
            if (axios.isAxiosError(error)) {
                // Access more specific error information
                console.error('Server responded with:', error.response?.data);
            }
             // You can add further logic here, like showing an error notification
        }
    }, [nodes, edges]); // Dependencies remain the same

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