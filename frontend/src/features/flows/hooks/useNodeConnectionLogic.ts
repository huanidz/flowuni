import { useCallback } from 'react';
import { addEdge, type Connection } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import { useConnectionValidation } from './useConnectionValidator';

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

    const onConnect = useCallback(
        (params: Connection) => {
            // Keep logging for debugging
            // eslint-disable-next-line no-console
            console.log('Params:', params);
            if (isValidConnection(params)) {
                setEdges(eds =>
                    addEdge(
                        {
                            ...params,
                            type: 'custom',
                            data: { text: 'Custom Label 🎉' },
                        },
                        eds
                    )
                );
            }
        },
        [isValidConnection, setEdges]
    );

    return {
        onConnect,
    };
};

export default useNodeConnectionLogic;
