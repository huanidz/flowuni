export const sidebarStyles = {
  container: {
    position: 'fixed' as const,
    right: 0,
    bottom: 10,
    height: '80vh',
    maxHeight: '800px',
    minHeight: '400px',
    width: '35%',
    minWidth: '300px',
    maxWidth: '500px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '4px solid #e0e0e0',
    boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column' as const,
    transition: 'transform 0.3s ease-in-out',
  },

  containerCollapsed: {
    transform: 'translateX(100%)',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f8f9fa',
  },

  headerTitle: {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    color: '#333',
    margin: 0,
  },

  headerActions: {
    display: 'flex',
    gap: '8px',
  },

  iconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    transition: 'background-color 0.2s',
  },

  iconButtonHover: {
    backgroundColor: '#e0e0e0',
  },

  content: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px',
  },

  section: {
    marginBottom: '24px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
  },

  sectionHeader: {
    padding: '12px 16px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: '#333',
    margin: 0,
  },

  sectionContent: {
    padding: '16px',
  },

  nodeHeader: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },

  nodeTitle: {
    fontSize: '18px',
    fontWeight: 'bold' as const,
    color: '#333',
    margin: 0,
  },

  nodeDescription: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
    lineHeight: '1.4',
  },

  modeSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  modeLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },

  modeSelect: {
    padding: '6px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },

  inputItem: {
    marginBottom: '16px',
  },

  inputLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '6px',
  },

  inputDescription: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px',
  },

  inputComponent: {
    width: '100%',
  },

  outputItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
  },

  outputItemLast: {
    borderBottom: 'none',
  },

  outputLabel: {
    fontSize: '14px',
    color: '#333',
  },

  outputValue: {
    fontSize: '14px',
    color: '#666',
    maxWidth: '60%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  executionResult: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    padding: '12px',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#333',
    whiteSpace: 'pre-wrap' as const,
    overflowX: 'auto' as const,
    maxHeight: '200px',
    overflowY: 'auto' as const,
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    color: '#666',
    textAlign: 'center' as const,
  },

  emptyStateIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  },

  emptyStateText: {
    fontSize: '16px',
    marginBottom: '8px',
  },

  emptyStateSubtext: {
    fontSize: '14px',
    color: '#999',
  },

  inputHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },

  inputInfo: {
    flex: 1,
  },

  toggleButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    transition: 'background-color 0.2s',
  },

  executionResultTitle: {
    fontWeight: 'bold' as const,
    marginBottom: '8px',
    color: '#374151',
  },

  executionResultContent: {
    color: '#6b7280',
    whiteSpace: 'pre-wrap' as const,
    overflowX: 'auto' as const,
    maxHeight: '200px',
    overflowY: 'auto' as const,
  },
};