import React from 'react';
import {
    compileButton,
    compileButtonHover,
} from '@/features/flows/styles/flowEditorToolBarStyles';

interface CompileButtonProps {
    onCompile: () => void;
}

const CompileButton: React.FC<CompileButtonProps> = ({ onCompile }) => {
    return (
        <button
            onClick={onCompile}
            style={compileButton}
            onMouseEnter={e => {
                e.currentTarget.style.backgroundColor =
                    compileButtonHover.backgroundColor;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.backgroundColor =
                    compileButton.backgroundColor;
            }}
        >
            Compile
        </button>
    );
};

export default CompileButton;
