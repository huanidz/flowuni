import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    clearButton,
    clearButtonHover,
} from '@/features/flows/styles/flowToolBarStyles';

interface ResetDataButtonProps {
    onResetAllData: () => void;
    onResetExecutionData: () => void;
}

const ResetDataButton: React.FC<ResetDataButtonProps> = ({
    onResetAllData,
    onResetExecutionData,
}) => {
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const handleResetDataClick = () => {
        setConfirmDialogOpen(true);
    };

    const handleCancel = () => {
        setConfirmDialogOpen(false);
    };

    const handleResetAll = () => {
        onResetAllData();
        console.log('All node data reset successfully.');
        setConfirmDialogOpen(false);
    };

    const handleResetExecution = () => {
        onResetExecutionData();
        console.log('Execution data reset successfully.');
        setConfirmDialogOpen(false);
    };

    return (
        <>
            <button
                style={clearButton}
                onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor =
                        clearButtonHover.backgroundColor;
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor =
                        clearButton.backgroundColor;
                }}
                onClick={handleResetDataClick}
            >
                Reset Data
            </button>
            <Dialog
                open={confirmDialogOpen}
                onOpenChange={setConfirmDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Node Data</DialogTitle>
                        <DialogDescription>
                            Choose what data you want to reset for all nodes in
                            the flow:
                            <ul className="mt-2 space-y-1">
                                <li>
                                    <strong>Clear All:</strong> Resets input
                                    values, output values, execution results,
                                    and execution status for all nodes to their
                                    initial state.
                                </li>
                                <li>
                                    <strong>Clear Execution:</strong> Resets
                                    only output values, execution results, and
                                    execution status. Preserves all input
                                    values.
                                </li>
                            </ul>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex space-x-2">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleResetExecution}
                        >
                            Clear Execution
                        </Button>
                        <Button variant="destructive" onClick={handleResetAll}>
                            Clear All
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ResetDataButton;
