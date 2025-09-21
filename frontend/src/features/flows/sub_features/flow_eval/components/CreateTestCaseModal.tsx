import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface CreateTestCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Modal component for creating test cases
 */
const CreateTestCaseModal: React.FC<CreateTestCaseModalProps> = ({
    isOpen,
    onClose,
}) => {
    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Test Case</DialogTitle>
                </DialogHeader>
                {/* Empty content as requested */}
            </DialogContent>
        </Dialog>
    );
};

export default CreateTestCaseModal;
