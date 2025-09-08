import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { ConnectionValidator } from '@/features/flows/utils/NodeConnectionValidator';

interface UseConnectionHighlightingProps {
    currentNodes: Node[];
    currentEdges: Edge[];
    getNodeSpecByRFNodeType: (nodeType: string) => any;
}

export const useConnectionHighlighting = ({
    currentNodes,
    currentEdges,
    getNodeSpecByRFNodeType,
}: UseConnectionHighlightingProps) => {
    // Function to highlight handles by CSS class
    const highlightHandles = useCallback(
        (handles: Array<{ nodeId: string; handleId: string }>) => {
            // Remove existing highlights
            document
                .querySelectorAll('.highlighted-handle')
                .forEach(element => {
                    (element as HTMLElement).classList.remove(
                        'highlighted-handle'
                    );
                });

            // Add highlights to compatible handles using data attributes
            handles.forEach(({ nodeId, handleId }) => {
                // Use data-nodeid and data-handleid to find the exact handle
                const handleElement = document.querySelector(
                    `[data-nodeid="${nodeId}"][data-handleid="${handleId}"]`
                );

                if (handleElement) {
                    (handleElement as HTMLElement).classList.add(
                        'highlighted-handle'
                    );
                } else {
                    console.log('Handle element not found for:', {
                        nodeId,
                        handleId,
                    });
                }
            });
        },
        []
    );

    // Function to remove all highlights
    const clearHighlights = useCallback(() => {
        document.querySelectorAll('.highlighted-handle').forEach(element => {
            (element as HTMLElement).classList.remove('highlighted-handle');
        });
    }, []);

    // Function to find compatible target handles for a source
    const findCompatibleTargetHandles = useCallback(
        (sourceNodeId: string, sourceHandleId: string | null) => {
            const sourceNode = currentNodes.find(
                node => node.id === sourceNodeId
            );
            if (!sourceNode) {
                console.error('Source node not found');
                return [];
            }

            const sourceNodeSpec = getNodeSpecByRFNodeType(
                sourceNode.type ?? ''
            );
            if (!sourceNodeSpec) {
                console.error('Source node spec not found');
                return [];
            }

            // Create a validator instance to access private methods
            const validator = new ConnectionValidator(
                currentEdges,
                currentNodes,
                getNodeSpecByRFNodeType
            );

            // Get the source output handle using private method access
            const sourceOutputHandle = (validator as any).getSourceOutputHandle(
                sourceHandleId,
                sourceNodeSpec
            );
            if (!sourceOutputHandle) {
                console.error('Source output handle not found');
                return [];
            }

            // Get source node mode
            const sourceNodeMode = sourceNode.data?.mode as string;

            // Find all connectable target handles
            const connectableHandles: Array<{
                nodeId: string;
                handleId: string;
                handleType: string;
                nodeName: string;
                inputName: string;
                isCompatible: boolean;
            }> = [];

            // Check all nodes for compatible input handles
            currentNodes.forEach(node => {
                if (node.type === undefined) {
                    console.error('Node type not found');
                    return;
                }

                const nodeSpec = getNodeSpecByRFNodeType(node.type);
                if (!nodeSpec) {
                    console.error('Node spec not found');
                    return;
                }

                // Check each input handle for compatibility
                nodeSpec.inputs.forEach((input: any, index: number) => {
                    const isCompatible =
                        (validator as any).areTypesCompatible(
                            sourceNodeMode,
                            sourceOutputHandle.type_detail,
                            input.type_detail
                        ) &&
                        input.allow_incoming_edges !== false &&
                        sourceNodeId !== node.id;

                    if (isCompatible) {
                        // Use the actual input name to match the DOM structure
                        const handleId = `${input.name}-index:${index}`;
                        connectableHandles.push({
                            nodeId: node.id,
                            handleId: handleId,
                            handleType: 'target',
                            nodeName: (node.data?.label as string) || node.id,
                            inputName: input.name || `Input ${index}`,
                            isCompatible,
                        });
                    }
                });
            });

            return connectableHandles;
        },
        [currentNodes, currentEdges, getNodeSpecByRFNodeType]
    );

    // Function to find compatible source handles for a target
    const findCompatibleSourceHandles = useCallback(
        (targetNodeId: string, targetHandleId: string | null) => {
            const targetNode = currentNodes.find(
                node => node.id === targetNodeId
            );
            if (!targetNode) {
                console.error('Target node not found');
                return [];
            }

            const targetNodeSpec = getNodeSpecByRFNodeType(
                targetNode.type ?? ''
            );
            if (!targetNodeSpec) {
                console.error('Target node spec not found');
                return [];
            }

            // Create a validator instance to access private methods
            const validator = new ConnectionValidator(
                currentEdges,
                currentNodes,
                getNodeSpecByRFNodeType
            );

            // Parse the target handle ID to find the input
            let targetInput: any = null;
            let targetInputIndex = -1;

            if (targetHandleId) {
                // Handle format: "inputName-index:N"
                const match = targetHandleId.match(/^(.+)-index:(\d+)$/);
                if (match) {
                    const inputName = match[1];
                    targetInputIndex = parseInt(match[2]);
                    targetInput = targetNodeSpec.inputs[targetInputIndex];

                    if (!targetInput || targetInput.name !== inputName) {
                        console.error(
                            'Target input handle not found or name mismatch'
                        );
                        return [];
                    }
                } else {
                    console.error('Invalid target handle ID format');
                    return [];
                }
            } else {
                console.error('Target handle ID is null');
                return [];
            }

            // Find all connectable source handles
            const connectableHandles: Array<{
                nodeId: string;
                handleId: string;
                handleType: string;
                nodeName: string;
                outputName: string;
                isCompatible: boolean;
            }> = [];

            // Check all nodes for compatible output handles
            currentNodes.forEach(node => {
                if (node.type === undefined || node.id === targetNodeId) {
                    return;
                }

                const nodeSpec = getNodeSpecByRFNodeType(node.type);
                if (!nodeSpec) {
                    return;
                }

                const nodeMode = node.data?.mode as string;

                // Check each output handle for compatibility
                nodeSpec.outputs?.forEach((output: any, index: number) => {
                    const isCompatible =
                        (validator as any).areTypesCompatible(
                            nodeMode,
                            output.type_detail,
                            targetInput.type_detail
                        ) && targetInput.allow_incoming_edges !== false;

                    if (isCompatible) {
                        // Create handle ID for source output (assuming similar format)
                        const handleId = `${output.name}-index:${index}`;
                        connectableHandles.push({
                            nodeId: node.id,
                            handleId: handleId,
                            handleType: 'source',
                            nodeName: (node.data?.label as string) || node.id,
                            outputName: output.name || `Output ${index}`,
                            isCompatible,
                        });
                    }
                });
            });

            return connectableHandles;
        },
        [currentNodes, currentEdges, getNodeSpecByRFNodeType]
    );

    // Main handler for connection start - highlights compatible handles
    const handleConnectionStart = useCallback(
        (
            event: MouseEvent | TouchEvent,
            {
                nodeId,
                handleId,
                handleType,
            }: {
                nodeId: string | null;
                handleId: string | null;
                handleType: string | null;
            }
        ) => {
            if (!nodeId) return;

            let handlesToHighlight: Array<{
                nodeId: string;
                handleId: string;
            }> = [];

            if (handleType === 'source') {
                // Starting from source handle - find compatible target handles
                const compatibleHandles = findCompatibleTargetHandles(
                    nodeId,
                    handleId
                );
                handlesToHighlight = compatibleHandles.map(h => ({
                    nodeId: h.nodeId,
                    handleId: h.handleId,
                }));
            } else if (handleType === 'target') {
                // Starting from target handle - find compatible source handles
                const compatibleHandles = findCompatibleSourceHandles(
                    nodeId,
                    handleId
                );
                handlesToHighlight = compatibleHandles.map(h => ({
                    nodeId: h.nodeId,
                    handleId: h.handleId,
                }));
            }

            // Apply highlighting with a small delay to ensure DOM is ready
            if (handlesToHighlight.length > 0) {
                setTimeout(() => {
                    highlightHandles(handlesToHighlight);
                }, 0);
            }
        },
        [
            findCompatibleTargetHandles,
            findCompatibleSourceHandles,
            highlightHandles,
        ]
    );

    // Handler for connection end - clears all highlights
    const handleConnectionEnd = useCallback(() => {
        clearHighlights();
    }, [clearHighlights]);

    return {
        handleConnectionStart,
        handleConnectionEnd,
        highlightHandles,
        clearHighlights,
        findCompatibleTargetHandles,
        findCompatibleSourceHandles,
    };
};
