import React, { useState } from 'react';
import {
    publishButton,
    publishButtonHover,
} from '@/features/flows/styles/flowLifecycleToolbarStyles';

import LifecycleModal from './LifecycleModal';

interface PublishButtonProps {
    onPublish: () => void;
}

const PublishButton: React.FC<PublishButtonProps> = ({ onPublish }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => {
                    onPublish();
                    setIsOpen(true);
                }}
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
            <LifecycleModal
                open={isOpen}
                onOpenChange={setIsOpen}
                type="publish"
            />
        </>
    );
};

export default PublishButton;
