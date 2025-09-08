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
                    console.log('Successfully highlighted handle:', {
                        nodeId,
                        handleId,
                    });
                } else {
                    console.log('Handle element not found for:', {
                        nodeId,
                        handleId,
                    });

                    // Debug: Check what handles are available for this node
                    const nodeHandles = document.querySelectorAll(
                        `[data-nodeid="${nodeId}"]`
                    );
                    console.log(
                        `Available handles for node ${nodeId}:`,
                        Array.from(nodeHandles).map(el => ({
                            handleId: (el as HTMLElement).getAttribute(
                                'data-handleid'
                            ),
                            id: (el as HTMLElement).getAttribute('data-id'),
                            classes: (el as HTMLElement).className,
                        }))
                    );
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

            console.log('Connectable handles found:', connectableHandles);
            console.log(
                `Found ${connectableHandles.length} connectable handles:`,
                connectableHandles.map(h => `${h.nodeName} (${h.inputName})`)
            );

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
            console.log('Connection started from:', {
                nodeId,
                handleId,
                handleType,
            });

            // If connection starts from a source handle, find and highlight compatible targets
            if (nodeId && handleType === 'source') {
                const compatibleHandles = findCompatibleTargetHandles(
                    nodeId,
                    handleId
                );

                // Convert to the format expected by highlightHandles
                const handlesToHighlight = compatibleHandles.map(h => ({
                    nodeId: h.nodeId,
                    handleId: h.handleId,
                }));

                console.log('Highlighted handles:', handlesToHighlight);

                // Apply highlighting with a small delay to ensure DOM is ready
                setTimeout(() => {
                    highlightHandles(handlesToHighlight);
                }, 0);
            }
        },
        [findCompatibleTargetHandles, highlightHandles]
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
    };
};
