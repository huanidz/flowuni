import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { useNodes, useEdges } from '@xyflow/react';
import type { PlaygroundChatBoxPosition, PGMessage } from '../../types';
import { NODE_EXECUTION_STATE } from '../../consts';

// Import extracted components and hooks
import {
    ChatHeader,
    NodeWarnings,
    MessageList,
    MessageInput,
    useChatDrag,
    useChatMessages,
} from './PlaygroundComponents/index.ts';

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

    // Refs
    const chatBoxRef = useRef<HTMLDivElement>(null);
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

    // Close event source when chat closes
    useEffect(() => {
        if (!isOpen && eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            if (flowTimeoutRef.current) {
                clearTimeout(flowTimeoutRef.current);
                flowTimeoutRef.current = null;
            }
        }
    }, [isOpen]);

    // Use extracted hooks
    const { isDragging, handleMouseDown } = useChatDrag({ onPositionChange });
    const {
        message,
        messages,
        isFlowRunning,
        flowError,
        handleMessageChange,
        handleKeyPress,
        handleSendMessage,
        handleClearMessages,
    } = useChatMessages({
        chatInputNodeId: chatInputNode?.id,
        updateNodeInputData,
    });

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
            <ChatHeader
                isFlowRunning={isFlowRunning}
                onClearMessages={handleClearMessages}
                onClose={onClose}
                messagesLength={messages.length}
                onMouseDown={handleMouseDown}
            />

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {showWarnings ? (
                    <NodeWarnings
                        hasChatInputNode={hasChatInputNode}
                        hasChatOutputNode={hasChatOutputNode}
                    />
                ) : (
                    <>
                        {/* Messages Area */}
                        <MessageList
                            messages={messages}
                            isFlowRunning={isFlowRunning}
                            flowError={flowError}
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
