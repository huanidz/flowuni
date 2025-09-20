import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
    splitRunButtonContainer,
    runButton,
    runButtonHover,
    dropdownTriggerButton,
    dropdownTriggerButtonHover,
    runFromSelectedMenuItem,
    runFromSelectedMenuItemHover,
    runSelectedOnlyMenuItem,
    runSelectedOnlyMenuItemHover,
} from '@/features/flows/styles/flowEditorToolBarStyles';
import { flushSync } from 'react-dom';

interface RunButtonProps {
    onRun: () => void;
    onResetExecutionData: () => void;
    onRunFromSelected: () => void;
    onRunSelectedOnly: () => void;
    isDropdownOpen: boolean;
    onDropdownOpenChange: (open: boolean) => void;
}

const RunButton: React.FC<RunButtonProps> = ({
    onRun,
    onResetExecutionData,
    onRunFromSelected,
    onRunSelectedOnly,
    isDropdownOpen,
    onDropdownOpenChange,
}) => {
    return (
        <div style={splitRunButtonContainer}>
            <button
                onClick={() => {
                    // flushSync(() => {
                    //     onResetExecutionData();
                    // });
                    onResetExecutionData();
                    onRun();
                }}
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
                open={isDropdownOpen}
                onOpenChange={onDropdownOpenChange}
            >
                <DropdownMenuTrigger asChild>
                    <button
                        style={dropdownTriggerButton}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor =
                                dropdownTriggerButtonHover.backgroundColor;
                            onDropdownOpenChange(true);
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
                    onMouseEnter={() => onDropdownOpenChange(true)}
                    onMouseLeave={() => onDropdownOpenChange(false)}
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
    );
};

export default RunButton;
