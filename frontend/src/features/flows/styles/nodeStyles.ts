export const nodeStyles = {
  container: {
    border: '1px solid #777',
    padding: '12px',
    borderRadius: '8px',
    background: 'white',
    minWidth: '300px',
    position: 'relative' as const,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxWidth: '230px',
  },

  header: {
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #eee',
    color: '#333',
  },

  sectionTitle: {
    fontSize: '12px',
    fontWeight: 'bold' as const,
    marginBottom: '4px',
    color: '#666',
  },

  parametersSection: {
    marginBottom: '16px',
  },

  parameterItem: {
    marginBottom: '8px',
  },

  inputsSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #eee',
  },

  inputItem: {
    position: 'relative' as const,
  },

  inputInfo: {
    paddingLeft: '12px',
    fontSize: '12px',
    color: '#333',
  },

  inputComponent: {
    paddingLeft: '12px',
    marginTop: '4px',
  },

  outputsSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },

  outputItem: {
    position: 'relative' as const,
    textAlign: 'right' as const,
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    // gap: '8px'
  },

  outputLabel: {
    marginRight: '16px',
    fontSize: '12px',
    color: '#333',
  },

  handle: {
    input: {
      position: 'absolute' as const,
      left: '-6px',
      top: '12px',
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: '#555',
      border: '2px solid white',
    },

    output: {
      position: 'absolute' as const,
      right: '-12px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: '#555',
      border: '2px solid white',
    },
  },

  required: {
    color: 'red',
  },

  description: {
    color: '#666',
  },

  // Updated styles for execution result
  executionResultSection: {
    padding: '8px',
    borderTop: '1px solid #ccc',
    marginTop: '8px',
  },

  executionResultContent: {
    fontSize: '0.85em',
    color: '#333',
    backgroundColor: '#f9f9f9',
    padding: '6px 10px',
    borderRadius: '4px',
    whiteSpace: 'pre-wrap',
    // New styles for scrolling will be applied inline
  },

  // Toggle styles for mode switching
  toggle: {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '0.7em',
    },
    switch: {
      position: 'relative' as const,
      width: '44px',
      height: '24px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      outline: 'none',
    },
    slider: {
      position: 'absolute' as const,
      top: '2px',
      width: '20px',
      height: '20px',
      backgroundColor: 'white',
      borderRadius: '50%',
      transition: 'left 0.2s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    label: {
      fontWeight: 'bold' as const,
      userSelect: 'none' as const,
    }
  },

  // Toggle styles for Tool mode
  toggleToolMode: {
    switch: {
      backgroundColor: '#007bff',
    },
    slider: {
      left: '22px',
    },
    label: {
      color: '#007bff',
    }
  },

  // Toggle styles for Normal mode
  toggleNormalMode: {
    switch: {
      backgroundColor: '#ccc',
    },
    slider: {
      left: '2px',
    },
    label: {
      color: '#28a745',
    }
  },
};
