import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { sidebarStyles } from '@/features/flows/styles/sidebarStyles';
import type { TypeDetail } from '@/features/nodes/types';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';

interface TableColumn {
  name: string;
  label: string;
  dtype: string; // either 'string', 'number', or 'boolean'
  required: boolean;
}

interface SidebarTableHandleInputProps {
  label: string;
  description?: string;
  value: any[];
  onChange?: (value: any[]) => void;
  type_detail: TypeDetail;
  disabled?: boolean;
}

// Constants
const MIN_ROWS = 0;
const EMPTY_CELL_VALUE = '';

// Utility functions
const createEmptyRow = (columns: TableColumn[]): any[] => 
  columns.map(col => {
    switch (col.dtype) {
      case 'boolean':
        return false;
      case 'number':
        return '';
      default:
        return EMPTY_CELL_VALUE;
    }
  });

const convertRowsToObjects = (rows: any[][], columns: TableColumn[]) =>
  rows.map(row => 
    columns.reduce((obj, col, index) => ({
      ...obj,
      [col.name]: convertCellValue(row[index], col.dtype)
    }), {})
  );

const convertObjectsToRows = (objects: any[], columns: TableColumn[]): any[][] =>
  objects.map(obj => columns.map(col => obj[col.name] ?? createEmptyRow([col])[0]));

const convertCellValue = (value: any, dtype: string): any => {
  switch (dtype) {
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return false;
    case 'number':
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && value !== '') {
        const num = parseFloat(value);
        return isNaN(num) ? '' : num;
      }
      return '';
    default: // string
      return value?.toString() || '';
  }
};

const formatCellValueForDisplay = (value: any, dtype: string): string => {
  switch (dtype) {
    case 'boolean':
      return value; // checkbox handles boolean directly
    case 'number':
      return value?.toString() || '';
    default: // string
      return value?.toString() || '';
  }
};

export const SidebarTableHandleInput: React.FC<SidebarTableHandleInputProps> = ({
  label,
  description,
  value = [],
  onChange,
  type_detail,
  disabled = false
}) => {
  const config = {
    columns: type_detail.defaults?.columns || [],
    minRows: type_detail.defaults?.min_rows || MIN_ROWS,
    allowDynamicRows: type_detail.defaults?.allow_dynamic_rows ?? true,
    loadOnInit: type_detail.defaults?.load_on_init || false
  };

  const [tableRows, setTableRows] = useState<any[][]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize table data
  useEffect(() => {
    if (value?.length > 0) {
      // Convert input data to rows format
      const isObjectFormat = typeof value[0] === 'object' && !Array.isArray(value[0]);
      const rows = isObjectFormat 
        ? convertObjectsToRows(value, config.columns)
        : value;
      setTableRows(rows);
    } else if (config.loadOnInit && config.minRows > 0) {
      // Initialize with empty rows
      const emptyRows = Array.from({ length: config.minRows }, () => 
        createEmptyRow(config.columns)
      );
      setTableRows(emptyRows);
      onChange?.(convertRowsToObjects(emptyRows, config.columns));
    }
  }, [value, config.loadOnInit, config.minRows]);

  const updateTable = (newRows: any[][]) => {
    setTableRows(newRows);
    onChange?.(convertRowsToObjects(newRows, config.columns));
  };

  const handleCellChange = (rowIndex: number, colIndex: number, newValue: any) => {
    const newRows = [...tableRows];
    const column = config.columns[colIndex];
    newRows[rowIndex][colIndex] = convertCellValue(newValue, column.dtype);
    updateTable(newRows);
  };

  const addRow = () => {
    const newRows = [...tableRows, createEmptyRow(config.columns)];
    updateTable(newRows);
  };

  const removeRow = (rowIndex: number) => {
    if (tableRows.length <= config.minRows) return;
    const newRows = tableRows.filter((_, index) => index !== rowIndex);
    updateTable(newRows);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const renderCell = (cellValue: any, rowIndex: number, colIndex: number, column: TableColumn) => {
    if (column.dtype === 'boolean') {
      return (
        <input
          type="checkbox"
          checked={Boolean(cellValue)}
          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.checked)}
          disabled={disabled}
          className="h-4 w-4"
        />
      );
    }

    return (
      <Input
        type={column.dtype === 'number' ? 'number' : 'text'}
        value={formatCellValueForDisplay(cellValue, column.dtype)}
        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
        disabled={disabled}
        className="h-8 text-xs"
      />
    );
  };

  return (
    <div style={sidebarStyles.inputItem}>
      <div style={sidebarStyles.inputHeader}>
        <div style={sidebarStyles.inputInfo}>
          <div style={sidebarStyles.inputLabel}>{label}</div>
          {description && (
            <div style={sidebarStyles.inputDescription}>
              {description}
            </div>
          )}
        </div>
        <button
          onClick={toggleExpanded}
          style={sidebarStyles.toggleButton}
          onMouseDown={(e) => e.preventDefault()}
          title={isExpanded ? 'Collapse table' : 'Expand table'}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div style={sidebarStyles.inputComponent}>
          <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  {config.columns.map((column: TableColumn, index: number) => (
                    <TableHead key={index} className="text-xs p-2">
                      {column.label}
                    </TableHead>
                  ))}
                  {config.allowDynamicRows && (
                    <TableHead className="text-xs p-2 w-16">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <TableCell key={colIndex} className="p-1">
                        {renderCell(cell, rowIndex, colIndex, config.columns[colIndex])}
                      </TableCell>
                    ))}
                    {config.allowDynamicRows && (
                      <TableCell className="p-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(rowIndex)}
                          disabled={disabled || tableRows.length <= config.minRows}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {config.allowDynamicRows && (
            <div className="mt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={addRow}
                disabled={disabled}
                className="h-8 text-xs"
              >
                <Plus size={12} className="mr-1" />
                Add Row
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};