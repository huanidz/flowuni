import React, { useState, useEffect } from 'react';
import type { TypeDetail, DynamicTypeItem } from '@/features/nodes/types';
import { HandleComponentRegistry } from '../HandleComponentRegistry';
import { dynamicTypeHandleStyles } from '../../styles/handleStyles';

interface DynamicTypeHandleInputProps {
  label: string;
  description?: string;
  value: any;
  onChange?: (value: any) => void;
  type_detail: TypeDetail;
  disabled?: boolean;
  nodeId?: string;
}

export const DynamicTypeHandleInput: React.FC<DynamicTypeHandleInputProps> = ({
  label,
  description,
  value,
  onChange,
  type_detail,
  disabled = false,
  nodeId
}) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [typeValues, setTypeValues] = useState<Record<string, any>>({});
  
  const typeOptions = type_detail.defaults?.type_options || [];
  
  // Initialize selected type and values
  useEffect(() => {
    if (typeOptions.length > 0 && !selectedType) {
      // Default to first option if none selected
      const defaultType = typeOptions[0].type_name;
      setSelectedType(defaultType);
      
      // Initialize values for all types
      const initialValues: Record<string, any> = {};
      typeOptions.forEach((option: DynamicTypeItem) => {
        initialValues[option.type_name] = value || null;
      });
      setTypeValues(initialValues);
    }
  }, [typeOptions, selectedType, value]);

  const handleTypeChange = (newTypeName: string) => {
    setSelectedType(newTypeName);
    // When type changes, emit the current value for that type
    if (onChange) {
      onChange(typeValues[newTypeName] || null);
    }
  };

  const handleChildValueChange = (childValue: any) => {
    // Update the value for the currently selected type
    const newTypeValues = {
      ...typeValues,
      [selectedType]: childValue
    };
    setTypeValues(newTypeValues);
    
    // Emit the change to parent
    if (onChange) {
      onChange(childValue);
    }
  };

  const selectedOption = typeOptions.find((option: DynamicTypeItem) => option.type_name === selectedType);
  const SelectedComponent = selectedOption ? HandleComponentRegistry[selectedOption.type_name] : null;

  return (
    <div style={dynamicTypeHandleStyles.container}>
      {description && (
        <span style={{
          ...dynamicTypeHandleStyles.description,
          opacity: disabled ? 0.5 : 1
        }}>
          {description}
        </span>
      )}
      
      <div style={dynamicTypeHandleStyles.typeSelectorContainer}>
        <label htmlFor={`${label}-type-select`} style={dynamicTypeHandleStyles.label}>
          Input Type
        </label>
        <select
          id={`${label}-type-select`}
          value={selectedType}
          onChange={(e) => handleTypeChange(e.target.value)}
          disabled={disabled}
          style={{
            ...dynamicTypeHandleStyles.selectTrigger,
            ...(disabled ? dynamicTypeHandleStyles.selectTriggerDisabled : {}),
            ...(disabled ? {} : {
              ':hover': dynamicTypeHandleStyles.selectTriggerHover,
              ':focus': dynamicTypeHandleStyles.selectTriggerFocus,
            }),
          }}
        >
          <option value="">Select input type</option>
          {typeOptions.map((option: DynamicTypeItem) => (
            <option key={option.type_name} value={option.type_name}>
              {option.type_label}
            </option>
          ))}
        </select>
      </div>

      {SelectedComponent && selectedOption && (
        <div style={dynamicTypeHandleStyles.componentContainer}>
          <SelectedComponent
            label={label}
            value={typeValues[selectedType] || null}
            onChange={handleChildValueChange}
            type_detail={{
              ...type_detail,
              defaults: selectedOption.details
            }}
            disabled={disabled}
            nodeId={nodeId}
          />
        </div>
      )}
    </div>
  );
};