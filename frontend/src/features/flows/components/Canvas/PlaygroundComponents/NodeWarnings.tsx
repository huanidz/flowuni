import React from 'react';

interface NodeWarningsProps {
    hasChatInputNode: boolean;
    hasChatOutputNode: boolean;
}

const NodeWarnings: React.FC<NodeWarningsProps> = ({
    hasChatInputNode,
    hasChatOutputNode,
}) => {
    return (
        <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4">
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

export default NodeWarnings;
