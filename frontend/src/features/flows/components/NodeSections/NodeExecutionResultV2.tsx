import React, { useState } from 'react';
import { Copy, Check, ChevronRight, ChevronDown } from 'lucide-react';
import { executionResultStyles } from '@/features/flows/styles/nodeSectionStyles';

interface NodeExecutionResultV2Props {
    result?: string | null;
    status?: string;
}

export const NodeExecutionResultV2: React.FC<NodeExecutionResultV2Props> = ({
    result,
    status = 'completed',
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Don't show if no result
    if (!result) return null;

    // Get status configuration from external styles
    const statusConfig =
        executionResultStyles.status[
            status as keyof typeof executionResultStyles.status
        ] || executionResultStyles.status.completed;

    // Copy to clipboard function
    const handleCopy = async () => {
        if (result) {
            try {
                await navigator.clipboard.writeText(result);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
            }
        }
    };

    // Disable ReactFlow interactions when mouse enters the scrollable area
    const handleMouseEnter = () => {
        const reactFlowWrapper = document.querySelector(
            '.react-flow__renderer'
        );
        if (reactFlowWrapper) {
            (reactFlowWrapper as HTMLElement).style.pointerEvents = 'none';
        }
    };

    // Re-enable ReactFlow interactions when mouse leaves
    const handleMouseLeave = () => {
        const reactFlowWrapper = document.querySelector(
            '.react-flow__renderer'
        );
        if (reactFlowWrapper) {
            (reactFlowWrapper as HTMLElement).style.pointerEvents = 'auto';
        }
    };

    // Handle wheel events to prevent interference with ReactFlow
    const handleWheelCapture = (e: React.WheelEvent) => {
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        target.scrollTop += e.deltaY;
    };

    // Check if a value is a valid JSON object or array
    const isJsonValue = (value: any): boolean => {
        if (typeof value === 'object' && value !== null) {
            return true;
        }
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return typeof parsed === 'object' && parsed !== null;
            } catch {
                return false;
            }
        }
        return false;
    };

    // Parse JSON string value
    const parseJsonValue = (value: any): any => {
        if (typeof value === 'object' && value !== null) {
            return value;
        }
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        return value;
    };

    // Render a value as a card or sub-cards
    const renderValueCard = (
        key: string,
        value: any,
        depth: number = 0
    ): React.ReactNode => {
        const isJson = isJsonValue(value);
        const parsedValue = isJson ? parseJsonValue(value) : value;

        // Base card styles with depth-based indentation
        const cardStyle = {
            backgroundColor: depth === 0 ? '#f0fdf4' : '#fafafa',
            border: depth === 0 ? '1px solid #bbf7d0' : '1px solid #e5e5e5',
            borderRadius: '6px',
            padding: '12px',
            marginLeft: depth > 0 ? '16px' : '0px',
        };

        const keyStyle = {
            fontWeight: 'bold',
            marginBottom: '4px',
            color: depth === 0 ? '#166534' : '#374151',
        };

        if (isJson && typeof parsedValue === 'object') {
            if (Array.isArray(parsedValue)) {
                // Handle arrays
                return (
                    <div key={key} style={cardStyle}>
                        <div style={keyStyle}>{key} (Array):</div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                            }}
                        >
                            {parsedValue.map((item, index) =>
                                renderValueCard(`[${index}]`, item, depth + 1)
                            )}
                        </div>
                    </div>
                );
            } else {
                // Handle objects
                return (
                    <div key={key} style={cardStyle}>
                        <div style={keyStyle}>{key} (Object):</div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                            }}
                        >
                            {Object.entries(parsedValue).map(
                                ([subKey, subValue]) =>
                                    renderValueCard(subKey, subValue, depth + 1)
                            )}
                        </div>
                    </div>
                );
            }
        } else {
            // Handle primitive values
            return (
                <div key={key} style={cardStyle}>
                    <div style={keyStyle}>{key}:</div>
                    <div
                        style={{
                            color: depth === 0 ? '#14532d' : '#6b7280',
                            wordBreak: 'break-word',
                        }}
                    >
                        {String(parsedValue)}
                    </div>
                </div>
            );
        }
    };

    // Parse result to extract output values or error
    const parseResult = () => {
        if (!result) return { outputValues: null, error: null };

        try {
            const parsed = JSON.parse(result);

            // Check if it's an error case
            if (parsed.event === 'failed' && parsed.data && parsed.data.error) {
                return { outputValues: null, error: parsed.data.error };
            }

            // Check if it's a success case with output_values
            if (parsed.data && parsed.data.output_values) {
                return { outputValues: parsed.data.output_values, error: null };
            }

            return { outputValues: null, error: null };
        } catch (e) {
            console.error('Failed to parse result JSON:', e);
            return { outputValues: null, error: null };
        }
    };

    const { outputValues, error } = parseResult();

    return (
        <div style={executionResultStyles.section}>
            <div
                style={executionResultStyles.sectionTitle}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span style={statusConfig.iconStyle}>
                    {statusConfig.iconText}
                </span>
                {isExpanded ? (
                    <ChevronDown size={16} style={{ marginRight: '6px' }} />
                ) : (
                    <ChevronRight size={16} style={{ marginRight: '6px' }} />
                )}
                {statusConfig.title}
                {result && isExpanded && (
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            handleCopy();
                        }}
                        style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'inherit',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={e => {
                            (
                                e.currentTarget as HTMLElement
                            ).style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseLeave={e => {
                            (
                                e.currentTarget as HTMLElement
                            ).style.backgroundColor = 'transparent';
                        }}
                        title={isCopied ? 'Copied!' : 'Copy to clipboard'}
                    >
                        {isCopied ? (
                            <Check size={14} style={{ color: '#22c55e' }} />
                        ) : (
                            <Copy size={14} />
                        )}
                    </button>
                )}
            </div>

            {isExpanded && (
                <div
                    style={{
                        ...executionResultStyles.executionResultContent,
                        ...statusConfig.contentStyle,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onWheelCapture={handleWheelCapture}
                >
                    {status === 'running' ? (
                        'Execution in progress...'
                    ) : error ? (
                        <div
                            style={{
                                backgroundColor: '#fee2e2',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                padding: '12px',
                                color: '#991b1b',
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: 'bold',
                                    marginBottom: '4px',
                                }}
                            >
                                Error:
                            </div>
                            <div>{error}</div>
                        </div>
                    ) : outputValues ? (
                        Object.entries(outputValues).map(([key, value]) =>
                            renderValueCard(key, value, 0)
                        )
                    ) : (
                        'No output'
                    )}
                </div>
            )}
        </div>
    );
};
