import React from 'react';
import {
    saveButton,
    saveButtonHover,
} from '@/features/flows/styles/flowToolBarStyles';

interface SaveButtonProps {
    onSave: () => void;
}

const SaveButton: React.FC<SaveButtonProps> = ({ onSave }) => {
    return (
        <button
            onClick={onSave}
            style={saveButton}
            onMouseEnter={e => {
                e.currentTarget.style.backgroundColor =
                    saveButtonHover.backgroundColor;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.backgroundColor =
                    saveButton.backgroundColor;
            }}
        >
            Save
        </button>
    );
};

export default SaveButton;
