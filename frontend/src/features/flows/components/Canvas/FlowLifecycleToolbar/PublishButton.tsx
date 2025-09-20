import React from 'react';
import {
    publishButton,
    publishButtonHover,
} from '@/features/flows/styles/flowLifecycleToolbarStyles';

interface PublishButtonProps {
    onPublish: () => void;
}

const PublishButton: React.FC<PublishButtonProps> = ({ onPublish }) => {
    return (
        <button
            onClick={onPublish}
            style={{
                ...publishButton,
                backgroundColor: publishButton.backgroundColor,
                cursor: 'pointer',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.backgroundColor =
                    publishButtonHover.backgroundColor;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.backgroundColor =
                    publishButton.backgroundColor;
            }}
        >
            Publish
        </button>
    );
};

export default PublishButton;
