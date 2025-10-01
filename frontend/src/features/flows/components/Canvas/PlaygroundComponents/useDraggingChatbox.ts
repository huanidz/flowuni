import { useState, useCallback, useEffect } from 'react';
import type { PlaygroundChatBoxPosition } from '../../../types';

interface UseDraggingChatboxProps {
    chatBoxRef: React.RefObject<HTMLDivElement | null>;
    position: PlaygroundChatBoxPosition;
    onPositionChange: (position: PlaygroundChatBoxPosition) => void;
}

export const useDraggingChatbox = ({
    chatBoxRef,
    onPositionChange,
}: UseDraggingChatboxProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState<PlaygroundChatBoxPosition>({
        x: 0,
        y: 0,
    });

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (chatBoxRef.current) {
                const rect = chatBoxRef.current.getBoundingClientRect();
                setIsDragging(true);
                setDragOffset({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                });
            }
        },
        [chatBoxRef]
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (isDragging && chatBoxRef.current) {
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;

                const maxX = window.innerWidth - chatBoxRef.current.offsetWidth;
                const maxY =
                    window.innerHeight - chatBoxRef.current.offsetHeight;

                onPositionChange({
                    x: Math.max(0, Math.min(newX, maxX)),
                    y: Math.max(0, Math.min(newY, maxY)),
                });
            }
        },
        [isDragging, dragOffset, onPositionChange, chatBoxRef]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return {
        isDragging,
        handleMouseDown,
    };
};
