import { nodeStyles } from './nodeStyles';

/**
 * Get status badge styles based on execution status
 * @param status - The execution status string
 * @returns CSS properties object for the status badge
 */
export const getStatusBadgeStyles = (status: string) => {
    const baseStyles = {
        ...nodeStyles.header.statusBadge,
    };

    switch (status?.toLowerCase()) {
        case 'draft':
            return {
                ...baseStyles,
                backgroundColor: 'rgba(107, 114, 128, 0.2)',
                color: '#6b7280',
                border: '1px solid rgba(107, 114, 128, 0.8)',
            };
        case 'queued':
            return {
                ...baseStyles,
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.8)',
            };
        case 'running':
            return {
                ...baseStyles,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#3b82f6',
                border: '1px solid rgba(59, 130, 246, 0.8)',
            };
        case 'completed':
            return {
                ...baseStyles,
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.8)',
            };
        case 'failed':
            return {
                ...baseStyles,
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.8)',
            };
        case 'skipped':
            return {
                ...baseStyles,
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                color: '#8b5cf6',
                border: '1px solid rgba(139, 92, 246, 0.8)',
            };
        default:
            return {
                ...baseStyles,
                backgroundColor: 'rgba(107, 114, 128, 0.2)',
                color: '#6b7280',
                border: '1px solid rgba(107, 114, 128, 0.8)',
            };
    }
};
