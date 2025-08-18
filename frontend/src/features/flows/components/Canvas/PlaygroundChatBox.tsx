import React from 'react';

interface PlaygroundChatBoxProps {
    isOpen: boolean;
    onClose: () => void;
    isNodeSidebarOpen: boolean;
}

const PlaygroundChatBox: React.FC<PlaygroundChatBoxProps> = ({
    isOpen,
    onClose,
    isNodeSidebarOpen,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className={`
                absolute top-4 bg-white border border-gray-200 rounded-lg shadow-lg
                transition-all duration-300 ease-in-out z-10
                ${isNodeSidebarOpen ? 'right-80' : 'right-4'}
                w-80 h-96
            `}
        >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                    Playground
                </h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
            <div className="p-4 h-full overflow-auto">
                {/* Empty content for now */}
                <div className="flex items-center justify-center h-full text-gray-500">
                    Chat content will appear here
                </div>
            </div>
        </div>
    );
};

export default PlaygroundChatBox;
