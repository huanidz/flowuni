import React from 'react';
import {
    playgroundButton,
    playgroundButtonHover,
} from '@/features/flows/styles/flowEditorToolBarStyles';

interface PlaygroundButtonProps {
    onPlayground: () => void;
}

const PlaygroundButton: React.FC<PlaygroundButtonProps> = ({
    onPlayground,
}) => {
    return (
        <button
            onClick={onPlayground}
            style={playgroundButton}
            onMouseEnter={e => {
                e.currentTarget.style.backgroundColor =
                    playgroundButtonHover.backgroundColor;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.backgroundColor =
                    playgroundButton.backgroundColor;
            }}
        >
            Playground
        </button>
    );
};

export default PlaygroundButton;
