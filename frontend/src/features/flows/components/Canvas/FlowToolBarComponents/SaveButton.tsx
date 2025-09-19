import React from 'react';
import {
    saveButton,
    saveButtonHover,
} from '@/features/flows/styles/flowToolBarStyles';

interface SaveButtonProps {
    onSave: () => void;
    isSaved: boolean;
}

const SaveButton: React.FC<SaveButtonProps> = ({ onSave, isSaved }) => {
    return (
        <button
            onClick={onSave}
            disabled={isSaved}
            style={{
                ...saveButton,
                backgroundColor: isSaved
                    ? '#10B981'
                    : saveButton.backgroundColor,
                cursor: isSaved ? 'default' : 'pointer',
                opacity: isSaved ? 0.8 : 1,
            }}
            onMouseEnter={e => {
                if (!isSaved) {
                    e.currentTarget.style.backgroundColor =
                        saveButtonHover.backgroundColor;
                }
            }}
            onMouseLeave={e => {
                if (!isSaved) {
                    e.currentTarget.style.backgroundColor =
                        saveButton.backgroundColor;
                }
            }}
        >
            {isSaved ? 'Saved' : 'Save'}
        </button>
    );
};

export default SaveButton;
