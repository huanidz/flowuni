import React from 'react';
import type { IOTypeDetail } from '@/features/nodes/types';
import { booleanHandleStyles } from '../../styles/handleStyles';

interface BooleanHandleInputProps {
    label: string;
    description?: string;
    value: any;
    onChange?: (value: boolean) => void;
    type_detail: IOTypeDetail;
    disabled: boolean;
    isWholeAsToolMode?: boolean;
}

export const BooleanHandleInput: React.FC<BooleanHandleInputProps> = ({
    label,
    description,
    value,
    onChange,
    type_detail,
    disabled = true,
    isWholeAsToolMode = false,
}) => {
    const { hidden = false } = type_detail.defaults || {};

    const handleChange = (checked: boolean) => {
        if (onChange && !disabled) {
            onChange(checked);
        }
    };

    // Don't render if hidden
    if (hidden) {
        return null;
    }

    return (
        <div style={booleanHandleStyles.container}>
            {description && (
                <span
                    style={{
                        ...booleanHandleStyles.description,
                        opacity: disabled ? 0.5 : 1,
                    }}
                >
                    {description}
                </span>
            )}
            <div style={booleanHandleStyles.toggleContainer}>
                <label
                    style={{
                        ...booleanHandleStyles.toggleLabel,
                        opacity: disabled ? 0.5 : 1,
                    }}
                >
                    <input
                        type="checkbox"
                        checked={!!value}
                        onChange={e => handleChange(e.target.checked)}
                        disabled={disabled}
                        style={booleanHandleStyles.toggleInput}
                        className="nodrag"
                    />
                    <span
                        style={{
                            ...booleanHandleStyles.toggleSwitch,
                            ...(disabled
                                ? booleanHandleStyles.disabledToggle
                                : {}),
                            ...(value ? { backgroundColor: '#007bff' } : {}),
                        }}
                    >
                        <span
                            style={{
                                position: 'absolute',
                                top: '2px',
                                left: value ? '18px' : '2px',
                                width: '14px',
                                height: '14px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                transition: 'left 0.2s',
                            }}
                        />
                    </span>
                    <span style={booleanHandleStyles.toggleText}>
                        {value ? 'True' : 'False'}
                    </span>
                </label>
            </div>
        </div>
    );
};
