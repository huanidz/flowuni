import React, { useState } from 'react';
import dropdownHandleStyles from '../../styles/handleStyles';

interface DropdownHandleInputProps {
  label: string;
  description?: string;
  value: any;
  onChange?: (value: string | string[]) => void;

  // Config (NEW)
  type_detail: {
    defaults?: {
      multiple?: boolean;
      searchable?: boolean;
      options?: Array<{ label: string; value: string }>;
    }
  };
}

export const DropdownHandleInput: React.FC<DropdownHandleInputProps> = ({
  label,
  description,
  value,
  onChange,
  type_detail
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const {
    multiple: defaultMultiple = false,
    searchable: defaultSearchable = false,
    options: defaultOptions = []
  } = type_detail.defaults || {};

  const handleChange = (newValue: string | string[]) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleItemClick = (optionValue: string) => {
    if (defaultMultiple) {
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

  const filteredOptions = (defaultOptions || []).filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayValue = defaultMultiple
    ? Array.isArray(value)
      ? value.map(v => (defaultOptions || []).find(opt => opt.value === v)?.label || v).join(', ')
      : ''
    : (defaultOptions || []).find(opt => opt.value === value)?.label || value || '';

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    e.target.style.borderColor = '#007bff';
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    e.target.style.borderColor = '#ccc';
  };

  return (
    <div style={dropdownHandleStyles.container}>
      {label && (
        <label style={dropdownHandleStyles.label}>
          {label}
        </label>
      )}
      {description && (
        <span style={dropdownHandleStyles.description}>
          {description}
        </span>
      )}
      <div
        style={dropdownHandleStyles.common}
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
        <div style={dropdownHandleStyles.flexRow}>
          <span>{displayValue || 'Select...'}</span>
          <span>{isOpen ? '▲' : '▼'}</span>
        </div>
        
        {isOpen && (
          <div style={dropdownHandleStyles.dropdown}>
            {defaultSearchable && (
              <div style={dropdownHandleStyles.searchContainer}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  placeholder="Search..."
                  style={dropdownHandleStyles.searchInput}
                />
              </div>
            )}
            {filteredOptions.length === 0 ? (
              <div style={dropdownHandleStyles.noOptions}>
                No options found
              </div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  style={{
                    ...dropdownHandleStyles.option,
                    ...(defaultMultiple && Array.isArray(value) && value.includes(option.value)
                      ? dropdownHandleStyles.selectedOption
                      : {}),
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    handleItemClick(option.value);
                  }}
                >
                  {defaultMultiple && (
                    <input
                      type="checkbox"
                      checked={Array.isArray(value) && value.includes(option.value)}
                      onChange={() => handleItemClick(option.value)}
                      onClick={e => e.stopPropagation()}
                      style={dropdownHandleStyles.checkbox}
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