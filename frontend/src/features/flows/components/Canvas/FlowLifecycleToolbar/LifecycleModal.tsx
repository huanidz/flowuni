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
import useFlowStore from '@/features/flows/stores/flow_stores';

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
    const { current_flow } = useFlowStore();

    const flowId = current_flow?.flow_id;

    const renderContent = () => {
        switch (type) {
            case 'version':
                return flowId ? (
                    <LCVersionContent flowId={flowId} />
                ) : (
                    <div>Flow ID is required</div>
                );
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
                className="h-[80vh] flex flex-col"
                style={{ maxWidth: '1400px', width: '50vw' }}
            >
                <DialogHeader
                    className="flex-shrink-0"
                    style={{ display: 'none' }}
                >
                    <DialogTitle>{getTitle(type)}</DialogTitle>
                    <DialogDescription>
                        {getDescription(type)}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto py-4">
                    {renderContent()}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LifecycleModal;
