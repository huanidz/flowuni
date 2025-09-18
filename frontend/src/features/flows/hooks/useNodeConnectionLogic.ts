import { useCallback } from 'react';
import { addEdge, type Connection } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import { useConnectionValidation } from './useConnectionValidator';
import { useNodeStore } from '@/features/nodes';

interface UseNodeConnectionLogicProps {
    // current nodes and edges are provided for validation hook (if needed by consumer)
    nodes: Node[];
    edges: Edge[];
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

/**
 * Hook extracting connection logic (onConnect) from FlowBuilder.
 *
 * Provides a stable onConnect handler that validates a connection using
 * useConnectionValidation and adds a custom edge when valid.
 */
export const useNodeConnectionLogic = ({
    nodes,
    edges,
    setEdges,
}: UseNodeConnectionLogicProps) => {
    const { isValidConnection } = useConnectionValidation(nodes, edges);
    const { getNodeSpecByRFNodeType } = useNodeStore();

    const determineEdgeTypeFromSource = (
        params: Connection
    ): string | undefined => {
        const { source, sourceHandle } = params;

        // find source node
        const sourceNode = nodes.find(n => n.id === source);
        if (!sourceNode) return undefined;

        const sourceNodeSpec = getNodeSpecByRFNodeType(sourceNode.type ?? '');
        if (!sourceNodeSpec) return undefined;

        // derive handle index: if sourceHandle is null -> tool node -> use first output (index 0)
        let handleIndex: number;
        if (sourceHandle === null) {
            handleIndex = 0;
        } else {
            const parts = sourceHandle.split(':');
            if (parts.length < 2) return undefined;
            const idx = parseInt(parts[1], 10);
            if (isNaN(idx)) return undefined;
            handleIndex = idx;
        }

        const outputSpec = sourceNodeSpec.outputs[handleIndex];
        if (!outputSpec) return undefined;

        // If the source output's IO type is RouterOutputHandle -> use custom edge
        const outputTypeName = outputSpec.type_detail?.type;
        if (outputTypeName === 'RouterOutputHandle') return 'custom';

        return undefined;
    };

    const onConnect = useCallback(
        (params: Connection) => {
            // Keep logging for debugging
            // eslint-disable-next-line no-console
            console.log('Params:', params);
            if (isValidConnection(params)) {
                const edgeType = determineEdgeTypeFromSource(params);
                const edgePayload: any = {
                    ...params,
                };

                if (edgeType === 'custom') {
                    edgePayload.type = 'custom';
                    edgePayload.data = { text: 'Custom Label 🎉' };
                }

                setEdges(eds => addEdge(edgePayload, eds));
            }
        },
        [isValidConnection, setEdges, nodes, getNodeSpecByRFNodeType]
    );

    return {
        onConnect,
    };
};

export default useNodeConnectionLogic;
