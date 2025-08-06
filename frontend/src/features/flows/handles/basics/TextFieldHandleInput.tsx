import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { TypeDetail } from '@/features/nodes/types';
import { textfieldHandleStyles } from '../../styles/handleStyles';

interface TextFieldHandleInputProps {
  label: string;
  description?: string;
  value: any;
  onChange?: (value: string) => void;

  // Config (NEW)
  type_detail: TypeDetail;
  disabled: boolean;
}

export const TextFieldHandleInput: React.FC<TextFieldHandleInputProps> = ({
  label,
  description,
  value,
  onChange,

  type_detail,
  disabled = true
}) => {

  const {
    placeholder: defaultPlaceholder = "",
    multiline: defaultMultiline = false,
    maxLength: defaultMaxLength
  } = type_detail.defaults;

  const handleChange = (newValue: string) => {
    if (onChange && !disabled) {
      onChange(newValue);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!disabled) {
      e.target.style.borderColor = '#007bff';
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!disabled) {
      e.target.style.borderColor = '#ccc';
    }
  };

  // Create combined styles for disabled state
  const getInputStyles = () => {
    const baseStyles = {
      ...textfieldHandleStyles.common,
      ...(defaultMultiline ? textfieldHandleStyles.multiline : {})
    };

    if (disabled) {
      return {
        ...baseStyles,
        opacity: 0.9,
        cursor: 'default',
        backgroundColor: '#f5f5f5'
      };
    }

    return baseStyles;
  };

  return (
    <div style={textfieldHandleStyles.container}>
      {description && (
        <span style={{
          ...textfieldHandleStyles.description,
          opacity: disabled ? 0.5 : 1
        }}>
          {description}
        </span>
      )}
      {defaultMultiline ? (
        <Textarea
          value={disabled ? '' : (value || '')}
          onChange={e => handleChange(e.target.value)}
          placeholder={disabled ? '' : defaultPlaceholder}
          maxLength={defaultMaxLength}
          disabled={disabled}
          className="nodrag"
          style={getInputStyles()}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      ) : (
        <Input
          type="text"
          value={disabled ? '' : (value || '')}
          onChange={e => handleChange(e.target.value)}
          placeholder={disabled ? '' : defaultPlaceholder}
          maxLength={defaultMaxLength}
          disabled={disabled}
          className="nodrag"
          style={getInputStyles()}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      )}
    </div>
  );
};