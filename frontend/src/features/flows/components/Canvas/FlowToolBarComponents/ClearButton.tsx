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

interface ClearButtonProps {
    onClear: () => void;
}

const ClearButton: React.FC<ClearButtonProps> = ({ onClear }) => {
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const handleClearClick = () => {
        setConfirmDialogOpen(true);
    };

    const handleConfirmClear = () => {
        onClear();
        console.log('Flow cleared successfully.');
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
                onClick={handleClearClick}
            >
                Clear
            </button>
            <Dialog
                open={confirmDialogOpen}
                onOpenChange={setConfirmDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Clear Flow</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to clear the flow? This action
                            will remove all nodes and connections and cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmClear}
                        >
                            Clear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ClearButton;
