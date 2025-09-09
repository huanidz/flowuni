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

    const clampValue = (val: number): number => {
        let clampedValue = val;

        // Apply min constraint
        if (defaultMinValue !== undefined && clampedValue < defaultMinValue) {
            clampedValue = defaultMinValue;
        }

        // Apply max constraint
        if (defaultMaxValue !== undefined && clampedValue > defaultMaxValue) {
            clampedValue = defaultMaxValue;
        }

        return clampedValue;
    };

    const handleChange = (newValue: string) => {
        // Only allow numbers, decimal point, negative sign, and empty string
        if (newValue === '' || /^-?\d*\.?\d*$/.test(newValue)) {
            setInputValue(newValue);
        }
    };

    const processAndApplyValue = (inputStr: string) => {
        // Parse the value
        let parsedValue: number = 0;

        if (inputStr.trim() === '' || inputStr === '-') {
            parsedValue = 0;
        } else {
            parsedValue = parseFloat(inputStr);
            if (isNaN(parsedValue)) {
                parsedValue = 0;
            }
        }

        // Apply integer constraint if needed
        if (defaultIntegerOnly) {
            parsedValue = Math.round(parsedValue);
        }

        // Apply min/max constraints
        const clampedValue = clampValue(parsedValue);

        setInternalValue(clampedValue);
        setInputValue(clampedValue.toString());

        // Emit change to parent
        if (onChange && !disabled) {
            onChange(clampedValue);
        }
    };

    const increment = () => {
        if (disabled) return;

        const newValue = clampValue(internalValue + (defaultStep || 1));

        setInternalValue(newValue);
        setInputValue(newValue.toString());

        if (onChange) {
            onChange(newValue);
        }
    };

    const decrement = () => {
        if (disabled) return;

        const newValue = clampValue(internalValue - (defaultStep || 1));

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
        // Process and apply constraints when input loses focus
        processAndApplyValue(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Apply constraints when user presses Enter
        if (e.key === 'Enter') {
            processAndApplyValue(inputValue);
        }
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
                    onKeyDown={handleKeyDown}
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
