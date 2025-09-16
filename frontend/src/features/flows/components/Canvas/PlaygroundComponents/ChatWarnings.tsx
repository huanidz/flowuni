import React from 'react';

interface ChatWarningsProps {
    hasChatInputNode: boolean;
    hasChatOutputNode: boolean;
    hasCurrentSession: boolean;
}

const ChatWarnings: React.FC<ChatWarningsProps> = ({
    hasChatInputNode,
    hasChatOutputNode,
    hasCurrentSession,
}) => {
    return (
        <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4">
                {!hasCurrentSession && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-orange-800 font-medium">
                            Please select or create a Chat Session
                        </p>
                    </div>
                )}
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
                            Need ChatOutput to receive message from flow
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatWarnings;
