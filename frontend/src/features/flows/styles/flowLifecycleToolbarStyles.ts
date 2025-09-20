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
    borderRadius: '8px',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

// Version button styles
export const versionButton = {
    backgroundColor: '#6f42c1',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'background-color 0.2s ease',
};

// Version button hover state
export const versionButtonHover = {
    backgroundColor: '#5a359a',
};

// Eval button styles
export const evalButton = {
    backgroundColor: '#fd7e14',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'background-color 0.2s ease',
};

// Eval button hover state
export const evalButtonHover = {
    backgroundColor: '#e96500',
};

// Publish button styles
export const publishButton = {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'background-color 0.2s ease',
};

// Publish button hover state
export const publishButtonHover = {
    backgroundColor: '#218838',
};
