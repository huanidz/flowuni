// nodeSectionStyles.ts

// Styles for NodeExecutionResult component
export const executionResultStyles = {
  section: {
    marginTop: '8px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none' as const,
    padding: '8px 12px',
    backgroundColor: '#f7fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  executionResultContent: {
    padding: '12px',
    maxHeight: '200px',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
  },
  status: {
    running: {
      title: 'Executing...',
      iconStyle: {
        display: 'inline-block',
        width: '12px',
        height: '12px',
        border: '2px solid #f3f3f3',
        borderTop: '2px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginRight: '6px',
      },
      iconText: '',
      contentStyle: {
        color: '#666',
        backgroundColor: '#f0f8ff',
        border: '1px solid #3498db',
      },
    },
    failed: {
      title: 'Execution Failed',
      iconStyle: {
        marginRight: '6px',
        color: '#e74c3c',
      },
      iconText: '❌',
      contentStyle: {
        color: '#721c24',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
      },
    },
    success: {
      title: 'Execution Result',
      iconStyle: {
        marginRight: '6px',
        color: '#27ae60',
      },
      iconText: '✅',
      contentStyle: {
        color: '#333',
        backgroundColor: '#f9f9f9',
        border: 'none',
      },
    },
  },
};

// Add keyframes animation to global style
const styleSheet = document.styleSheets[0];
try {
  styleSheet.insertRule(
    '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }',
    styleSheet.cssRules.length
  );
} catch (e) {
  console.warn('Could not insert animation rule:', e);
}