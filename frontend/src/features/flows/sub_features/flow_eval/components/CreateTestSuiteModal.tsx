import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

interface CreateTestSuiteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (suiteName: string, suiteDescription: string) => void;
}

/**
 * Modal component for creating test suites
 */
const CreateTestSuiteModal: React.FC<CreateTestSuiteModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
}) => {
    const [suiteName, setSuiteName] = React.useState('');
    const [suiteDescription, setSuiteDescription] = React.useState('');

    const handleClose = () => {
        onClose();
        setSuiteName('');
        setSuiteDescription('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(suiteName, suiteDescription);
        handleClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Test Suite</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {/* Test Suite Name */}
                        <div className="space-y-2">
                            <Label htmlFor="suiteName">Test Suite Name *</Label>
                            <Input
                                id="suiteName"
                                value={suiteName}
                                onChange={e => setSuiteName(e.target.value)}
                                placeholder="Enter test suite name"
                                required
                            />
                        </div>

                        {/* Test Suite Description */}
                        <div className="space-y-2">
                            <Label htmlFor="suiteDescription">
                                Description
                            </Label>
                            <Textarea
                                id="suiteDescription"
                                value={suiteDescription}
                                onChange={e =>
                                    setSuiteDescription(e.target.value)
                                }
                                rows={3}
                                placeholder="Enter test suite description (optional)"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!suiteName.trim()}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            Create Test Suite
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateTestSuiteModal;
