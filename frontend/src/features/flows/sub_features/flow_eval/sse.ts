import { ACCESS_TOKEN_KEY } from '@/features/auth/consts';

const baseURL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';

export const watchFlowTestEvents = (
    taskId: string,
    onMessage: (msg: any) => void,
    onError?: (err: Event) => void
) => {
    console.log('watchFlowTestEvents', taskId);
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    // Build SSE URL
    const url = new URL(`${baseURL}/flow-test-runs/stream/${taskId}/events`);
    if (token) {
        url.searchParams.set('token', token);
    }

    const eventSource = new EventSource(url.toString());

    // Message handler
    eventSource.onmessage = event => {
        try {
            const parsed = JSON.parse(event.data);

            if (parsed.event === 'DONE') {
                // onMessage(event.data); // Not sure if this is needed
                console.log('SSE event:', parsed, 'DONE -> CLOSED');
                eventSource.close();
            } else {
                onMessage(event.data);
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
