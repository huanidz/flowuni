import { useCallback } from 'react';
import { addEdge, type Connection } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import { useConnectionValidation } from './useConnectionValidator';
import { useNodeStore } from '@/features/nodes';
import { getSourceOutputTypeName } from '../utils';

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

        // Use the utility function to get the source output type name
        const outputTypeName = getSourceOutputTypeName(
            { source, sourceHandle: sourceHandle ?? null },
            nodes,
            getNodeSpecByRFNodeType
        );

        // If the source output's IO type is RouterOutputHandle -> use custom edge
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
