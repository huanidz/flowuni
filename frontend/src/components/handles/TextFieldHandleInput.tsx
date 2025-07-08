import React from "react";

interface TextFieldHandleInputProps {
  label: string;
  description?: string;
  value: any;
  onChange?: (value: string) => void;
}

export const TextFieldHandleInput: React.FC<TextFieldHandleInputProps> = ({
  label,
  description,
  value,
  onChange,
}) => {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
        {label}
        {description && (
          <span style={{ color: '#666', fontSize: '10px' }}>
            {' '}({description})
          </span>
        )}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="nodrag"
        style={{ width: '90%', padding: '4px' }}
      />
    </div>
  );
};
