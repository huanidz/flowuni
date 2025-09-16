import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    toolbarContainer,
    toolbarWrapper,
    rightAlignedButtonsContainer,
} from '@/features/flows/styles/flowToolBarStyles';
import useExecutionStore from '@/features/flows/stores/execution_store';
import RunButton from './FlowToolBarComponents/RunButton';
import CompileButton from './FlowToolBarComponents/CompileButton';
import SaveButton from './FlowToolBarComponents/SaveButton';
import PlaygroundButton from './FlowToolBarComponents/PlaygroundButton';
import ClearButton from './FlowToolBarComponents/ClearButton';
import SessionPanel from './FlowToolBarComponents/SessionPanel';

interface FlowToolbarProps {
    onRun: () => void;
    onRunFromSelected: () => void;
    onRunSelectedOnly: () => void;
    onClear: () => void;
    onCompile: () => void;
    onSave: () => void;
    onPlayground: () => void;
}

const FlowToolbar: React.FC<FlowToolbarProps> = ({
    onRun,
    onRunFromSelected,
    onRunSelectedOnly,
    onClear,
    onCompile,
    onSave,
    onPlayground,
}) => {
    const [isRunDropdownOpen, setIsRunDropdownOpen] = useState(false);
    const [isClearDropdownOpen, setIsClearDropdownOpen] = useState(false);

    // Execution store hooks - moved to SessionPanel component

    const handleConfirmClear = () => {
        onClear();
        console.log('Flow cleared successfully.');
        setIsClearDropdownOpen(false);
    };

    const handleCancelClear = () => {
        setIsClearDropdownOpen(false);
    };

    const handlePlayground = () => {
        console.log('Playground button clicked');
        onPlayground();
    };

    // Auto-dismiss clear dropdown after 3000ms
    useEffect(() => {
        if (isClearDropdownOpen) {
            const timer = setTimeout(() => {
                setIsClearDropdownOpen(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isClearDropdownOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isSaveShortcut =
                (isMac && e.metaKey) || (!isMac && e.ctrlKey);

            if (isSaveShortcut && e.key === 's') {
                e.preventDefault();
                onSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSave]);

    return (
        <div style={toolbarContainer}>
            <div style={toolbarWrapper}>
                <RunButton
                    onRun={onRun}
                    onRunFromSelected={onRunFromSelected}
                    onRunSelectedOnly={onRunSelectedOnly}
                    isDropdownOpen={isRunDropdownOpen}
                    onDropdownOpenChange={setIsRunDropdownOpen}
                />

                <CompileButton onCompile={onCompile} />

                <SaveButton onSave={onSave} />

                {/* Right-aligned buttons */}
                <div style={rightAlignedButtonsContainer}>
                    <PlaygroundButton onPlayground={handlePlayground} />

                    <ClearButton
                        onClear={onClear}
                        isDropdownOpen={isClearDropdownOpen}
                        onDropdownOpenChange={setIsClearDropdownOpen}
                    />
                </div>
            </div>

            {/* Session Panel */}
            <SessionPanel />
        </div>
    );
};

export default FlowToolbar;
