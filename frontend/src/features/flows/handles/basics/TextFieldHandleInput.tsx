import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { TypeDetail } from '@/features/nodes/types';
import { textfieldHandleStyles } from '../../styles/handleStyles';
import { TEXT_FIELD_FORMAT } from '../consts/TextFieldHandleInputConsts';

// Debug counter to track re-renders
let renderCount = 0;

interface TextFieldHandleInputProps {
    label: string;
    description?: string;
    value: any;
    onChange?: (value: string) => void;

    // Config (NEW)
    type_detail: TypeDetail;
    disabled: boolean;
    isWholeAsToolMode?: boolean;
}

export const TextFieldHandleInput: React.FC<TextFieldHandleInputProps> = ({
    label,
    description,
    value,
    onChange,

    type_detail,
    disabled = true,
    isWholeAsToolMode = false,
}) => {
    // Debug: Track re-renders
    renderCount++;
    console.log(
        `[TextFieldHandleInput] Render #${renderCount}, label: ${label}, value: "${value}", disabled: ${disabled}`
    );
    const {
        placeholder: defaultPlaceholder = '',
        multiline: defaultMultiline = false,
        maxLength: defaultMaxLength,
        format: defaultFormat = TEXT_FIELD_FORMAT.PLAIN,
    } = type_detail.defaults;

    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const lastCursorPosition = React.useRef<number | null>(null);

    const handleChange = (newValue: string) => {
        console.log(
            `[TextFieldHandleInput] handleChange called with newValue: "${newValue}", disabled: ${disabled}`
        );

        // Save cursor position before update
        if (defaultMultiline && textareaRef.current) {
            lastCursorPosition.current = textareaRef.current.selectionStart;
        } else if (!defaultMultiline && inputRef.current) {
            lastCursorPosition.current = inputRef.current.selectionStart;
        }

        if (onChange && !disabled) {
            console.log(
                `[TextFieldHandleInput] Calling onChange callback with: "${newValue}"`
            );
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

    // Create combined styles for disabled state
    const getInputStyles = () => {
        const baseStyles = {
            ...textfieldHandleStyles.common,
            ...(defaultMultiline ? textfieldHandleStyles.multiline : {}),
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

    // Restore cursor position after value update
    React.useEffect(() => {
        if (lastCursorPosition.current !== null) {
            if (defaultMultiline && textareaRef.current) {
                textareaRef.current.setSelectionRange(
                    lastCursorPosition.current,
                    lastCursorPosition.current
                );
                lastCursorPosition.current = null;
            } else if (!defaultMultiline && inputRef.current) {
                inputRef.current.setSelectionRange(
                    lastCursorPosition.current,
                    lastCursorPosition.current
                );
                lastCursorPosition.current = null;
            }
        }
    }, [value, defaultMultiline]);

    return (
        <div style={textfieldHandleStyles.container}>
            {description && (
                <span
                    style={{
                        ...textfieldHandleStyles.description,
                        opacity: disabled ? 0.5 : 1,
                    }}
                >
                    {description}
                </span>
            )}
            {defaultMultiline ? (
                <div style={textfieldHandleStyles.jsonEditButtonContainer}>
                    <Textarea
                        ref={textareaRef}
                        value={disabled ? '' : value || ''}
                        onChange={e => {
                            console.log(
                                `[TextFieldHandleInput] Textarea onChange event, current value: "${e.target.value}"`
                            );
                            handleChange(e.target.value);
                        }}
                        placeholder={disabled ? '' : defaultPlaceholder}
                        maxLength={defaultMaxLength}
                        disabled={disabled}
                        className="nodrag"
                        style={getInputStyles()}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                    {defaultFormat === TEXT_FIELD_FORMAT.JSON &&
                        isWholeAsToolMode && (
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(true)}
                                style={textfieldHandleStyles.jsonEditButton}
                            >
                                Edit JSON
                            </button>
                        )}
                </div>
            ) : (
                <Input
                    ref={inputRef}
                    type="text"
                    value={disabled ? '' : value || ''}
                    onChange={e => {
                        console.log(
                            `[TextFieldHandleInput] Input onChange event, current value: "${e.target.value}"`
                        );
                        handleChange(e.target.value);
                    }}
                    placeholder={disabled ? '' : defaultPlaceholder}
                    maxLength={defaultMaxLength}
                    disabled={disabled}
                    className="nodrag"
                    style={getInputStyles()}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
            )}
            {isModalOpen && (
                <div style={textfieldHandleStyles.modalOverlay}>
                    <div style={textfieldHandleStyles.modalContent}>
                        <div style={textfieldHandleStyles.modalHeader}>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={textfieldHandleStyles.modalCloseButton}
                            >
                                Close
                            </button>
                        </div>
                        {/* Modal content will be added here later */}
                    </div>
                </div>
            )}
        </div>
    );
};
