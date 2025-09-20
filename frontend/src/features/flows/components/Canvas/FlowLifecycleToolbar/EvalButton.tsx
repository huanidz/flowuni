import React from 'react';
import {
    evalButton,
    evalButtonHover,
} from '@/features/flows/styles/flowLifecycleToolbarStyles';

interface EvalButtonProps {
    onEval: () => void;
}

const EvalButton: React.FC<EvalButtonProps> = ({ onEval }) => {
    return (
        <button
            onClick={onEval}
            style={{
                ...evalButton,
                backgroundColor: evalButton.backgroundColor,
                cursor: 'pointer',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.backgroundColor =
                    evalButtonHover.backgroundColor;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.backgroundColor =
                    evalButton.backgroundColor;
            }}
        >
            Eval
        </button>
    );
};

export default EvalButton;
