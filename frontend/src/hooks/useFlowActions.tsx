import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';

const get_flow_export = (nodes: Node[], edges: Edge[]) => {
    const flowExport = {
        nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
        edges: edges.map(({ id, source, target, sourceHandle, targetHandle }) => ({ id, source, target, sourceHandle, targetHandle })),
    };
    return flowExport;
};

export const useFlowActions = (
  nodes: Node[],
  edges: Edge[],
  setNodes: (nodes: Node[]) => void,
  setEdges: (edges: Edge[]) => void,
  setNodeId: (id: number) => void
) => {

    const onCompileFlow = useCallback(() => {
        console.log('Compiling flow...');
    }, [nodes, edges]);

    const onRunFlow = useCallback(() => {
        const flowExport = get_flow_export(nodes, edges);
        console.log('Flow export payload:', flowExport);
    }, [nodes, edges]);

    const onClearFlow = useCallback(() => {
        setNodes([]);
        setEdges([]);
        setNodeId(1);
    }, [setNodes, setEdges, setNodeId]);

    return { onCompileFlow, onRunFlow, onClearFlow };
};