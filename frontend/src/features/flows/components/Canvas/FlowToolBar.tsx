import React, { useState, useEffect } from 'react';
import {
    toolbarContainer,
    toolbarWrapper,
    rightAlignedButtonsContainer,
    secondRowContainer,
} from '@/features/flows/styles/flowToolBarStyles';
import RunButton from './FlowToolBarComponents/RunButton';
import CompileButton from './FlowToolBarComponents/CompileButton';
import SaveButton from './FlowToolBarComponents/SaveButton';
import PlaygroundButton from './FlowToolBarComponents/PlaygroundButton';
import ClearButton from './FlowToolBarComponents/ClearButton';
import ResetDataButton from './FlowToolBarComponents/ResetDataButton';
import ExportButton from './FlowToolBarComponents/ExportButton';
import type { Node, Edge } from '@xyflow/react';

interface FlowToolbarProps {
    onRun: () => void;
    onRunFromSelected: () => void;
    onRunSelectedOnly: () => void;
    onClear: () => void;
    onResetAllData: () => void;
    onResetExecutionData: () => void;
    onCompile: () => void;
    onSave: () => void;
    onPlayground: () => void;
    nodes: Node[];
    edges: Edge[];
}

const FlowToolbar: React.FC<FlowToolbarProps> = ({
    onRun,
    onRunFromSelected,
    onRunSelectedOnly,
    onClear,
    onResetAllData,
    onResetExecutionData,
    onCompile,
    onSave,
    onPlayground,
    nodes,
    edges,
}) => {
    const [isRunDropdownOpen, setIsRunDropdownOpen] = useState(false);

    const handlePlayground = () => {
        console.log('Playground button clicked');
        onPlayground();
    };

    // useEffect(() => {
    //     const handleKeyDown = (e: KeyboardEvent) => {
    //         const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    //         const isSaveShortcut =
    //             (isMac && e.metaKey) || (!isMac && e.ctrlKey);

    //         if (isSaveShortcut && e.key === 's') {
    //             e.preventDefault();
    //             onSave();
    //         }
    //     };

    //     window.addEventListener('keydown', handleKeyDown);
    //     return () => window.removeEventListener('keydown', handleKeyDown);
    // }, [onSave]);

    return (
        <div style={toolbarContainer}>
            <div style={toolbarWrapper}>
                <RunButton
                    onRun={onRun}
                    onResetExecutionData={onResetExecutionData}
                    onRunFromSelected={onRunFromSelected}
                    onRunSelectedOnly={onRunSelectedOnly}
                    isDropdownOpen={isRunDropdownOpen}
                    onDropdownOpenChange={setIsRunDropdownOpen}
                />

                {/* <CompileButton onCompile={onCompile} /> */}

                {/* Right-aligned buttons */}
                <div style={rightAlignedButtonsContainer}>
                    <PlaygroundButton onPlayground={handlePlayground} />

                    <ClearButton onClear={onClear} />

                    <ResetDataButton
                        onResetAllData={onResetAllData}
                        onResetExecutionData={onResetExecutionData}
                    />
                </div>
            </div>

            {/* Second row with Export button */}
            <div style={secondRowContainer}>
                <SaveButton onSave={onSave} />

                <ExportButton nodes={nodes} edges={edges} />
            </div>
        </div>
    );
};

export default FlowToolbar;
