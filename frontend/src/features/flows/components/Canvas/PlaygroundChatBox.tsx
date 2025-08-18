import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send } from 'lucide-react';
import { chatBoxStyles } from '@/features/flows/styles/chatBoxStyles';

interface Position {
    x: number;
    y: number;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'other';
    timestamp: Date;
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
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Hello! How can I help you today?',
            sender: 'other',
            timestamp: new Date(),
        },
    ]);
    const chatBoxRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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

    const handleSendMessage = () => {
        if (message.trim() === '') return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: message,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages([...messages, newMessage]);
        setMessage('');

        // Simulate a reply after a short delay
        setTimeout(() => {
            const replyMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: 'This is a dummy response to your message.',
                sender: 'other',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, replyMessage]);
        }, 1000);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <Card
            ref={chatBoxRef}
            className={`
                absolute transition-none z-[1001]
                w-96 h-[500px] shadow-xl bg-white border border-gray-300 rounded-lg backdrop-blur-sm
                ${isDragging ? 'shadow-2xl select-none' : ''}
                flex flex-col overflow-hidden p-0
            `}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            {/* Header - Fixed at top with no padding/margin */}
            <CardHeader
                style={chatBoxStyles.header}
                className="cursor-move flex-shrink-0 p-0 m-0 border-b"
                onMouseDown={handleMouseDown}
            >
                <div style={chatBoxStyles.headerTitle}>Chat Playground</div>
                <div style={chatBoxStyles.headerActions}>
                    <button
                        onClick={onClose}
                        style={chatBoxStyles.iconButton}
                        title="Close chat"
                        aria-label="Close chat"
                    >
                        <X size={18} />
                    </button>
                </div>
            </CardHeader>

            {/* Messages area - Flexible content that can scroll */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-4">
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`mb-4 ${
                                msg.sender === 'user' ? 'text-right' : ''
                            }`}
                        >
                            <div
                                className={`inline-block p-3 rounded-lg max-w-[80%] break-words ${
                                    msg.sender === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                }`}
                            >
                                {msg.text}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {msg.timestamp.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input area - Fixed at bottom */}
                <div className="flex-shrink-0 border-t p-3 bg-white">
                    <div className="flex items-center gap-2">
                        <Input
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Type a message..."
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={!message.trim()}
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default PlaygroundChatBox;
