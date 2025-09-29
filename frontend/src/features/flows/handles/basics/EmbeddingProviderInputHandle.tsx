import React from 'react';
import type { IOTypeDetail } from '@/features/nodes/types';

interface EmbeddingProviderInputHandleProps {
    label: string;
    description?: string;
    value: any;
    onChange?: (value: any) => void;
    type_detail: IOTypeDetail;
    disabled: boolean;
    isWholeAsToolMode?: boolean;
}

export const EmbeddingProviderInputHandle: React.FC<
    EmbeddingProviderInputHandleProps
> = ({
    label,
    description,
    value,
    onChange,
    type_detail,
    disabled = true,
    isWholeAsToolMode = false,
}) => {
    const hidden = type_detail?.defaults?.hidden ?? false;

    const handleChange = (newValue: any) => {
        if (onChange && !disabled) {
            onChange(newValue);
        }
    };

    return (
        <div style={hidden ? { display: 'none' } : undefined}>
            {description && <span>{description}</span>}
        </div>
    );
};
