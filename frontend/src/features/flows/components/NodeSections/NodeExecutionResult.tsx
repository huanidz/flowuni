import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { executionResultStyles } from '@/features/flows/styles/nodeSectionStyles';

interface NodeExecutionResultProps {
  result?: string | null;
  status?: string;
}

// Helper function to beautify JSON
const beautifyJson = (jsonString: string): string => {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // If it's not valid JSON, return the original string
    return jsonString;
  }
};

// Helper function to add syntax highlighting
const addSyntaxHighlighting = (jsonString: string): React.ReactElement => {
  const highlighted = jsonString
    // Highlight keys
    .replace(/"([^"]+)":/g, '<span class="text-blue-600">"$1"</span>:')
    // Highlight string values
    .replace(/: "([^"]+)"/g, ': <span class="text-green-600">"$1"</span>')
    // Highlight numbers
    .replace(/: (\d+)/g, ': <span class="text-purple-600">$1</span>')
    // Highlight booleans
    .replace(/: (true|false)/g, ': <span class="text-orange-600">$1</span>')
    // Highlight null
    .replace(/: null/g, ': <span class="text-gray-500">null</span>')
    // Highlight brackets and braces
    .replace(/([\{\[\]\}])/g, '<span class="text-gray-700">$1</span>')
    // Highlight commas
    .replace(/,/g, '<span class="text-gray-400">,</span>');

  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
};

export const NodeExecutionResult: React.FC<NodeExecutionResultProps> = ({
  result,
  status = 'success'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Don't show if no result and not running
  if (!result && status !== 'running') return null;

  // Get status configuration from external styles
  const statusConfig = executionResultStyles.status[status as keyof typeof executionResultStyles.status] || executionResultStyles.status.success;

  // Copy to clipboard function
  const handleCopy = async () => {
    if (result) {
      try {
        const textToCopy = beautifyJson(result);
        await navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  // Disable ReactFlow interactions when mouse enters the scrollable area
  const handleMouseEnter = () => {
    // Find the ReactFlow wrapper and disable wheel events
    const reactFlowWrapper = document.querySelector('.react-flow__renderer');
    if (reactFlowWrapper) {
      (reactFlowWrapper as HTMLElement).style.pointerEvents = 'none';
    }
  };

  // Re-enable ReactFlow interactions when mouse leaves
  const handleMouseLeave = () => {
    const reactFlowWrapper = document.querySelector('.react-flow__renderer');
    if (reactFlowWrapper) {
      (reactFlowWrapper as HTMLElement).style.pointerEvents = 'auto';
    }
  };

  // Alternative: Use a more targeted approach with event capture
  const handleWheelCapture = (e: React.WheelEvent) => {
    // Stop the event from reaching ReactFlow
    e.stopPropagation();
    // e.preventDefault();
    
    // Manually handle the scroll
    const target = e.currentTarget as HTMLElement;
    target.scrollTop += e.deltaY;
  };

  return (
    <div style={executionResultStyles.section}>
      <div
        style={executionResultStyles.sectionTitle}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={statusConfig.iconStyle}>{statusConfig.iconText}</span>
        <span style={{ marginRight: '6px' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
        {statusConfig.title}
        {result && isExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent collapsing when clicking copy button
              handleCopy();
            }}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              color: 'inherit',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
            title={isCopied ? 'Copied!' : 'Copy to clipboard'}
          >
            {isCopied ? (
              <Check size={14} style={{ color: '#22c55e' }} />
            ) : (
              <Copy size={14} />
            )}
          </button>
        )}
      </div>
      
      {isExpanded && (
        <div 
          style={{
            ...executionResultStyles.executionResultContent,
            ...statusConfig.contentStyle
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onWheelCapture={handleWheelCapture}
        >
          {status === 'running' ? 'Execution in progress...' : (
            result ? (
              <div className="font-mono text-sm whitespace-pre-wrap">
                {addSyntaxHighlighting(beautifyJson(result))}
              </div>
            ) : 'No output'
          )}
        </div>
      )}
    </div>
  );
};