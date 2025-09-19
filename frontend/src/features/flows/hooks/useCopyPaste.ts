import { useState, useCallback } from 'react';
import type { Node } from '@xyflow/react';
import { Position } from '@xyflow/react';
import { useKeyboardControl } from './useKeyboardControl';
import { nanoid } from 'nanoid';

interface UseCopyPasteProps {
    selectedNode: Node | null;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

export const useCopyPaste = ({ selectedNode, setNodes }: UseCopyPasteProps) => {
    const [copiedNode, setCopiedNode] = useState<Omit<Node, 'id'> | null>(null);

    const handleCopy = useCallback(() => {
        if (selectedNode) {
            const { id, ...nodeWithoutId } = selectedNode;
            setCopiedNode(nodeWithoutId);
        }
    }, [selectedNode]);

    const handlePaste = useCallback(() => {
        if (copiedNode) {
            const newNode: Node = {
                id: nanoid(10),
                ...copiedNode,
                position: {
                    x: copiedNode.position.x + 50, // Shift by 50px
                    y: copiedNode.position.y + 50,
                },
            };

            setNodes(nds => [...nds, newNode]);
        }
    }, [copiedNode, setNodes]);

    useKeyboardControl([
        {
            combo: 'Ctrl+C',
            handler: handleCopy,
        },
        {
            combo: 'Ctrl+V',
            handler: handlePaste,
        },
    ]);

    return {
        copiedNode,
    };
};
