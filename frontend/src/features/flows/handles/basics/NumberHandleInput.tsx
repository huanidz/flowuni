import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { IOTypeDetail } from '@/features/nodes/types';
import { numberHandleStyles } from '../../styles/handleStyles';

interface NumberHandleInputProps {
    label: string;
    description?: string;
    value: any;
    onChange?: (value: number) => void;
    type_detail: IOTypeDetail;
    disabled: boolean;
    isWholeAsToolMode?: boolean;
}

export const NumberHandleInput: React.FC<NumberHandleInputProps> = ({
    label,
    description,
    value,
    onChange,
    type_detail,
    disabled = true,
    isWholeAsToolMode = false,
}) => {
    const {
        min_value: defaultMinValue,
        max_value: defaultMaxValue,
        step: defaultStep = 1,
        integer_only: defaultIntegerOnly = false,
        hidden = false,
    } = type_detail.defaults || {};

    const [internalValue, setInternalValue] = useState<number>(value || 0);
    const [inputValue, setInputValue] = useState<string>(
        value?.toString() || ''
    );

    // Update internal value when prop changes
    useEffect(() => {
        if (value !== undefined && value !== null) {
            setInternalValue(value);
            setInputValue(value.toString());
        }
    }, [value]);

    const handleChange = (newValue: string) => {
        setInputValue(newValue);

        // Parse the value
        let parsedValue: number | null = null;
        if (newValue.trim() === '') {
            parsedValue = defaultIntegerOnly ? 0 : 0;
        } else {
            parsedValue = parseFloat(newValue);
            if (isNaN(parsedValue)) {
                parsedValue = defaultIntegerOnly ? 0 : 0;
            }
        }

        // Apply integer constraint if needed
        if (defaultIntegerOnly && parsedValue !== null) {
            parsedValue = Math.round(parsedValue);
        }

        // Apply min/max constraints
        if (parsedValue !== null) {
            if (
                defaultMinValue !== undefined &&
                parsedValue < defaultMinValue
            ) {
                parsedValue = defaultMinValue;
            }
            if (
                defaultMaxValue !== undefined &&
                parsedValue !== null &&
                parsedValue > defaultMaxValue
            ) {
                parsedValue = defaultMaxValue;
            }
        }

        setInternalValue(parsedValue || 0);

        // Emit change to parent
        if (onChange && !disabled) {
            onChange(parsedValue || 0);
        }
    };

    const increment = () => {
        if (disabled) return;

        let newValue = internalValue + (defaultStep || 1);

        // Apply constraints
        if (defaultMaxValue !== undefined && newValue > defaultMaxValue) {
            newValue = defaultMaxValue;
        }

        setInternalValue(newValue);
        setInputValue(newValue.toString());

        if (onChange) {
            onChange(newValue);
        }
    };

    const decrement = () => {
        if (disabled) return;

        let newValue = internalValue - (defaultStep || 1);

        // Apply constraints
        if (defaultMinValue !== undefined && newValue < defaultMinValue) {
            newValue = defaultMinValue;
        }

        setInternalValue(newValue);
        setInputValue(newValue.toString());

        if (onChange) {
            onChange(newValue);
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        if (!disabled) {
            e.target.select();
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        // Ensure value is within bounds when input loses focus
        handleChange(e.target.value);
    };

    // Don't render if hidden
    if (hidden) {
        return null;
    }

    return (
        <div style={numberHandleStyles.container}>
            {description && (
                <span
                    style={{
                        ...numberHandleStyles.description,
                        opacity: disabled ? 0.5 : 1,
                    }}
                >
                    {description}
                </span>
            )}

            <div style={numberHandleStyles.inputContainer}>
                <Input
                    type="text"
                    value={inputValue}
                    onChange={e => handleChange(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    disabled={disabled}
                    placeholder={disabled ? '' : '0'}
                    style={numberHandleStyles.input}
                    className="nodrag"
                />

                {!disabled && (
                    <div style={numberHandleStyles.buttonContainer}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={increment}
                            disabled={
                                disabled ||
                                (defaultMaxValue !== undefined &&
                                    internalValue >= defaultMaxValue)
                            }
                            style={numberHandleStyles.button}
                            className="h-6 w-6 p-0 nodrag"
                        >
                            ▲
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={decrement}
                            disabled={
                                disabled ||
                                (defaultMinValue !== undefined &&
                                    internalValue <= defaultMinValue)
                            }
                            style={numberHandleStyles.button}
                            className="h-6 w-6 p-0 nodrag"
                        >
                            ▼
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
