import { ACCESS_TOKEN_KEY } from '@/features/auth/consts';

const baseURL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';

export const watchUserEvents = (
    userId: number,
    onMessage: (msg: any) => void,
    onError?: (err: Event) => void,
    sinceId?: string
) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    // Build SSE URL
    const url = new URL(`${baseURL}/user-events/stream/${userId}/events`);
    if (token) {
        url.searchParams.set('token', token);
    }
    if (sinceId && sinceId !== '0') {
        url.searchParams.set('since_id', sinceId);
    }

    const eventSource = new EventSource(url.toString());

    // Connection opened handler
    eventSource.onopen = () => {
        console.log('🔗 SSE connection opened');
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
