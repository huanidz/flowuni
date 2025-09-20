// Main toolbar container styles - positioned in top center
export const toolbarContainer = {
    position: 'absolute' as const,
    top: '4px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
};

// Main toolbar wrapper styles
export const toolbarWrapper = {
    fontFamily: 'sans-serif',
    border: '1px solid #ddd',
    borderRadius: '25px',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

// Version button styles
export const versionButton = {
    backgroundColor: '#e5e7eb',
    color: 'black',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '20px 0 0 20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: 'none',
    transition: 'background-color 0.2s ease',
};

// Version button hover state
export const versionButtonHover = {
    backgroundColor: '#9e9e9eff',
    color: 'white',
};

// Eval button styles
export const evalButton = {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '0',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: 'none',
    transition: 'background-color 0.2s ease',
};

// Eval button hover state
export const evalButtonHover = {
    backgroundColor: '#e96500',
};

// Publish button styles
export const publishButton = {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '0 20px 20px 0',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: 'none',
    transition: 'background-color 0.2s ease',
};

// Publish button hover state
export const publishButtonHover = {
    backgroundColor: '#218838',
};
