import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Trash2 } from 'lucide-react';
import { chatBoxStyles } from '@/features/flows/styles/chatBoxStyles';
import { useNodes, useEdges } from '@xyflow/react';
import type { PlaygroundChatBoxPosition, PGMessage } from '../../types';
import { runFlow } from '../../api';
import { watchFlowExecution } from '@/api/sse';
import { NODE_EXECUTION_STATE } from '../../consts';

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
    const edges = useEdges();

    // Node validation
    const chatInputNode = nodes.find(node => node.type === 'Chat Input');
    const chatOutputNode = nodes.find(node => node.type === 'Chat Output');
    const hasChatInputNode = !!chatInputNode;
    const hasChatOutputNode = !!chatOutputNode;

    // State
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState<PlaygroundChatBoxPosition>({
        x: 0,
        y: 0,
    });
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<PGMessage[]>([]);
    const [isFlowRunning, setIsFlowRunning] = useState(false);
    const [flowError, setFlowError] = useState<string | null>(null);

    // Refs
    const chatBoxRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    const flowTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { updateNodeInputData } = nodeUpdateHandlers;

    // Initialize position
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

    // Cleanup event source on unmount or close
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (flowTimeoutRef.current) {
                clearTimeout(flowTimeoutRef.current);
                flowTimeoutRef.current = null;
            }
        };
    }, []);

    // Close event source when chat closes
    useEffect(() => {
        if (!isOpen && eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            setIsFlowRunning(false);
            if (flowTimeoutRef.current) {
                clearTimeout(flowTimeoutRef.current);
                flowTimeoutRef.current = null;
            }
        }
    }, [isOpen]);

    // Parse SSE message safely
    const parseSSEMessage = useCallback((message: string) => {
        try {
            const parsed = JSON.parse(message);
            console.log('[SSE] Parsed message:', parsed);
            return parsed;
        } catch (error) {
            console.error(
                '[SSE] Failed to parse message:',
                error,
                'Raw message:',
                message
            );
            return null;
        }
    }, []);

    // Handle SSE message data
    const handleSSEData = useCallback((parsed: any) => {
        if (!parsed) {
            console.warn('[SSE] No parsed message');
            return;
        }

        const { event, data } = parsed;

        // Handle failed events
        if (event === 'failed' && data?.error) {
            console.error('[SSE] Flow execution failed:', data.error);

            // Clear timeout since we got a response (even if failed)
            if (flowTimeoutRef.current) {
                clearTimeout(flowTimeoutRef.current);
                flowTimeoutRef.current = null;
            }

            setIsFlowRunning(false);
            setFlowError(data.error);

            // Close the event source since the flow failed
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            return;
        }

        // Handle successful events
        if (event === NODE_EXECUTION_STATE.COMPLETED && data) {
            const { node_type, input_values } = data;

            if (node_type === 'Chat Output' && input_values?.message_in) {
                // Clear timeout since we got a response
                if (flowTimeoutRef.current) {
                    clearTimeout(flowTimeoutRef.current);
                    flowTimeoutRef.current = null;
                }

                const newMessage: PGMessage = {
                    id: `bot-${Date.now()}`,
                    user_id: 0, // Bot message
                    message: input_values.message_in,
                    timestamp: new Date(),
                };

                setMessages(prev => [...prev, newMessage]);
                setIsFlowRunning(false);

                // Close the event source since we got our response
                if (eventSourceRef.current) {
                    eventSourceRef.current.close();
                    eventSourceRef.current = null;
                }
            }

            // Handle other node types if needed
            console.log('[SSE] Processed node:', node_type);
        }
    }, []);

    // Run flow and handle execution
    const executeFlow = useCallback(async () => {
        if (isFlowRunning) {
            console.warn('Flow is already running');
            return;
        }

        setIsFlowRunning(true);
        setFlowError(null);

        try {
            // Close any existing event source
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            const response = await runFlow(nodes, edges);
            console.log('[Flow] Run response:', response);

            const { task_id } = response;
            if (!task_id) {
                throw new Error('No task_id received from flow execution');
            }

            // Watch flow execution via SSE
            eventSourceRef.current = watchFlowExecution(task_id, message => {
                const parsed = parseSSEMessage(message);
                if (parsed) {
                    handleSSEData(parsed);
                }
            });

            // Set a timeout to handle cases where we don't get a response
            flowTimeoutRef.current = setTimeout(() => {
                console.warn('[Flow] Timeout waiting for response');
                setFlowError('Flow execution timed out');
                setIsFlowRunning(false);

                if (eventSourceRef.current) {
                    eventSourceRef.current.close();
                    eventSourceRef.current = null;
                }
            }, 30000); // 30 second timeout

            // Handle SSE connection errors
            if (eventSourceRef.current) {
                eventSourceRef.current.onerror = error => {
                    console.error('[SSE] Connection error:', error);
                    setFlowError('Connection to flow execution failed');
                    setIsFlowRunning(false);

                    if (flowTimeoutRef.current) {
                        clearTimeout(flowTimeoutRef.current);
                        flowTimeoutRef.current = null;
                    }

                    if (eventSourceRef.current) {
                        eventSourceRef.current.close();
                        eventSourceRef.current = null;
                    }
                };

                eventSourceRef.current.close = () => {
                    console.log('[SSE] Connection closed');
                    // Don't automatically set running to false here
                    // Let the timeout or successful response handle it
                };
            }
        } catch (error) {
            console.error('[Flow] Error running flow:', error);
            setFlowError(
                error instanceof Error ? error.message : 'Failed to run flow'
            );
            setIsFlowRunning(false);
        }
    }, [nodes, edges, isFlowRunning, parseSSEMessage, handleSSEData]);

    // Message handling
    const handleClearMessages = useCallback(() => {
        setMessages([]);
        setFlowError(null);
    }, []);

    const handleSendMessage = useCallback(async () => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage || isFlowRunning) return;

        const userMessage: PGMessage = {
            id: `user-${Date.now()}`,
            user_id: 1, // User message
            message: trimmedMessage,
            timestamp: new Date(),
        };

        // Add user message immediately
        setMessages(prev => [...prev, userMessage]);
        setMessage('');

        // Update input node with the message
        if (chatInputNode?.id) {
            updateNodeInputData(chatInputNode.id, 'message_in', trimmedMessage);
        }

        // Execute flow
        await executeFlow();

        // Clear input node after execution
        if (chatInputNode?.id) {
            updateNodeInputData(chatInputNode.id, 'message_in', '');
        }
    }, [
        message,
        isFlowRunning,
        chatInputNode?.id,
        updateNodeInputData,
        executeFlow,
    ]);

    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        },
        [handleSendMessage]
    );

    const handleMessageChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setMessage(value);

            // Real-time update of input node (optional - you might want to remove this)
            if (chatInputNode?.id) {
                updateNodeInputData(chatInputNode.id, 'message_in', value);
            }
        },
        [chatInputNode?.id, updateNodeInputData]
    );

    // Dragging handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (chatBoxRef.current) {
            const rect = chatBoxRef.current.getBoundingClientRect();
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    }, []);

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
        [isDragging, dragOffset, onPositionChange]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Drag event listeners
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
                <div className="flex items-center">
                    <div style={chatBoxStyles.headerTitle}>
                        Chat Playground {isFlowRunning && '(Running...)'}
                    </div>
                </div>
                <div style={chatBoxStyles.headerActions}>
                    <button
                        onClick={handleClearMessages}
                        style={chatBoxStyles.iconButton}
                        title="Clear messages"
                        aria-label="Clear messages"
                        disabled={messages.length === 0}
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
                            {flowError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-800 text-sm font-medium">
                                        Error: {flowError}
                                    </p>
                                </div>
                            )}

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

                            {isFlowRunning && (
                                <div className="mb-4 text-left">
                                    <div className="inline-block p-3 rounded-lg bg-muted text-muted-foreground">
                                        Thinking...
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="flex-shrink-0 border-t p-3 bg-white">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={message}
                                    onChange={handleMessageChange}
                                    onKeyDown={handleKeyPress}
                                    placeholder={
                                        isFlowRunning
                                            ? 'Processing...'
                                            : 'Type a message...'
                                    }
                                    className="flex-1"
                                    disabled={isFlowRunning}
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!message.trim() || isFlowRunning}
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
