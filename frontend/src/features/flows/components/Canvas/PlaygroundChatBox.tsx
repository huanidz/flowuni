import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { useNodes, useEdges } from '@xyflow/react';
import type { PlaygroundChatBoxPosition, PGMessage } from '../../types';
import { runFlow } from '../../api';
import { watchFlowExecution } from '@/api/sse';
import { NODE_EXECUTION_STATE } from '../../consts';

// Extracted components
import ChatHeader from './PlaygroundComponents/ChatHeader';
import ChatWarnings from './PlaygroundComponents/ChatWarnings';
import MessagesArea from './PlaygroundComponents/MessagesArea';
import MessageInput from './PlaygroundComponents/MessageInput';

// Constants
import {
    CHAT_BOX_HEIGHT,
    CHAT_BOX_MARGIN,
    CHAT_BOX_Z_INDEX,
    FLOW_EXECUTION_TIMEOUT,
    USER_ID,
    BOT_ID,
    CHAT_INPUT_NODE_TYPE,
    CHAT_OUTPUT_NODE_TYPE,
    FLOW_TIMEOUT_ERROR,
    CONNECTION_ERROR,
    NO_TASK_ID_ERROR,
    FLOW_RUN_ERROR,
    SSE_LOG_PREFIX,
    FLOW_LOG_PREFIX,
} from './PlaygroundComponents/constants';

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
    const chatInputNode = nodes.find(
        node => node.type === CHAT_INPUT_NODE_TYPE
    );
    const chatOutputNode = nodes.find(
        node => node.type === CHAT_OUTPUT_NODE_TYPE
    );
    const hasChatInputNode = !!chatInputNode;
    const hasChatOutputNode = !!chatOutputNode;
    const hasChatNodes = hasChatInputNode && hasChatOutputNode;

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

    // ===== POSITION LOGIC =====
    const initializePosition = useCallback(() => {
        if (
            isOpen &&
            chatBoxRef.current &&
            position.x === 0 &&
            position.y === 0
        ) {
            const chatBoxWidth = chatBoxRef.current.offsetWidth;
            onPositionChange({
                x: window.innerWidth - chatBoxWidth - CHAT_BOX_MARGIN,
                y: CHAT_BOX_MARGIN,
            });
        }
    }, [isOpen, position, onPositionChange]);

    useEffect(() => {
        initializePosition();
    }, [initializePosition]);

    // ===== DRAGGING LOGIC =====
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

    // ===== CLEANUP LOGIC =====
    const cleanupEventSource = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
    }, []);

    const cleanupTimeout = useCallback(() => {
        if (flowTimeoutRef.current) {
            clearTimeout(flowTimeoutRef.current);
            flowTimeoutRef.current = null;
        }
    }, []);

    const cleanupAll = useCallback(() => {
        cleanupEventSource();
        cleanupTimeout();
        setIsFlowRunning(false);
    }, [cleanupEventSource, cleanupTimeout]);

    useEffect(() => {
        return () => {
            cleanupAll();
        };
    }, [cleanupAll]);

    useEffect(() => {
        if (!isOpen) {
            cleanupAll();
        }
    }, [isOpen, cleanupAll]);

    // ===== SCROLLING LOGIC =====
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ===== SSE LOGIC =====
    const parseSSEMessage = useCallback((message: string) => {
        try {
            const parsed = JSON.parse(message);
            console.log(`${SSE_LOG_PREFIX} Parsed message:`, parsed);
            return parsed;
        } catch (error) {
            console.error(
                `${SSE_LOG_PREFIX} Failed to parse message:`,
                error,
                'Raw message:',
                message
            );
            return null;
        }
    }, []);

    const handleSSEData = useCallback(
        (parsed: any) => {
            if (!parsed) {
                console.warn(`${SSE_LOG_PREFIX} No parsed message`);
                return;
            }

            const { event, data } = parsed;

            // Handle failed events
            if (event === 'failed' && data?.error) {
                console.error(
                    `${SSE_LOG_PREFIX} Flow execution failed:`,
                    data.error
                );

                cleanupTimeout();
                setIsFlowRunning(false);
                setFlowError(data.error);
                cleanupEventSource();
                return;
            }

            // Handle successful events
            if (event === NODE_EXECUTION_STATE.COMPLETED && data) {
                const { node_type, input_values } = data;

                if (
                    node_type === CHAT_OUTPUT_NODE_TYPE &&
                    input_values?.message_in
                ) {
                    cleanupTimeout();

                    const newMessage: PGMessage = {
                        id: `bot-${Date.now()}`,
                        user_id: BOT_ID,
                        message: input_values.message_in,
                        timestamp: new Date(),
                    };

                    setMessages(prev => [...prev, newMessage]);
                    setIsFlowRunning(false);
                    cleanupEventSource();
                }

                console.log(`${SSE_LOG_PREFIX} Processed node:`, node_type);
            }
        },
        [cleanupTimeout, cleanupEventSource]
    );

    // ===== FLOW EXECUTION LOGIC =====
    const executeFlow = useCallback(async () => {
        if (isFlowRunning) {
            console.warn('Flow is already running');
            return;
        }

        setIsFlowRunning(true);
        setFlowError(null);

        try {
            cleanupEventSource();

            const response = await runFlow(nodes, edges);
            console.log(`${FLOW_LOG_PREFIX} Run response:`, response);

            const { task_id } = response;
            if (!task_id) {
                throw new Error(NO_TASK_ID_ERROR);
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
                console.warn(`${FLOW_LOG_PREFIX} Timeout waiting for response`);
                setFlowError(FLOW_TIMEOUT_ERROR);
                setIsFlowRunning(false);
                cleanupEventSource();
            }, FLOW_EXECUTION_TIMEOUT);

            // Handle SSE connection errors
            if (eventSourceRef.current) {
                eventSourceRef.current.onerror = error => {
                    console.error(`${SSE_LOG_PREFIX} Connection error:`, error);
                    setFlowError(CONNECTION_ERROR);
                    setIsFlowRunning(false);
                    cleanupTimeout();
                    cleanupEventSource();
                };

                eventSourceRef.current.close = () => {
                    console.log(`${SSE_LOG_PREFIX} Connection closed`);
                    // Don't automatically set running to false here
                    // Let the timeout or successful response handle it
                };
            }
        } catch (error) {
            console.error(`${FLOW_LOG_PREFIX} Error running flow:`, error);
            setFlowError(
                error instanceof Error ? error.message : FLOW_RUN_ERROR
            );
            setIsFlowRunning(false);
        }
    }, [
        nodes,
        edges,
        isFlowRunning,
        parseSSEMessage,
        handleSSEData,
        cleanupEventSource,
        cleanupTimeout,
    ]);

    // ===== MESSAGE HANDLING LOGIC =====
    const handleClearMessages = useCallback(() => {
        setMessages([]);
        setFlowError(null);
    }, []);

    const handleSendMessage = useCallback(async () => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage || isFlowRunning) return;

        const userMessage: PGMessage = {
            id: `user-${Date.now()}`,
            user_id: USER_ID,
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

    if (!isOpen) return null;

    return (
        <Card
            ref={chatBoxRef}
            className={`
                absolute transition-none z-[${CHAT_BOX_Z_INDEX}]
                w-96 h-[${CHAT_BOX_HEIGHT}px] shadow-xl bg-white border border-gray-300 rounded-lg backdrop-blur-sm
                ${isDragging ? 'shadow-2xl select-none' : ''}
                flex flex-col overflow-hidden p-0
            `}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            {/* Draggable Header */}
            <ChatHeader
                isFlowRunning={isFlowRunning}
                onClearMessages={handleClearMessages}
                onClose={onClose}
                onMouseDown={handleMouseDown}
                messagesLength={messages.length}
            />

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {!hasChatNodes ? (
                    <ChatWarnings
                        hasChatInputNode={hasChatInputNode}
                        hasChatOutputNode={hasChatOutputNode}
                    />
                ) : (
                    <>
                        {/* Messages Area */}
                        <MessagesArea
                            messages={messages}
                            flowError={flowError}
                            isFlowRunning={isFlowRunning}
                        />

                        {/* Message Input */}
                        <MessageInput
                            message={message}
                            isFlowRunning={isFlowRunning}
                            onMessageChange={handleMessageChange}
                            onKeyPress={handleKeyPress}
                            onSendMessage={handleSendMessage}
                        />
                    </>
                )}
            </div>
        </Card>
    );
};

export default PlaygroundChatBox;
