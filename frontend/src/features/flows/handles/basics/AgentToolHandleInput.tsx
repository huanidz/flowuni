import React from 'react';
import type { IOTypeDetail } from '@/features/nodes/types';

interface AgentToolHandleInputProps {
    label: string;
    description?: string;
    value: any;
    onChange?: (value: string) => void;
    type_detail: IOTypeDetail;
    disabled: boolean;
    isWholeAsToolMode?: boolean;
}

export const AgentToolHandleInput: React.FC<AgentToolHandleInputProps> = ({
    label,
    description,
    value,
    onChange,
    type_detail,
    disabled = true,
}) => {
    const hidden = type_detail?.defaults?.hidden ?? false;

    const handleChange = (newValue: string) => {
        if (onChange && !disabled) {
            onChange(newValue);
        }
    };

    return (
        <div style={hidden ? { display: 'none' } : undefined}>
            {description && <span>{/* {description} */}</span>}
        </div>
    );
};
