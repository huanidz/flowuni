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
  const typeOptions = type_detail.defaults?.type_options || [];
  
  // Parse the value to extract selected type and type-specific values
  // Expected format: { selectedTyped: 'type_name', typeValues: { 'type_name': value } }
  const [selectedTyped, setSelectedType] = useState<string>('');
  const [typeValues, setTypeValues] = useState<Record<string, any>>({});
  
  // Initialize selected type and values from props
  useEffect(() => {
    if (typeOptions.length > 0) {
      let initialSelectedType = selectedTyped;
      let initialTypeValues = { ...typeValues };
      
      // If value is an object with our expected structure
      if (value && typeof value === 'object' && value.selectedTyped && value.typeValues) {
        initialSelectedType = value.selectedTyped;
        initialTypeValues = value.typeValues;
      }
      // If value is not in expected format, initialize with defaults
      else {
        // Default to first option if none selected
        if (!initialSelectedType && typeOptions.length > 0) {
          initialSelectedType = typeOptions[0].type_name;
        }
        
        // Initialize values for all types if not already set
        typeOptions.forEach((option: DynamicTypeItem) => {
          if (initialTypeValues[option.type_name] === undefined) {
            initialTypeValues[option.type_name] = value || null;
          }
        });
      }
      
      setSelectedType(initialSelectedType);
      setTypeValues(initialTypeValues);
    }
  }, [typeOptions, value]);

  const handleTypeChange = (newTypeName: string) => {
    setSelectedType(newTypeName);
    
    // Create the complete value object with the new selected type
    const newValue = {
      selectedTyped: newTypeName,
      typeValues: {
        ...typeValues,
        [newTypeName]: typeValues[newTypeName] || null
      }
    };
    
    // Emit the change to parent
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleChildValueChange = (childValue: any) => {
    // Update the value for the currently selected type
    const newTypeValues = {
      ...typeValues,
      [selectedTyped]: childValue
    };
    
    // Create the complete value object
    const newValue = {
      selectedTyped,
      typeValues: newTypeValues
    };
    
    setTypeValues(newTypeValues);
    
    // Emit the change to parent
    if (onChange) {
      onChange(newValue);
    }
  };

  const selectedOption = typeOptions.find((option: DynamicTypeItem) => option.type_name === selectedTyped);
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
          value={selectedTyped}
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
            value={typeValues[selectedTyped] || null}
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