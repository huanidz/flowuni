import React from 'react';
import {
    toolbarContainer,
    toolbarWrapper,
} from '@/features/flows/styles/flowLifecycleToolbarStyles';
import VersionButton from './FlowLifecycleToolbar/VersionButton';
import EvalButton from './FlowLifecycleToolbar/EvalButton';
import PublishButton from './FlowLifecycleToolbar/PublishButton';

// Interface for the toolbar props
interface FlowLifecycleToolbarProps {
    onVersion: () => void;
    onEval: () => void;
    onPublish: () => void;
}

const FlowLifecycleToolbar: React.FC<FlowLifecycleToolbarProps> = ({
    onVersion,
    onEval,
    onPublish,
}) => {
    return (
        <div style={toolbarContainer}>
            <div style={toolbarWrapper}>
                <VersionButton onVersion={onVersion} />
                <EvalButton onEval={onEval} />
                <PublishButton onPublish={onPublish} />
            </div>
        </div>
    );
};

export default FlowLifecycleToolbar;
