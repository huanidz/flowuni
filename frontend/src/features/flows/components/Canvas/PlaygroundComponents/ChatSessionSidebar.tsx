import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import ChatSessionItem from './ChatSessionItem';
import {
    useCreatePlaygroundSession,
    useChatHistory,
} from '@/features/playground/hooks';
import { usePlaygroundStore } from '@/features/playground/stores';
import type { CreatePlaygroundSessionRequest } from '@/features/playground/types';
import { useDeletePlaygroundSession } from '@/features/playground/hooks';
// Add CSS animation styles
const zoomAnimationStyles = `
  @keyframes zoomInOut {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }
  
  .zoom-animation {
    animation: zoomInOut 0.8s ease-in-out;
  }
`;

interface ChatSession {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
}

interface ChatSessionSidebarProps {
    isCollapsed: boolean;
    sessions: ChatSession[];
    isLoading?: boolean;
    error?: string | null;
    flowId: string;
}

const ChatSessionSidebar: React.FC<ChatSessionSidebarProps> = ({
    isCollapsed,
    sessions,
    isLoading = false,
    error = null,
    flowId,
}) => {
    const createSessionMutation = useCreatePlaygroundSession();
    const [isCreating, setIsCreating] = React.useState(false);
    const [newlyCreatedSessionId, setNewlyCreatedSessionId] = React.useState<
        string | null
    >(null);

    // Get store actions and state
    const {
        currentSession,
        setCurrentSession,
        setChatMessages,
        setIsLoadingChat,
        clearChatMessages,
    } = usePlaygroundStore();

    // Hook to fetch chat history
    const { data: chatHistoryData, isLoading: isChatHistoryLoading } =
        useChatHistory(
            currentSession?.user_defined_session_id || '',
            50 // Number of messages to fetch
        );

    const deleteSessionMutation = useDeletePlaygroundSession();
    // Handle session deletion with current session check
    const handleDeleteSession = async (sessionId: string) => {
        try {
            await deleteSessionMutation.mutateAsync(sessionId);

            // If the deleted session is the current session, clear it from state
            if (currentSession?.user_defined_session_id === sessionId) {
                setCurrentSession(null);
                clearChatMessages();
            } else {
                // Reselect the current session to avoid stale data
                setCurrentSession(currentSession);
            }
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    };

    const handleSessionClick = async (session: ChatSession) => {
        // Check if this is the same as the current session
        const isSameSession =
            currentSession?.user_defined_session_id === session.id;

        // Set the current session in the store
        setCurrentSession({
            user_defined_session_id: session.id,
            flow_id: flowId,
            session_metadata: {
                title: session.title,
            },
            is_playground: true,
            created_at: session.timestamp.toISOString(),
            modified_at: session.timestamp.toISOString(),
        });

        // Only clear messages and set loading state if it's a different session
        if (!isSameSession) {
            // Clear existing chat messages
            setChatMessages([]);
            setIsLoadingChat(true);
        }
    };

    // Effect to update chat messages when chat history data changes
    React.useEffect(() => {
        if (chatHistoryData && chatHistoryData.messages) {
            setChatMessages(chatHistoryData.messages);
            setIsLoadingChat(false);
        }
    }, [chatHistoryData, setChatMessages, setIsLoadingChat]);

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
            const newSession = await createSessionMutation.mutateAsync(request);
            if (newSession && newSession.user_defined_session_id) {
                setNewlyCreatedSessionId(newSession.user_defined_session_id);
                // Clear the newly created session ID after animation completes
                setTimeout(() => {
                    setNewlyCreatedSessionId(null);
                }, 1000); // Animation duration + a bit extra
            }
        } catch (error) {
            console.error('Error creating session:', error);
        } finally {
            setIsCreating(false);
        }
    };
    // Inject styles into document head
    React.useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.textContent = zoomAnimationStyles;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

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
                    {isCreating || createSessionMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Plus size={16} />
                    )}
                </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
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
                                onDelete={handleDeleteSession}
                                isNew={session.id === newlyCreatedSessionId}
                                isSelected={
                                    currentSession?.user_defined_session_id ===
                                    session.id
                                }
                                onClick={handleSessionClick}
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
