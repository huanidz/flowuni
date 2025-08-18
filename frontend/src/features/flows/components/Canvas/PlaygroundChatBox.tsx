import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Position {
    x: number;
    y: number;
}

interface PlaygroundChatBoxProps {
    isOpen: boolean;
    onClose: () => void;
    position: Position;
    onPositionChange: (position: Position) => void;
}

const PlaygroundChatBox: React.FC<PlaygroundChatBoxProps> = ({
    isOpen,
    onClose,
    position,
    onPositionChange,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
    const chatBoxRef = useRef<HTMLDivElement>(null);

    // Initialize position only if it's the default position (0,0)
    useEffect(() => {
        if (
            isOpen &&
            chatBoxRef.current &&
            position.x === 0 &&
            position.y === 0
        ) {
            const chatBoxWidth = chatBoxRef.current.offsetWidth;
            onPositionChange({
                x: window.innerWidth - chatBoxWidth - 16, // 16px from right edge
                y: 16, // top-4 in Tailwind (16px)
            });
        }
    }, [isOpen, position, onPositionChange]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (chatBoxRef.current) {
            const rect = chatBoxRef.current.getBoundingClientRect();
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging && chatBoxRef.current) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            // Keep the chat box within the viewport
            const maxX = window.innerWidth - chatBoxRef.current.offsetWidth;
            const maxY = window.innerHeight - chatBoxRef.current.offsetHeight;

            onPositionChange({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY)),
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Add event listeners for dragging
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    if (!isOpen) return null;

    return (
        <Card
            ref={chatBoxRef}
            className={`
                absolute transition-none z-[1001] cursor-move
                w-80 h-96 shadow-lg
                ${isDragging ? 'shadow-xl select-none' : ''}
            `}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            <CardHeader
                className="pb-3 cursor-move"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Playground</CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-6 w-6"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="h-full overflow-auto pt-0">
                {/* Empty content for now */}
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    Chat content will appear here
                </div>
            </CardContent>
        </Card>
    );
};

export default PlaygroundChatBox;
