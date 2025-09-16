import React, { useRef } from 'react';
import MessageBubble from './MessageBubble';
import type { PGMessage } from '../../../types';

interface MessagesAreaProps {
    messages: PGMessage[];
    flowError: string | null;
    isFlowRunning: boolean;
}

const MessagesArea: React.FC<MessagesAreaProps> = ({
    messages,
    flowError,
    isFlowRunning,
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    return (
        <div className="flex-1 overflow-y-auto p-4">
            {flowError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm font-medium">
                        Error: {flowError}
                    </p>
                </div>
            )}

            {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
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
    );
};

export default MessagesArea;
