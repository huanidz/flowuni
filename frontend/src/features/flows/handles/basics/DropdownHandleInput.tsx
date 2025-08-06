import React, { useEffect, useState, useMemo } from 'react';
import dropdownHandleStyles from '../../styles/handleStyles';
import { useNodes } from '@xyflow/react';
import { runResolver } from '@/api/resolvers/registry';

interface DropdownHandleInputProps {
  label: string;
  description?: string;
  value: any;
  nodeId: string;
  onChange?: (value: string | string[]) => void;

  // Config (NEW)
  type_detail: {
    defaults?: {
      client_resolver?: any;
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
  nodeId,
  onChange,
  type_detail
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [resolvedOptions, setResolvedOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [isOpen, setIsOpen] = useState(false);

  const nodes = useNodes();
  console.log("Nodes:", nodes);

  const resolver = type_detail.defaults?.client_resolver;

  console.log("Resolver:", resolver);

  const {
    multiple: defaultMultiple = false,
    searchable: defaultSearchable = false,
    options: defaultOptions = []
  } = type_detail.defaults || {};

  // Get current node data for resolver context
  const currentNode = nodes.find(node => node.id === nodeId);
  const node_input_values: any = currentNode?.data?.input_values || {};

  console.log("Node data:", node_input_values);
  
  // SOLUTION 1: Create dependency values excluding the current handle
  const dependencyValues = useMemo(() => {
    if (!resolver) return {};
    
    const deps = resolver.depends_on || [];
    const depValues: any = {};
    
    // For conditional resolvers, we need to watch the field_id
    if (resolver.type === 'conditional' && resolver.field_id) {
      if (resolver.field_id !== label) { // Exclude current handle
        depValues[resolver.field_id] = node_input_values[resolver.field_id];
      }
    }
    
    // Also include any explicit dependencies
    deps.forEach((dep: string) => {
      if (dep !== label) { // Exclude current handle
        depValues[dep] = node_input_values[dep];
      }
    });
    
    return depValues;
  }, [resolver, node_input_values, label]);


  // === RESOLVER HANDLING ===

  useEffect(() => {
    const fetchResolvedOptions = async () => { 
      if (!resolver) {
        return;
      }
  
      try {
        const deps = resolver.depends_on || [];
        
        // Filter out the current handle from dependencies
        const relevantDeps = deps.filter((dep: string) => dep !== label);
        
        const allDepsReady = relevantDeps.every((dep: string) => 
          node_input_values[dep] !== undefined && node_input_values[dep] !== ""
        );
    
        if (!allDepsReady && relevantDeps.length > 0) {
          setResolvedOptions([]);
          console.log("Dependencies not ready, skipping resolver");
          return;
        }
    
        const result = await runResolver(resolver, node_input_values);
    
        let options: Array<{ label: string; value: string }> = [];
  
        if (Array.isArray(result)) {
          options = result.map(item => 
            typeof item === 'string' 
              ? { value: item, label: item }
              : { value: item.value, label: item.label }
          );
        } else if (result && typeof result === 'object') {
          options = [result as { label: string; value: string }];
        }
  
        console.log("Resolved options:", options, "--- LABEL: ", label);
        setResolvedOptions(options);
      } catch (err) {
        console.error("Error running resolver:", err);
        setResolvedOptions([]);
      } 
    }

    fetchResolvedOptions();
      
  // Use dependencyValues instead of node_input_values to prevent current handle changes from triggering
  }, [resolver, dependencyValues]);

  const optionsToUse = resolvedOptions.length > 0 ? resolvedOptions : (defaultOptions || []);

  // === BASIC HANDLE HANDLING ===
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

  const filteredOptions = (optionsToUse || []).filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayValue = defaultMultiple
    ? Array.isArray(value)
      ? value.map(v => (optionsToUse || []).find(opt => opt.value === v)?.label || v).join(', ')
      : ''
    : (optionsToUse || []).find(opt => opt.value === value)?.label || value || '';

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