import React from 'react';

interface TextFieldHandleInputProps {
  label: string;
  description?: string;
  value: any;
  onChange?: (value: string) => void;
  nodeId?: string;
  parameterName?: string;

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
  nodeId,
  parameterName,
  placeholder,
  multiline = false,
  maxLength,
}) => {
  const handleChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  const commonStyles: React.CSSProperties = {
    padding: '6px 8px',
    fontSize: '12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
    resize: 'vertical',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#007bff';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#ccc';
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        fontSize: '12px',
        width: '100%',
      }}
    >
      {label && (
        <label
          style={{ marginBottom: '4px', fontWeight: 'bold', color: '#333' }}
        >
          {label}
        </label>
      )}
      {description && (
        <span style={{ marginBottom: '4px', color: '#666', fontSize: '11px' }}>
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
          style={{ ...commonStyles, minHeight: '60px' }}
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
          style={commonStyles}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      )}
    </div>
  );
};
