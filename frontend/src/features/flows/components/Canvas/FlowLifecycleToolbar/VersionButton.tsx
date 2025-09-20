import React from 'react';
import {
    versionButton,
    versionButtonHover,
} from '@/features/flows/styles/flowLifecycleToolbarStyles';

interface VersionButtonProps {
    onVersion: () => void;
}

const VersionButton: React.FC<VersionButtonProps> = ({ onVersion }) => {
    return (
        <button
            onClick={onVersion}
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
            Version
        </button>
    );
};

export default VersionButton;
