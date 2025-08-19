import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { TypeDetail } from '@/features/nodes/types';
import { secretTextHandleStyles } from '../../styles/handleStyles';

interface SecretTextHandleInputProps {
    label: string;
    description?: string;
    value: any;
    onChange?: (value: string) => void;
    type_detail: TypeDetail;
    disabled: boolean;
    isWholeAsToolMode?: boolean;
}

export const SecretTextHandleInput: React.FC<SecretTextHandleInputProps> = ({
    label,
    description,
    value,
    onChange,
    type_detail,
    disabled = true,
}) => {
    const hidden = (type_detail as any)?.defaults?.hidden ?? false;
    if (hidden) return null;

    const { multiline = false, allow_visible_toggle = false } =
        type_detail.defaults;

    const [isVisible, setIsVisible] = useState(false);

    const handleChange = (newValue: string) => {
        if (onChange && !disabled) {
            onChange(newValue);
        }
    };

    const handleFocus = (
        e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        if (!disabled) {
            e.target.style.borderColor = '#007bff';
        }
    };

    const handleBlur = (
        e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        if (!disabled) {
            e.target.style.borderColor = '#ccc';
        }
    };

    const getInputStyles = () => {
        const baseStyles = {
            ...secretTextHandleStyles.common,
            ...(multiline ? secretTextHandleStyles.multiline : {}),
        };

        if (disabled) {
            return {
                ...baseStyles,
                opacity: 0.9,
                cursor: 'default',
                backgroundColor: '#f5f5f5',
            };
        }

        return baseStyles;
    };

    const displayValue = disabled ? '' : value || '';
    const maskedValue = disabled ? '' : '•'.repeat(displayValue.length || 1);

    return (
        <div style={secretTextHandleStyles.container}>
            {description && (
                <span
                    style={{
                        ...secretTextHandleStyles.description,
                        opacity: disabled ? 0.5 : 1,
                    }}
                >
                    {description}
                </span>
            )}

            <div style={secretTextHandleStyles.inputContainer}>
                {multiline ? (
                    <Textarea
                        value={isVisible ? displayValue : maskedValue}
                        onChange={e => handleChange(e.target.value)}
                        disabled={disabled}
                        className="nodrag"
                        style={getInputStyles()}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                ) : (
                    <Input
                        type={isVisible ? 'text' : 'password'}
                        value={displayValue}
                        onChange={e => handleChange(e.target.value)}
                        disabled={disabled}
                        className="nodrag"
                        style={getInputStyles()}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                )}

                {allow_visible_toggle && !disabled && (
                    <button
                        type="button"
                        style={secretTextHandleStyles.toggleButton}
                        onClick={() => setIsVisible(!isVisible)}
                    >
                        {isVisible ? '👁️' : '🔒'}
                    </button>
                )}
            </div>
        </div>
    );
};
