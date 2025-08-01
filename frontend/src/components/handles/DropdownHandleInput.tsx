import React, { useState } from 'react';

interface DropdownHandleInputProps {
  label: string;
  description?: string;
  value: any;
  onChange?: (value: string | string[]) => void;

  // Config (NEW)
  options: Array<{ label: string; value: string }>;
  multiple?: boolean;
  searchable?: boolean;
}

export const DropdownHandleInput: React.FC<DropdownHandleInputProps> = ({
  label,
  description,
  value,
  onChange,
  options,
  multiple = false,
  searchable = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (newValue: string | string[]) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleItemClick = (optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      handleChange(newValues);
    } else {
      handleChange(optionValue);
      setIsOpen(false);
    }
  };

  const filteredOptions = (options || []).filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayValue = multiple
    ? Array.isArray(value)
      ? value.map(v => (options || []).find(opt => opt.value === v)?.label || v).join(', ')
      : ''
    : (options || []).find(opt => opt.value === value)?.label || value || '';

  const commonStyles: React.CSSProperties = {
    padding: '6px 8px',
    fontSize: '12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
    position: 'relative',
  };

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    e.target.style.borderColor = '#007bff';
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
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
      <div
        style={commonStyles}
        tabIndex={0}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{displayValue || 'Select...'}</span>
          <span>{isOpen ? '▲' : '▼'}</span>
        </div>
        
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            marginTop: '2px',
          }}>
            {searchable && (
              <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  placeholder="Search..."
                  style={{
                    width: '100%',
                    padding: '4px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                />
              </div>
            )}
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '8px', color: '#666', fontStyle: 'italic' }}>
                No options found
              </div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    backgroundColor: multiple && Array.isArray(value) && value.includes(option.value)
                      ? '#e6f3ff'
                      : 'white',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    handleItemClick(option.value);
                  }}
                >
                  {multiple && (
                    <input
                      type="checkbox"
                      checked={Array.isArray(value) && value.includes(option.value)}
                      onChange={() => handleItemClick(option.value)}
                      onClick={e => e.stopPropagation()}
                      style={{ marginRight: '8px' }}
                    />
                  )}
                  {option.label}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};