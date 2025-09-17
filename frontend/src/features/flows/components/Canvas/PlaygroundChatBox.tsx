import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { useNodes, useEdges } from '@xyflow/react';
import type { PlaygroundChatBoxPosition, PGMessage } from '../../types';
import { runFlow } from '../../api';
import type { GetPlaygroundSessionsRequest } from '@/features/playground/types';
import {
    useSessionsWithLastMessage,
    useAddChatMessage,
} from '@/features/playground/hooks';
import { usePlaygroundStore } from '@/features/playground/stores';
import { executeFlowWithSSE } from '@/features/playground/sse';

// Extracted components
import ChatHeader from './PlaygroundComponents/ChatHeader';
import ChatWarnings from './PlaygroundComponents/ChatWarnings';
import MessagesArea from './PlaygroundComponents/MessagesArea';
import MessageInput from './PlaygroundComponents/MessageInput';
import ChatSessionSidebar from './PlaygroundComponents/ChatSessionSidebar';

// Custom hooks
import { useDraggingChatbox } from './PlaygroundComponents/useDraggingChatbox';

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
    NO_TASK_ID_ERROR,
    FLOW_RUN_ERROR,
    FLOW_LOG_PREFIX,
    ROLE_USER,
    ROLE_ASSISTANT,
} from './PlaygroundComponents/constants';

interface PlaygroundChatBoxProps {
    isOpen: boolean;
    onClose: () => void;
    position: PlaygroundChatBoxPosition;
    onPositionChange: (position: PlaygroundChatBoxPosition) => void;
    nodeUpdateHandlers: any;
    flowId: string;
}

const PlaygroundChatBox: React.FC<PlaygroundChatBoxProps> = ({
    isOpen,
    onClose,
    position,
    onPositionChange,
    nodeUpdateHandlers,
    flowId,
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
    const [message, setMessage] = useState('');
    const [isFlowRunning, setIsFlowRunning] = useState(false);
    const [flowError, setFlowError] = useState<string | null>(null);
    // Collapse/expand feature disabled but kept for future use
    // const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const isSidebarCollapsed = false;

    // Chat sessions state using React Query
    const request: GetPlaygroundSessionsRequest = {
        flow_id: flowId,
        page: 1,
        per_page: 20,
    };

    const {
        data: sessionsWithLastMessageData,
        isLoading: isLoadingSessions,
        error: sessionsError,
    } = useSessionsWithLastMessage(request);

    // Playground store state
    const { currentSession, chatMessages, addChatMessage } =
        usePlaygroundStore();

    // Add chat message mutation
    const addChatMessageMutation = useAddChatMessage();

    // Transform ChatMessage to PGMessage for display
    const transformedMessages: PGMessage[] = React.useMemo(() => {
        return chatMessages.map(msg => ({
            id: msg.id,
            user_id: msg.role === ROLE_USER ? USER_ID : BOT_ID,
            message: msg.message,
            timestamp: new Date(msg.created_at),
        }));
    }, [chatMessages]);

    console.log('transformedMessages: ', transformedMessages);

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
    const { isDragging, handleMouseDown } = useDraggingChatbox({
        chatBoxRef,
        position,
        onPositionChange,
    });

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
    }, [transformedMessages]);

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

            // Execute flow with SSE monitoring
            const { eventSource, timeoutId } = executeFlowWithSSE({
                taskId: task_id,
                onFlowRunningChange: setIsFlowRunning,
                onFlowErrorChange: setFlowError,
                cleanupEventSource,
                cleanupTimeout,
                flowExecutionTimeout: FLOW_EXECUTION_TIMEOUT,
                handlers: {
                    onFlowCompleted: async (
                        nodeType: string,
                        inputValues: any
                    ) => {
                        if (
                            nodeType === CHAT_OUTPUT_NODE_TYPE &&
                            inputValues?.message_in
                        ) {
                            // Add to store
                            if (currentSession) {
                                await addChatMessageMutation.mutateAsync({
                                    session_id:
                                        currentSession.user_defined_session_id,
                                    role: ROLE_ASSISTANT,
                                    message: inputValues.message_in,
                                });
                            }
                        }
                    },
                },
            });

            // Store references for cleanup
            eventSourceRef.current = eventSource;
            flowTimeoutRef.current = timeoutId;
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
        cleanupEventSource,
        cleanupTimeout,
        currentSession,
        addChatMessageMutation,
    ]);

    // ===== SESSION FETCHING LOGIC =====
    // Transform sessions data using React Query
    const transformedSessions =
        sessionsWithLastMessageData?.data?.map(session => ({
            id: session.id,
            title: session.title,
            lastMessage: session.last_message,
            timestamp: new Date(session.timestamp),
        })) || [];

    const handleSendMessage = useCallback(async () => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage || isFlowRunning) return;

        // Add user message to store
        if (currentSession) {
            await addChatMessageMutation.mutateAsync({
                session_id: currentSession.user_defined_session_id,
                role: ROLE_USER,
                message: trimmedMessage,
            });
        }

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
        currentSession,
        addChatMessageMutation,
        addChatMessage,
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
                w-[672px] h-[${CHAT_BOX_HEIGHT}px] shadow-xl bg-white border border-gray-300 rounded-lg backdrop-blur-sm
                ${isDragging ? 'shadow-2xl select-none' : ''}
                flex overflow-hidden p-0
            `}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Draggable Header */}
                <ChatHeader
                    isFlowRunning={isFlowRunning}
                    onClose={onClose}
                    onMouseDown={handleMouseDown}
                />

                {/* Content Area with Sidebar */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Sidebar */}
                    <ChatSessionSidebar
                        isCollapsed={isSidebarCollapsed}
                        sessions={transformedSessions}
                        isLoading={isLoadingSessions}
                        error={sessionsError ? sessionsError.message : null}
                        flowId={flowId}
                    />

                    {/* Chat Content */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {!hasChatNodes || !currentSession ? (
                            <ChatWarnings
                                hasChatInputNode={hasChatInputNode}
                                hasChatOutputNode={hasChatOutputNode}
                                hasCurrentSession={!!currentSession}
                            />
                        ) : (
                            <>
                                {/* Messages Area */}
                                <MessagesArea
                                    messages={transformedMessages}
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
                </div>
            </div>
        </Card>
    );
};

export default PlaygroundChatBox;
