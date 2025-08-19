import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Trash2 } from 'lucide-react';
import { chatBoxStyles } from '@/features/flows/styles/chatBoxStyles';
import { useNodes } from '@xyflow/react';
import type { PlaygroundChatBoxPosition, PGMessage } from '../../types';

interface PlaygroundChatBoxProps {
    isOpen: boolean;
    onClose: () => void;
    position: PlaygroundChatBoxPosition;
    onPositionChange: (position: PlaygroundChatBoxPosition) => void;
    nodeUpdateHandlers: any;
}

const PlaygroundChatBox: React.FC<PlaygroundChatBoxProps> = ({
    isOpen,
    onClose,
    position,
    onPositionChange,
    nodeUpdateHandlers,
}) => {
    const nodes = useNodes();

    const hasChatInputNode = nodes.some(node => node.type === 'Chat Input');
    const hasChatOutputNode = nodes.some(node => node.type === 'Chat Output');

    // Get the chat input and output nodes
    const chatInputNode = nodes.find(node => node.type === 'Chat Input');
    const chatOutputNode = nodes.find(node => node.type === 'Chat Output');

    console.log('chatInputNode', chatInputNode);
    console.log('chatOutputNode', chatOutputNode);

    const inputNodeId = chatInputNode?.id;
    const outputNodeId = chatOutputNode?.id;

    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState<PlaygroundChatBoxPosition>({
        x: 0,
        y: 0,
    });
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<PGMessage[]>([
        {
            id: '1',
            text: '',
            user_id: 0,
            message: 'Hello! How can I help you today?',
            timestamp: new Date(),
        },
    ]);

    const chatBoxRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // updateNodeInputData: (nodeId, inputName, value)
    const { updateNodeInputData } = nodeUpdateHandlers;

    // Websocket
    const ws = useRef<WebSocket | null>(null);
    const wsUrl = 'ws://localhost:5002/api/flow_execution/ws/playground_chat';

    // Initialize position to bottom-right corner if at default (0,0)
    useEffect(() => {
        if (
            isOpen &&
            chatBoxRef.current &&
            position.x === 0 &&
            position.y === 0
        ) {
            const chatBoxWidth = chatBoxRef.current.offsetWidth;
            onPositionChange({
                x: window.innerWidth - chatBoxWidth - 16,
                y: 16,
            });
        }
    }, [isOpen, position, onPositionChange]);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Dragging event handlers
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

            // Keep chat box within viewport bounds
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

    // Attach/detach drag event listeners
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragOffset]);

    // Message handling
    const handleClearMessages = () => {
        setMessages([]);
    };

    const handleSendMessage = () => {
        if (!message.trim()) return;

        const newMessage: PGMessage = {
            id: Date.now().toString(),
            text: '',
            user_id: 1, // Assuming 1 represents the current user
            message: message,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, newMessage]);
        setMessage('');

        // Clear the input node data when sending message
        if (inputNodeId) {
            updateNodeInputData(inputNodeId, 'message_in', '');
        }

        // Simulate bot response
        setTimeout(() => {
            const replyMessage: PGMessage = {
                id: (Date.now() + 1).toString(),
                text: '',
                user_id: 0, // Assuming 0 represents the bot/system
                message: 'This is a dummy response to your message.',
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

    const showWarnings = !hasChatInputNode || !hasChatOutputNode;

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
            {/* Draggable Header */}
            <CardHeader
                style={chatBoxStyles.header}
                className="cursor-move flex-shrink-0 p-0 m-0 border-b"
                onMouseDown={handleMouseDown}
            >
                <div style={chatBoxStyles.headerTitle}>Chat Playground</div>
                <div style={chatBoxStyles.headerActions}>
                    <button
                        onClick={handleClearMessages}
                        style={chatBoxStyles.iconButton}
                        title="Clear messages"
                        aria-label="Clear messages"
                        disabled={messages.length <= 1}
                    >
                        <Trash2 size={18} />
                    </button>
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

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {showWarnings ? (
                    <div className="flex-1 flex items-center justify-center p-6">
                        <div className="text-center space-y-4">
                            {!hasChatInputNode && (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-yellow-800 font-medium">
                                        Need ChatInput Node to start chatting
                                    </p>
                                </div>
                            )}
                            {!hasChatOutputNode && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-blue-800 font-medium">
                                        Need ChatOutput to receive message from
                                        flow
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`mb-4 ${msg.user_id === 1 ? 'text-right' : ''}`}
                                >
                                    <div
                                        className={`
                                            inline-block p-3 rounded-lg max-w-[80%] break-words
                                            ${
                                                msg.user_id === 1
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                            }
                                        `}
                                    >
                                        {msg.message}
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

                        {/* Message Input */}
                        <div className="flex-shrink-0 border-t p-3 bg-white">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={message}
                                    onChange={e => {
                                        setMessage(e.target.value);
                                        // Update the input node data when typing
                                        if (inputNodeId) {
                                            updateNodeInputData(
                                                inputNodeId,
                                                'message_in',
                                                e.target.value
                                            );
                                        }
                                    }}
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
                    </>
                )}
            </div>
        </Card>
    );
};

export default PlaygroundChatBox;
