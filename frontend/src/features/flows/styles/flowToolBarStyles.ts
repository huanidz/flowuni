// Main toolbar container styles
export const toolbarContainer = {
    position: 'absolute' as const,
    top: '4px',
    right: '4px',
    zIndex: 10,
};

// Main toolbar wrapper styles
export const toolbarWrapper = {
    fontFamily: 'sans-serif',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

// Split run button container styles
export const splitRunButtonContainer = {
    display: 'flex',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderRadius: '6px',
};

// Run button styles
export const runButton = {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px 0 0 5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
};

// Run button hover state
export const runButtonHover = {
    backgroundColor: '#218838',
};

// Dropdown trigger button styles
export const dropdownTriggerButton = {
    backgroundColor: '#228f3c',
    color: 'white',
    border: 'none',
    padding: '10px',
    borderLeft: '1px solid #6dbe7f',
    borderRadius: '0 5px 5px 0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

// Dropdown trigger button hover state
export const dropdownTriggerButtonHover = {
    backgroundColor: '#1e7e34',
};

// Compile button styles
export const compileButton = {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

// Compile button hover state
export const compileButtonHover = {
    backgroundColor: '#0056b3',
};

// Save button styles
export const saveButton = {
    backgroundColor: '#ffc107',
    color: 'black',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

// Save button hover state
export const saveButtonHover = {
    backgroundColor: '#e0a800',
};

// Right-aligned buttons container styles
export const rightAlignedButtonsContainer = {
    marginLeft: 'auto',
    display: 'flex',
    gap: '10px',
};

// Playground button styles
export const playgroundButton = {
    backgroundColor: '#8A2BE2',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

// Playground button hover state
export const playgroundButtonHover = {
    backgroundColor: '#7B1FA2',
};

// Clear button styles
export const clearButton = {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

// Clear button hover state
export const clearButtonHover = {
    backgroundColor: '#c82333',
};

// Dropdown menu item styles
export const dropdownMenuItem = {
    padding: '8px 12px',
    borderRadius: '4px',
    margin: '2px 0',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
};

// Colorful styles for "Run from Selected" menu item
export const runFromSelectedMenuItem = {
    ...dropdownMenuItem,
    backgroundColor: '#e3f2fd',
    color: '#0d47a1',
};

// Hover state for "Run from Selected" menu item
export const runFromSelectedMenuItemHover = {
    backgroundColor: '#bbdefb',
    color: '#01579b',
};

// Colorful styles for "Run Selected Only" menu item
export const runSelectedOnlyMenuItem = {
    ...dropdownMenuItem,
    backgroundColor: '#e8f5e9',
    color: '#1b5e20',
};

// Hover state for "Run Selected Only" menu item
export const runSelectedOnlyMenuItemHover = {
    backgroundColor: '#c8e6c9',
    color: '#2e7d32',
};
