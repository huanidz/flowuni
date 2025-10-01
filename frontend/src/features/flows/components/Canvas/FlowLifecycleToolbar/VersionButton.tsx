import React, { useState } from 'react';
import {
    versionButton,
    versionButtonHover,
} from '@/features/flows/styles/flowLifecycleToolbarStyles';

import LifecycleModal from './LifecycleModal';

interface VersionButtonProps {
    onVersion: () => void;
}

const VersionButton: React.FC<VersionButtonProps> = ({ onVersion }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => {
                    onVersion();
                    setIsOpen(true);
                }}
                style={{
                    ...versionButton,
                    backgroundColor: versionButton.backgroundColor,
                    cursor: 'pointer',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor =
                        versionButtonHover.backgroundColor;
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor =
                        versionButton.backgroundColor;
                }}
            >
                Snapshots
            </button>
            <LifecycleModal
                open={isOpen}
                onOpenChange={setIsOpen}
                type="version"
            />
        </>
    );
};

export default VersionButton;
