import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Eye, EyeOff } from 'lucide-react';
import type { IOTypeDetail } from '@/features/nodes/types';
import { secretTextHandleStyles } from '../../styles/handleStyles';

interface SecretTextHandleInputProps {
    label: string;
    description?: string;
    value: any;
    onChange?: (value: string) => void;
    type_detail: IOTypeDetail;
    disabled: boolean;
    isWholeAsToolMode?: boolean;
}

export const SecretTextHandleInput: React.FC<SecretTextHandleInputProps> = ({
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
                cursor: 'not-allowed',
                backgroundColor: '#f5f5f5',
            };
        }

        return baseStyles;
    };

    const displayValue = disabled ? '' : value || '';
    const maskedValue = disabled ? '' : '•'.repeat(displayValue.length || 8);

    return (
        <div style={secretTextHandleStyles.container}>
            {description && (
                <label
                    style={{
                        ...secretTextHandleStyles.description,
                        opacity: disabled ? 0.6 : 1,
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: disabled ? '#6b7280' : '#374151',
                    }}
                >
                    {description}
                </label>
            )}

            <div
                style={{
                    ...secretTextHandleStyles.inputContainer,
                    position: 'relative',
                }}
            >
                {multiline ? (
                    <Textarea
                        value={isVisible ? displayValue : maskedValue}
                        onChange={e => handleChange(e.target.value)}
                        disabled={disabled}
                        className="nodrag"
                        style={getInputStyles()}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder={disabled ? '' : 'Enter secret text...'}
                    />
                ) : (
                    <Input
                        type={isVisible ? 'text' : 'password'}
                        value={displayValue}
                        onChange={e => handleChange(e.target.value)}
                        disabled={disabled}
                        className="nodrag"
                        style={{
                            ...getInputStyles(),
                            paddingRight:
                                allow_visible_toggle && !disabled
                                    ? '2.5rem'
                                    : undefined,
                        }}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder={disabled ? '' : 'Enter secret text...'}
                    />
                )}

                {allow_visible_toggle && !disabled && (
                    <button
                        type="button"
                        onClick={() => setIsVisible(!isVisible)}
                        style={{
                            position: 'absolute',
                            right: '0.5rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6b7280',
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.color = '#374151';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.color = '#6b7280';
                        }}
                        aria-label={
                            isVisible ? 'Hide password' : 'Show password'
                        }
                        tabIndex={-1}
                    >
                        {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
};
