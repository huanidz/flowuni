import React, { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ControlledInputProps {
    type?: 'text' | 'textarea';
    value: any;
    onChange: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onFocus?: (
        e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void;
    onBlur?: (
        e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void;
    debounceMs?: number;
}

export const ControlledInput: React.FC<ControlledInputProps> = ({
    type = 'text',
    value,
    onChange,
    placeholder = '',
    maxLength,
    disabled = false,
    className = '',
    style = {},
    onFocus,
    onBlur,
    debounceMs = 300,
}) => {
    const [localValue, setLocalValue] = useState(value || '');
    const [isFocused, setIsFocused] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastCursorPosition = useRef<number | null>(null);

    // Update local value when prop changes, but only if not focused
    useEffect(() => {
        if (!isFocused && value !== localValue) {
            setLocalValue(value || '');
        }
    }, [value, isFocused, localValue]);

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleChange = (newValue: string) => {
        setLocalValue(newValue);

        // Save cursor position before update
        if (type === 'textarea' && textareaRef.current) {
            lastCursorPosition.current = textareaRef.current.selectionStart;
        } else if (type === 'text' && inputRef.current) {
            lastCursorPosition.current = inputRef.current.selectionStart;
        }

        // Debounce the onChange callback
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            onChange(newValue);
        }, debounceMs);
    };

    const handleFocus = (
        e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setIsFocused(true);
        if (onFocus) {
            onFocus(e);
        }
    };

    const handleBlur = (
        e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setIsFocused(false);

        // Immediately update the parent value on blur
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        onChange(localValue);

        if (onBlur) {
            onBlur(e);
        }
    };

    // Restore cursor position after value update
    useEffect(() => {
        if (lastCursorPosition.current !== null) {
            if (type === 'textarea' && textareaRef.current) {
                textareaRef.current.setSelectionRange(
                    lastCursorPosition.current,
                    lastCursorPosition.current
                );
                lastCursorPosition.current = null;
            } else if (type === 'text' && inputRef.current) {
                inputRef.current.setSelectionRange(
                    lastCursorPosition.current,
                    lastCursorPosition.current
                );
                lastCursorPosition.current = null;
            }
        }
    }, [localValue, type]);

    const commonProps = {
        value: localValue,
        onChange: (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        ) => handleChange(e.target.value),
        placeholder,
        maxLength,
        disabled,
        className,
        style,
        onFocus: handleFocus,
        onBlur: handleBlur,
    };

    if (type === 'textarea') {
        return <Textarea {...commonProps} ref={textareaRef} />;
    }

    return <Input {...commonProps} type="text" ref={inputRef} />;
};
