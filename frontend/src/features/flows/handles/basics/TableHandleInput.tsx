import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TypeDetail } from '@/features/nodes/types';

interface TableColumn {
  name: string;
  label: string;
  dtype: string; // either 'string', 'number', or 'boolean'
  required: boolean;
}

interface TableHandleInputProps {
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

export const TableHandleInput: React.FC<TableHandleInputProps> = ({
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
        placeholder={column.label}
        className="h-8"
      />
    );
  };

  // Early return for no columns
  if (!config.columns?.length) {
    return (
      <div className="text-muted-foreground italic">
        No columns defined
      </div>
    );
  }

  const canModifyRows = config.allowDynamicRows && !disabled;
  const showActions = canModifyRows;

  return (
    <div className="space-y-2">
      {description && (
        <p className={`text-sm text-muted-foreground ${disabled ? 'opacity-50' : ''}`}>
          {description}
        </p>
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {config.columns.map((col: TableColumn, index: number) => (
                <TableHead key={index}>
                  {col.label}
                  {col.required && <span className="text-red-500 ml-1">*</span>}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({col.dtype})
                  </span>
                </TableHead>
              ))}
              {showActions && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {tableRows.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={config.columns.length + (showActions ? 1 : 0)}
                  className="text-center text-muted-foreground py-8"
                >
                  No data
                </TableCell>
              </TableRow>
            ) : (
              tableRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cellValue, colIndex) => (
                    <TableCell key={colIndex}>
                      {renderCell(cellValue, rowIndex, colIndex, config.columns[colIndex])}
                    </TableCell>
                  ))}
                  
                  {showActions && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(rowIndex)}
                        disabled={tableRows.length <= config.minRows}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        ×
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {canModifyRows && (
        <Button
          variant="outline"
          size="sm"
          onClick={addRow}
          className="w-full"
        >
          + Add Row
        </Button>
      )}
    </div>
  );
};