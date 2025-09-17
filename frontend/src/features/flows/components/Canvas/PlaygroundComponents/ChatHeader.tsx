import React from 'react';
import { CardHeader } from '@/components/ui/card';
import { X } from 'lucide-react';
import { chatBoxStyles } from '@/features/flows/styles/chatBoxStyles';

interface ChatHeaderProps {
    isFlowRunning: boolean;
    onClose: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
    isFlowRunning,
    onClose,
    onMouseDown,
}) => {
    return (
        <CardHeader
            style={chatBoxStyles.header}
            className="cursor-move flex-shrink-0 p-0 m-0 border-b"
            onMouseDown={onMouseDown}
        >
            <div className="flex items-center">
                <div style={chatBoxStyles.headerTitle}>
                    Chat Playground {isFlowRunning && '(Running...)'}
                </div>
            </div>
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
    );
};

export default ChatHeader;
