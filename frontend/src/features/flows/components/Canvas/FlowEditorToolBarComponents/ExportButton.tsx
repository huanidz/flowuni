import React from 'react';
import {
    exportButton,
    exportButtonHover,
} from '@/features/flows/styles/flowEditorToolBarStyles';
import { getFlowGraphData } from '@/features/flows/utils';
import useFlowStore from '@/features/flows/stores/flow_stores';
import type { Node, Edge } from '@xyflow/react';

interface ExportButtonProps {
    nodes: Node[];
    edges: Edge[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ nodes, edges }) => {
    const { current_flow } = useFlowStore();

    const handleExportClick = () => {
        if (!current_flow) {
            console.error('No current flow found');
            return;
        }

        try {
            // Get flow graph data using the utility function
            const flowData = getFlowGraphData(nodes, edges);

            // Create filename with flow name and ID
            const filename = `flow_${current_flow.name}_${current_flow.flow_id}.json`;

            // Convert data to JSON string
            const jsonString = JSON.stringify(flowData, null, 2);

            // Create blob and download link
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Create temporary link element
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Clean up
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log(`Flow exported successfully as ${filename}`);
        } catch (error) {
            console.error('Error exporting flow:', error);
        }
    };

    return (
        <button
            onClick={handleExportClick}
            style={exportButton}
            onMouseEnter={e => {
                e.currentTarget.style.backgroundColor =
                    exportButtonHover.backgroundColor;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.backgroundColor =
                    exportButton.backgroundColor;
            }}
        >
            Export
        </button>
    );
};

export default ExportButton;
