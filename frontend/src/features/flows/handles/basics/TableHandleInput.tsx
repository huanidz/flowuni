import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TypeDetail } from '@/features/nodes/types';

interface TableColumn {
  name: string;
  label: string;
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
const createEmptyRow = (columns: TableColumn[]): string[] => 
  columns.map(() => EMPTY_CELL_VALUE);

const convertRowsToObjects = (rows: string[][], columns: TableColumn[]) =>
  rows.map(row => 
    columns.reduce((obj, col, index) => ({
      ...obj,
      [col.name]: row[index] || EMPTY_CELL_VALUE
    }), {})
  );

const convertObjectsToRows = (objects: any[], columns: TableColumn[]): string[][] =>
  objects.map(obj => columns.map(col => obj[col.name] || EMPTY_CELL_VALUE));

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

  const [tableRows, setTableRows] = useState<string[][]>([]);

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

  const updateTable = (newRows: string[][]) => {
    setTableRows(newRows);
    onChange?.(convertRowsToObjects(newRows, config.columns));
  };

  const handleCellChange = (rowIndex: number, colIndex: number, newValue: string) => {
    const newRows = [...tableRows];
    newRows[rowIndex][colIndex] = newValue;
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
                      <Input
                        value={cellValue}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        disabled={disabled}
                        placeholder={config.columns[colIndex]?.label}
                        className="h-8"
                      />
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