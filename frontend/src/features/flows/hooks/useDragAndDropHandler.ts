import { useCallback } from 'react';
import type { Node, ReactFlowInstance } from '@xyflow/react';
import { Position } from '@xyflow/react';
import { useNodeRegistry } from '@/features/nodes';
import React from 'react';
import { toast } from 'sonner';
import { NODE_DATA_MODE, NODE_EXECUTION_STATE } from '../consts';
import { nodeid_nanoid } from '../utils/FlowActionUtils';

export const useDragDropHandler = (
    reactFlowInstance: ReactFlowInstance | null,
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
    nodePaletteRef: React.RefObject<HTMLDivElement | null>
) => {
    const onDragStart = useCallback(
        (event: React.DragEvent, node_type: string) => {
            event.dataTransfer.setData('application/reactflow', node_type);
            event.dataTransfer.effectAllowed = 'move';
        },
        []
    );

    const { getNodeSpecByRFNodeType, loaded } = useNodeRegistry();

    const onDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>, nodes: Node[]) => {
            event.preventDefault();
            if (!reactFlowInstance || !loaded) return;

            // Kiểm tra xem vị trí thả có nằm trong NodePalette hay không
            if (nodePaletteRef.current) {
                const paletteRect =
                    nodePaletteRef.current.getBoundingClientRect();
                if (
                    event.clientX >= paletteRect.left &&
                    event.clientX <= paletteRect.right &&
                    event.clientY >= paletteRect.top &&
                    event.clientY <= paletteRect.bottom
                ) {
                    console.log('Drop avoided: Dropped on NodePalette.');
                    return; // Không cho phép thả vào NodePalette
                }
            }

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

            // Check for duplicate Chat Input or Chat Output nodes
            if (type === 'Chat Input' || type === 'Chat Output') {
                const existingNode = nodes.find(node => node.type === type);
                if (existingNode) {
                    toast.error(`Only one ${type} node is allowed`, {
                        description: `A ${type} node already exists in the flow.`,
                    });
                    return;
                }
            }

            const bounds = (
                event.currentTarget as HTMLDivElement
            ).getBoundingClientRect();
            const x = event.clientX - bounds.left;
            const y = event.clientY - bounds.top;
            const position = reactFlowInstance.screenToFlowPosition({ x, y });

            const nodeSpec = getNodeSpecByRFNodeType(type);
            if (!nodeSpec) {
                console.error(`Node type "${type}" not found in registry.`);
                return;
            }

            // Initialize parameters with default values as a simple key-value dictionary
            const initialParameters = Object.fromEntries(
                Object.entries(nodeSpec.parameters).map(([key, paramSpec]) => [
                    (paramSpec as any).name,
                    (paramSpec as any).default || '',
                ])
            );

            // Initialize input values with default values as a simple key-value dictionary
            const initialInputValues = Object.fromEntries(
                Object.entries(nodeSpec.inputs).map(([key, inputSpec]) => [
                    (inputSpec as any).name,
                    (inputSpec as any).default || '',
                ])
            );

            // Initialize output values with default values as a simple key-value dictionary
            const initialOutputValues = Object.fromEntries(
                Object.entries(nodeSpec.outputs).map(([key, outputSpec]) => [
                    (outputSpec as any).name,
                    (outputSpec as any).default || '',
                ])
            );

            const customNode: Node = {
                id: nodeid_nanoid(10),
                type,
                position,
                data: {
                    label: nodeSpec.name,
                    node_type: nodeSpec.name,
                    parameter_values: initialParameters,
                    input_values: initialInputValues,
                    output_values: initialOutputValues,
                    tool_configs: {}, // TODO: Make it load default value (if can)
                    mode: NODE_DATA_MODE.NORMAL,
                    execution_result: null,
                    execution_status: NODE_EXECUTION_STATE.DRAFT,
                },
                style: { background: '#fff', color: '#000' },
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
                dragHandle: '.node-drag-handle',
            };

            console.log('Custom node:', customNode);

            setNodes(nds => [...nds, customNode]);
            // Node ID incrementing is now handled by the flow store or component state
        },
        [loaded, reactFlowInstance, setNodes, nodePaletteRef]
    );

    const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    return { onDragStart, onDrop, onDragOver };
};
