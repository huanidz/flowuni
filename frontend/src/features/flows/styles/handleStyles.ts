import type { CSSProperties } from 'react';

// Styles for DropdownHandleInput component
export const dropdownHandleStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '12px',
    width: '100%',
  } as CSSProperties,
  label: {
    marginBottom: '4px',
    fontWeight: 'bold',
    color: '#333',
  } as CSSProperties,
  description: {
    marginBottom: '4px',
    color: '#666',
    fontSize: '11px',
  } as CSSProperties,
  common: {
    padding: '6px 8px',
    fontSize: '12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
    position: 'relative',
  } as CSSProperties,
  dropdown: {
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
  } as CSSProperties,
  searchContainer: {
    padding: '8px',
    borderBottom: '1px solid #eee',
  } as CSSProperties,
  searchInput: {
    width: '100%',
    padding: '4px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  } as CSSProperties,
  noOptions: {
    padding: '8px',
    color: '#666',
    fontStyle: 'italic',
  } as CSSProperties,
  option: {
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  } as CSSProperties,
  selectedOption: {
    backgroundColor: '#e6f3ff',
  } as CSSProperties,
  checkbox: {
    marginRight: '8px',
  } as CSSProperties,
  flexRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as CSSProperties,
};

export const textfieldHandleStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '12px',
    width: '100%',
  } as CSSProperties,
  label: {
    marginBottom: '4px',
    fontWeight: 'bold',
    color: '#333',
  } as CSSProperties,
  description: {
    marginBottom: '4px',
    color: '#666',
    fontSize: '11px',
  } as CSSProperties,
  common: {
    padding: '6px 8px',
    fontSize: '12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
    resize: 'vertical',
  } as CSSProperties,
  multiline: {
    minHeight: '60px',
  } as CSSProperties,
} as const;

export default dropdownHandleStyles;