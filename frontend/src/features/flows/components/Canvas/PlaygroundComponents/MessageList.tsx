import React, { useRef } from 'react';
import type { PGMessage } from '../../../types';

interface MessageListProps {
    messages: PGMessage[];
    isFlowRunning: boolean;
    flowError: string | null;
}

const MessageList: React.FC<MessageListProps> = ({
    messages,
    isFlowRunning,
    flowError,
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to latest message
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
    );
};

export default MessageList;
