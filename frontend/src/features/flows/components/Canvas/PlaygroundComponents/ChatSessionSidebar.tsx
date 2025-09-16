import React from 'react';
import { ChevronLeft, ChevronRight, MoreVertical, Plus } from 'lucide-react';
import ChatSessionItem from './ChatSessionItem';
import { useCreatePlaygroundSession } from '@/features/playground/hooks';
import type { CreatePlaygroundSessionRequest } from '@/features/playground/types';

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
    isLoading?: boolean;
    error?: string | null;
    flowId: string;
}

const ChatSessionSidebar: React.FC<ChatSessionSidebarProps> = ({
    isCollapsed,
    onToggle,
    sessions,
    onDeleteSession,
    isLoading = false,
    error = null,
    flowId,
}) => {
    const createSessionMutation = useCreatePlaygroundSession();
    const [isCreating, setIsCreating] = React.useState(false);

    const handleCreateSession = async () => {
        if (isCreating || createSessionMutation.isPending) return;

        try {
            setIsCreating(true);

            // Add a fake waiting period of 200-500ms to prevent spamming
            const delay = Math.floor(Math.random() * 300) + 200; // Random delay between 200-500ms
            await new Promise(resolve => setTimeout(resolve, delay));

            const request: CreatePlaygroundSessionRequest = {
                flow_id: flowId,
                session_metadata: {
                    title: `Session ${new Date().toLocaleDateString()}`,
                },
            };
            await createSessionMutation.mutateAsync(request);
        } catch (error) {
            console.error('Error creating session:', error);
        } finally {
            setIsCreating(false);
        }
    };
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
                <button
                    onClick={handleCreateSession}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Create new session"
                    disabled={createSessionMutation.isPending || isCreating}
                >
                    <Plus size={16} />
                </button>
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
                    {isLoading ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 w-4 h-4 mr-2"></div>
                            <span className="text-xs text-gray-500">
                                Loading sessions...
                            </span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-4">
                            <p className="text-xs text-red-500">{error}</p>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-xs text-gray-500">
                                No sessions yet
                            </p>
                        </div>
                    ) : (
                        sessions.map(session => (
                            <ChatSessionItem
                                key={session.id}
                                session={session}
                                onDelete={onDeleteSession}
                            />
                        ))
                    )}
                </div>
                {/* )} */}
            </div>
        </div>
    );
};

export default ChatSessionSidebar;
