import React from 'react';
import { textfieldHandleStyles } from '../../styles/handleStyles';

interface TextFieldHandleInputProps {
  label: string;
  description?: string;
  value: any;
  onChange?: (value: string) => void;

  // Config (NEW)
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
}

export const TextFieldHandleInput: React.FC<TextFieldHandleInputProps> = ({
  label,
  description,
  value,
  onChange,
  placeholder,
  multiline = false,
  maxLength,
}) => {
  const handleChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#007bff';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#ccc';
  };

  return (
    <div style={textfieldHandleStyles.container}>
      {label && (
        <label style={textfieldHandleStyles.label}>
          {label}
        </label>
      )}
      {description && (
        <span style={textfieldHandleStyles.description}>
          {description}
        </span>
      )}
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="nodrag"
          style={{ ...textfieldHandleStyles.common, ...textfieldHandleStyles.multiline }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="nodrag"
          style={textfieldHandleStyles.common}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      )}
    </div>
  );
};
