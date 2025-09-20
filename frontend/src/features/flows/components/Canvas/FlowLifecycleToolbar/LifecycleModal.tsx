import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import LCVersionContent from './LCVersionContent';
import LCEvalContent from './LCEvalContent';
import LCPublishContent from './LCPublishContent';

type ModalType = 'version' | 'eval' | 'publish';

interface LifecycleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: ModalType;
}

const getTitle = (type: ModalType): string => {
    switch (type) {
        case 'version':
            return 'Version Management';
        case 'eval':
            return 'Flow Evaluation';
        case 'publish':
            return 'Publish Flow';
        default:
            return 'Lifecycle Action';
    }
};

const getDescription = (type: ModalType): string => {
    switch (type) {
        case 'version':
            return 'Manage versions of your flow.';
        case 'eval':
            return 'Evaluate your flow performance.';
        case 'publish':
            return 'Publish your flow to make it available.';
        default:
            return '';
    }
};

const LifecycleModal: React.FC<LifecycleModalProps> = ({
    open,
    onOpenChange,
    type,
}) => {
    const renderContent = () => {
        switch (type) {
            case 'version':
                return <LCVersionContent />;
            case 'eval':
                return <LCEvalContent />;
            case 'publish':
                return <LCPublishContent />;
            default:
                return (
                    <div className="p-4">
                        <p>Unknown content type.</p>
                    </div>
                );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="h-[80vh] overflow-y-auto"
                style={{ maxWidth: '1400px', width: '50vw' }}
            >
                <DialogHeader>
                    <DialogTitle>{getTitle(type)}</DialogTitle>
                    <DialogDescription>
                        {getDescription(type)}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">{renderContent()}</div>
            </DialogContent>
        </Dialog>
    );
};

export default LifecycleModal;
