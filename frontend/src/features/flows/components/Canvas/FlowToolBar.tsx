import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChevronDown, Info } from 'lucide-react';
import {
    toolbarContainer,
    toolbarWrapper,
    splitRunButtonContainer,
    runButton,
    runButtonHover,
    dropdownTriggerButton,
    dropdownTriggerButtonHover,
    compileButton,
    compileButtonHover,
    saveButton,
    saveButtonHover,
    rightAlignedButtonsContainer,
    playgroundButton,
    playgroundButtonHover,
    clearButton,
    clearButtonHover,
    runFromSelectedMenuItem,
    runFromSelectedMenuItemHover,
    runSelectedOnlyMenuItem,
    runSelectedOnlyMenuItemHover,
    sessionPanel,
    sessionCheckbox,
    sessionLabel,
    sessionIdText,
    resetButton,
    resetButtonHover,
} from '@/features/flows/styles/flowToolBarStyles';
import useExecutionStore from '@/features/flows/stores/execution_store';

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

    // Execution store hooks
    const { sessionId, isSessionEnabled, setSessionEnabled, resetSessionId } =
        useExecutionStore();

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
                {/* Split Run Button */}
                <div style={splitRunButtonContainer}>
                    <button
                        onClick={onRun}
                        style={runButton}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor =
                                runButtonHover.backgroundColor;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor =
                                runButton.backgroundColor;
                        }}
                    >
                        ▶ Run Flow
                    </button>

                    <DropdownMenu
                        open={isRunDropdownOpen}
                        onOpenChange={setIsRunDropdownOpen}
                    >
                        <DropdownMenuTrigger asChild>
                            <button
                                style={dropdownTriggerButton}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor =
                                        dropdownTriggerButtonHover.backgroundColor;
                                    setIsRunDropdownOpen(true);
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor =
                                        dropdownTriggerButton.backgroundColor;
                                }}
                            >
                                <ChevronDown size={16} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-48"
                            onMouseEnter={() => setIsRunDropdownOpen(true)}
                            onMouseLeave={() => setIsRunDropdownOpen(false)}
                        >
                            <DropdownMenuItem
                                onClick={onRunFromSelected}
                                style={runFromSelectedMenuItem}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor =
                                        runFromSelectedMenuItemHover.backgroundColor;
                                    e.currentTarget.style.color =
                                        runFromSelectedMenuItemHover.color;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor =
                                        runFromSelectedMenuItem.backgroundColor;
                                    e.currentTarget.style.color =
                                        runFromSelectedMenuItem.color;
                                }}
                            >
                                Run from Selected
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={onRunSelectedOnly}
                                style={runSelectedOnlyMenuItem}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor =
                                        runSelectedOnlyMenuItemHover.backgroundColor;
                                    e.currentTarget.style.color =
                                        runSelectedOnlyMenuItemHover.color;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor =
                                        runSelectedOnlyMenuItem.backgroundColor;
                                    e.currentTarget.style.color =
                                        runSelectedOnlyMenuItem.color;
                                }}
                            >
                                Run Selected Only
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Compile Button */}
                <button
                    onClick={onCompile}
                    style={compileButton}
                    onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor =
                            compileButtonHover.backgroundColor;
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor =
                            compileButton.backgroundColor;
                    }}
                >
                    Compile
                </button>

                {/* Save Button */}
                <button
                    onClick={onSave}
                    style={saveButton}
                    onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor =
                            saveButtonHover.backgroundColor;
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor =
                            saveButton.backgroundColor;
                    }}
                >
                    Save
                </button>

                {/* Right-aligned buttons */}
                <div style={rightAlignedButtonsContainer}>
                    {/* Playground Button */}
                    <button
                        onClick={handlePlayground}
                        style={playgroundButton}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor =
                                playgroundButtonHover.backgroundColor;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor =
                                playgroundButton.backgroundColor;
                        }}
                    >
                        Playground
                    </button>

                    {/* Clear Button with Confirmation */}
                    <DropdownMenu
                        open={isClearDropdownOpen}
                        onOpenChange={setIsClearDropdownOpen}
                    >
                        <DropdownMenuTrigger asChild>
                            <button
                                style={clearButton}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor =
                                        clearButtonHover.backgroundColor;
                                    setIsClearDropdownOpen(true);
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor =
                                        clearButton.backgroundColor;
                                }}
                            >
                                Clear
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-48"
                            align="end"
                            onMouseEnter={() => setIsClearDropdownOpen(true)}
                            onMouseLeave={() => setIsClearDropdownOpen(false)}
                        >
                            <div className="p-2">
                                <p className="text-sm text-muted-foreground mb-3">
                                    Clear the flow?
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleConfirmClear}
                                        size="sm"
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        Yes
                                    </Button>
                                    <Button
                                        onClick={handleCancelClear}
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        No
                                    </Button>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            {/* Session Panel */}
            <div style={sessionPanel}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                >
                    <Checkbox
                        id="session-checkbox"
                        checked={isSessionEnabled}
                        onCheckedChange={checked =>
                            setSessionEnabled(checked as boolean)
                        }
                        style={sessionCheckbox}
                    />
                    <Label htmlFor="session-checkbox" style={sessionLabel}>
                        Session
                    </Label>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'help',
                            color: '#666',
                            fontSize: '12px',
                        }}
                        title="Session will preserve ChatInput and ChatOutput as messages, it will affect some nodes like MemoryNode"
                    >
                        <Info size={12} />
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                >
                    <span style={sessionIdText} title={sessionId}>
                        {sessionId}
                    </span>
                    <button
                        onClick={resetSessionId}
                        style={resetButton}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor =
                                resetButtonHover.backgroundColor;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor =
                                resetButton.backgroundColor;
                        }}
                        title="Reset session ID"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FlowToolbar;
