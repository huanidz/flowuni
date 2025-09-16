import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface MessageInputProps {
    message: string;
    isFlowRunning: boolean;
    onMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyPress: (e: React.KeyboardEvent) => void;
    onSendMessage: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
    message,
    isFlowRunning,
    onMessageChange,
    onKeyPress,
    onSendMessage,
}) => {
    return (
        <div className="flex-shrink-0 border-t p-3 bg-white">
            <div className="flex items-center gap-2">
                <Input
                    value={message}
                    onChange={onMessageChange}
                    onKeyDown={onKeyPress}
                    placeholder={
                        isFlowRunning ? 'Processing...' : 'Type a message...'
                    }
                    className="flex-1"
                    disabled={isFlowRunning}
                />
                <Button
                    onClick={onSendMessage}
                    disabled={!message.trim() || isFlowRunning}
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default MessageInput;
