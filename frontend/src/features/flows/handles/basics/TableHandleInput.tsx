import React, { useState, useEffect } from 'react';
import type { TypeDetail } from '@/features/nodes/types';
import { tableHandleStyles } from '@/features/flows/styles/handleStyles';

interface TableColumn {
  name: string;
  label: string;
  required: boolean;
}

interface TableHandleInputProps {
  label: string;
  description?: string;
  value: any;
  onChange?: (value: any) => void;
  type_detail: TypeDetail;
  disabled: boolean;
}

export const TableHandleInput: React.FC<TableHandleInputProps> = ({
  label,
  description,
  value,
  onChange,
  type_detail,
  disabled = true
}) => {
  const {
    dynamic = false,
    load_on_init = false,
    reload_on_change = false,
    columns = [],
    min_rows = 0,
    allow_dynamic_rows = true
  } = type_detail.defaults || {};

  const [tableData, setTableData] = useState<any[][]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize table data
  useEffect(() => {
    if (load_on_init && !initialized) {
      initializeTableData();
      setInitialized(true);
    }
  }, [load_on_init, initialized]);

  // Initialize table with default data structure
  const initializeTableData = () => {
    if (!columns || columns.length === 0) return;

    // Create empty rows based on min_rows
    const initialRows: any[][] = [];
    for (let i = 0; i < min_rows; i++) {
      const row: any[] = columns.map((col: TableColumn) => '');
      initialRows.push(row);
    }

    setTableData(initialRows);
    if (onChange) {
      onChange(convertToOutputFormat(initialRows));
    }
  };

  // Convert table data to output format
  const convertToOutputFormat = (data: any[][]) => {
    if (!columns || columns.length === 0) return null;

    return data.map((row, rowIndex) => {
      const rowData: any = {};
      columns.forEach((col: TableColumn, colIndex: number) => {
        rowData[col.name] = row[colIndex] || '';
      });
      return rowData;
    });
  };

  // Handle cell value change
  const handleCellChange = (rowIndex: number, colIndex: number, newValue: string) => {
    if (disabled) return;

    const newData = [...tableData];
    newData[rowIndex][colIndex] = newValue;
    setTableData(newData);

    if (onChange) {
      onChange(convertToOutputFormat(newData));
    }
  };

  // Add new row
  const addRow = () => {
    if (disabled || !allow_dynamic_rows) return;

    const newRow: any[] = columns.map((col: TableColumn) => '');
    const newData = [...tableData, newRow];
    setTableData(newData);

    if (onChange) {
      onChange(convertToOutputFormat(newData));
    }
  };

  // Remove row
  const removeRow = (rowIndex: number) => {
    if (disabled || !allow_dynamic_rows || tableData.length <= min_rows) return;

    const newData = tableData.filter((_, index) => index !== rowIndex);
    setTableData(newData);

    if (onChange) {
      onChange(convertToOutputFormat(newData));
    }
  };

  // Initialize with provided value
  useEffect(() => {
    if (value && Array.isArray(value)) {
      // Check if value is in object format (array of objects) and convert to array of arrays
      if (value.length > 0 && typeof value[0] === 'object' && !Array.isArray(value[0])) {
        // Convert from array of objects to array of arrays
        const convertedData = value.map((row: any) => {
          return columns.map((col: TableColumn) => row[col.name] || '');
        });
        setTableData(convertedData);
      } else {
        // Already in array of arrays format
        setTableData(value);
      }
    } else if (load_on_init && !initialized) {
      initializeTableData();
    }
  }, [value, load_on_init, initialized]);

  // Render table
  const renderTable = () => {
    if (!columns || columns.length === 0) {
      return (
        <div style={{ color: '#666', fontStyle: 'italic' }}>
          No columns defined
        </div>
      );
    }

    return (
      <div style={tableHandleStyles.container}>
        <table style={tableHandleStyles.table}>
          <thead>
            <tr>
              {columns.map((col: TableColumn, index: number) => (
                <th key={index} style={tableHandleStyles.th}>
                  {col.label}
                  {col.required && <span style={tableHandleStyles.required}>*</span>}
                </th>
              ))}
              {allow_dynamic_rows && !disabled && (
                <th style={tableHandleStyles.th}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cellValue, colIndex) => (
                  <td key={colIndex} style={tableHandleStyles.td}>
                    <input
                      type="text"
                      value={cellValue}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      disabled={disabled}
                      style={tableHandleStyles.input}
                      placeholder={columns[colIndex]?.label || ''}
                    />
                  </td>
                ))}
                {allow_dynamic_rows && !disabled && (
                  <td style={tableHandleStyles.td}>
                    <button
                      type="button"
                      onClick={() => removeRow(rowIndex)}
                      style={tableHandleStyles.removeButton}
                      title="Remove row"
                    >
                      ×
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {allow_dynamic_rows && !disabled && (
          <button
            type="button"
            onClick={addRow}
            style={tableHandleStyles.addButton}
          >
            + Add Row
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={tableHandleStyles.outerContainer}>
      {description && (
        <span style={{
          ...tableHandleStyles.description,
          opacity: disabled ? 0.5 : 1
        }}>
          {description}
        </span>
      )}
      
      {disabled ? (
        <div style={tableHandleStyles.disabledContainer}>
          {value && Array.isArray(value) && value.length > 0 ? (
            <div style={tableHandleStyles.disabledPreview}>
              Table with {value.length} row(s) and {columns.length} column(s)
            </div>
          ) : (
            <div style={tableHandleStyles.disabledPreview}>
              No table data
            </div>
          )}
        </div>
      ) : (
        renderTable()
      )}
    </div>
  );
};