import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { PGMessage } from '../../../types';

interface MessageBubbleProps {
    message: PGMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    return (
        <div className={`mb-4 ${message.user_id === 1 ? 'text-right' : ''}`}>
            <div
                className={`
                    inline-block p-3 rounded-lg max-w-[80%] break-words
                    ${
                        message.user_id === 1
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                    }
                `}
            >
                <ReactMarkdown>{message.message}</ReactMarkdown>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
                {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                })}
            </div>
        </div>
    );
};

export default MessageBubble;
