import React, { useState, useRef, useEffect } from 'react';

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
        <div
            ref={chatBoxRef}
            className={`
                absolute bg-white border border-gray-200 rounded-lg shadow-lg
                transition-none z-[1001] cursor-move
                w-80 h-96
                ${isDragging ? 'shadow-xl select-none' : ''}
            `}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            <div
                className="flex items-center justify-between p-4 border-b border-gray-200 cursor-move"
                onMouseDown={handleMouseDown}
            >
                <h3 className="text-lg font-medium text-gray-900">
                    Playground
                </h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
            <div className="p-4 h-full overflow-auto">
                {/* Empty content for now */}
                <div className="flex items-center justify-center h-full text-gray-500">
                    Chat content will appear here
                </div>
            </div>
        </div>
    );
};

export default PlaygroundChatBox;
