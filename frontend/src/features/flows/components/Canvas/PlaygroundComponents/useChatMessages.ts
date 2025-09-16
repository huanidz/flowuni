import { useState, useCallback } from 'react';
import type { PGMessage } from '../../../types';
import { useChatFlowExecution } from './useChatFlowExecution';

interface UseChatMessagesProps {
    chatInputNodeId?: string;
    updateNodeInputData: (nodeId: string, key: string, value: any) => void;
    onNewMessage?: (message: PGMessage) => void;
}

interface UseChatMessagesReturn {
    message: string;
    messages: PGMessage[];
    isFlowRunning: boolean;
    flowError: string | null;
    handleMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleKeyPress: (e: React.KeyboardEvent) => void;
    handleSendMessage: () => Promise<void>;
    handleClearMessages: () => void;
}

export const useChatMessages = ({
    chatInputNodeId,
    updateNodeInputData,
    onNewMessage,
}: UseChatMessagesProps): UseChatMessagesReturn => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<PGMessage[]>([]);

    const handleNewMessage = useCallback(
        (message: PGMessage) => {
            setMessages(prev => [...prev, message]);
            if (onNewMessage) {
                onNewMessage(message);
            }
        },
        [onNewMessage]
    );

    const { isFlowRunning, flowError, executeFlow } = useChatFlowExecution({
        onMessageReceived: handleNewMessage,
    });

    const handleClearMessages = useCallback(() => {
        setMessages([]);
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
        if (chatInputNodeId) {
            updateNodeInputData(chatInputNodeId, 'message_in', trimmedMessage);
        }

        // Execute flow
        await executeFlow();

        // Clear input node after execution
        if (chatInputNodeId) {
            updateNodeInputData(chatInputNodeId, 'message_in', '');
        }
    }, [
        message,
        isFlowRunning,
        chatInputNodeId,
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
            if (chatInputNodeId) {
                updateNodeInputData(chatInputNodeId, 'message_in', value);
            }
        },
        [chatInputNodeId, updateNodeInputData]
    );

    return {
        message,
        messages,
        isFlowRunning,
        flowError,
        handleMessageChange,
        handleKeyPress,
        handleSendMessage,
        handleClearMessages,
    };
};

export default useChatMessages;
