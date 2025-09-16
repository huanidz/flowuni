import React, { useState } from 'react';
import { MoreVertical, Trash2 } from 'lucide-react';

interface ChatSession {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
}

interface ChatSessionItemProps {
    session: ChatSession;
    onDelete: (id: string) => void;
    isNew?: boolean;
    isSelected?: boolean;
    onClick?: (session: ChatSession) => void;
}

const ChatSessionItem: React.FC<ChatSessionItemProps> = ({
    session,
    onDelete,
    isNew = false,
    isSelected = false,
    onClick,
}) => {
    const [showMenu, setShowMenu] = useState(false);

    const handleDelete = () => {
        // Empty function for now as requested
        onDelete(session.id);
        setShowMenu(false);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div
            className={`group relative p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors ${isNew ? 'zoom-animation' : ''} ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
            onClick={() => onClick?.(session)}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                        {session.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                            {formatTime(session.timestamp)}
                        </span>
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="More options"
                        >
                            <MoreVertical size={14} />
                        </button>
                    </div>
                </div>
                <p className="text-xs text-gray-600 truncate">
                    {session.lastMessage}
                </p>
            </div>

            {/* Dropdown Menu */}
            {showMenu && (
                <div className="absolute right-2 top-10 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
                    <button
                        onClick={handleDelete}
                        className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 size={14} className="mr-2" />
                        Delete
                    </button>
                </div>
            )}

            {/* Click outside to close menu */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowMenu(false)}
                />
            )}
        </div>
    );
};

export default ChatSessionItem;
