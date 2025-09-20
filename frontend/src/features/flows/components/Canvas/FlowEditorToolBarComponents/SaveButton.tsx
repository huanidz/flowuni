import React from 'react';
import {
    saveButton,
    saveButtonHover,
} from '@/features/flows/styles/flowEditorToolBarStyles';
import useFlowStore from '@/features/flows/stores/flow_stores';

interface SaveButtonProps {
    onSave: () => void;
}

const SaveButton: React.FC<SaveButtonProps> = ({ onSave }) => {
    const { isSaved } = useFlowStore();
    return (
        <button
            onClick={onSave}
            disabled={isSaved}
            style={{
                ...saveButton,
                backgroundColor: saveButton.backgroundColor,
                cursor: isSaved ? 'default' : 'pointer',
                opacity: isSaved ? 0.5 : 1,
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
            {isSaved ? 'Saved' : '  Save'}
        </button>
    );
};

export default SaveButton;
