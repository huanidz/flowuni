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
> = ({ description, type_detail }) => {
    const hidden = type_detail?.defaults?.hidden ?? false;

    return (
        <div style={hidden ? { display: 'none' } : undefined}>
            {description && <span>{description}</span>}
        </div>
    );
};
