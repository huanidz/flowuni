import { ACCESS_TOKEN_KEY } from '@/features/auth/consts';
import useAuthStore from '@/features/auth/store';

const baseURL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';

export const watchUserEvents = (
    userId: number,
    onMessage: (msg: any) => void,
    onError?: (err: Event) => void
) => {
    console.log('watchUserEvents', userId);
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    // Build SSE URL
    const url = new URL(`${baseURL}/user-events/stream/${userId}/events`);
    if (token) {
        url.searchParams.set('token', token);
    }

    const eventSource = new EventSource(url.toString());

    // Connection opened handler
    eventSource.onopen = () => {
        console.log('🔗 SSE connection opened for user:', userId);
    };

    // Message handler
    eventSource.onmessage = event => {
        try {
            const parsed = JSON.parse(event.data);

            if (parsed.event === 'DONE') {
                console.log('SSE event:', parsed, 'DONE -> CLOSED');
                eventSource.close();
            } else {
                console.log('SSE event:', parsed);
                onMessage(parsed);
            }
        } catch (e) {
            console.warn('Failed to parse SSE data:', event.data);
        }
    };

    // Error handler
    eventSource.onerror = err => {
        console.error('SSE error:', err);
        onError?.(err);

        // TODO: close for simple, may handle reconnect in future
        eventSource.close();
    };

    return eventSource;
};

// Keep the old function for backward compatibility during transition
export const watchFlowTestEvents = (
    taskId: string,
    onMessage: (msg: any) => void,
    onError?: (err: Event) => void
) => {
    console.warn(
        'watchFlowTestEvents is deprecated. Use watchUserEvents instead.'
    );

    // Get user ID from auth store
    const auth = useAuthStore.getState();
    const userId = auth.user_id;

    if (!userId) {
        console.error('User ID not found in auth store');
        return null;
    }

    return watchUserEvents(userId, onMessage, onError);
};
