import React from 'react';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import ChatSessionItem from './ChatSessionItem';

interface ChatSession {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
}

interface ChatSessionSidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    sessions: ChatSession[];
    onDeleteSession: (id: string) => void;
}

const ChatSessionSidebar: React.FC<ChatSessionSidebarProps> = ({
    isCollapsed,
    onToggle,
    sessions,
    onDeleteSession,
}) => {
    return (
        <div
            className={`bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 ${
                isCollapsed ? 'w-12' : 'w-64'
            }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">
                    Chat Sessions
                </h3>
                {/* Collapse/expand button disabled but kept for future use */}
                {/* <button
                    onClick={onToggle}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? (
                        <ChevronRight size={16} />
                    ) : (
                        <ChevronLeft size={16} />
                    )}
                </button> */}
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
                {/* Collapse/expand feature disabled but kept for future use */}
                {/* {isCollapsed ? (
                    <div className="flex flex-col items-center py-2 space-y-2">
                        {sessions.map(session => (
                            <div
                                key={session.id}
                                className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600"
                                title={session.title}
                            >
                                {session.title.charAt(0).toUpperCase()}
                            </div>
                        ))}
                    </div>
                ) : ( */}
                <div className="p-2 space-y-1">
                    {sessions.map(session => (
                        <ChatSessionItem
                            key={session.id}
                            session={session}
                            onDelete={onDeleteSession}
                        />
                    ))}
                </div>
                {/* )} */}
            </div>
        </div>
    );
};

export default ChatSessionSidebar;
