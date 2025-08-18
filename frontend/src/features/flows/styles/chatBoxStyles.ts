export const chatBoxStyles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#1c2a38ff',
        height: '56px',
    },

    headerTitle: {
        fontSize: '16px',
        fontWeight: 'bold' as const,
        color: 'white',
        margin: 0,
    },

    headerActions: {
        display: 'flex',
        gap: '8px',
    },

    iconButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        transition: 'background-color 0.2s',
    },

    messageContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
    },

    messageBubble: {
        padding: '12px',
        borderRadius: '8px',
        maxWidth: '80%',
        wordBreak: 'break-word' as const,
    },

    userMessage: {
        backgroundColor: '#3b82f6',
        color: 'white',
        alignSelf: 'flex-end',
    },

    otherMessage: {
        backgroundColor: '#f1f5f9',
        color: '#334155',
        alignSelf: 'flex-start',
    },

    messageTimestamp: {
        fontSize: '12px',
        color: '#64748b',
        marginTop: '4px',
    },

    sendButton: {
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },

    sendButtonDisabled: {
        backgroundColor: '#94a3b8',
        cursor: 'not-allowed',
    },
};
