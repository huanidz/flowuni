import React, { useState } from 'react';
import {
    evalButton,
    evalButtonHover,
} from '@/features/flows/styles/flowLifecycleToolbarStyles';

import LifecycleModal from './LifecycleModal';

interface EvalButtonProps {
    onEval: () => void;
}

const EvalButton: React.FC<EvalButtonProps> = ({ onEval }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => {
                    onEval();
                    setIsOpen(true);
                }}
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
                Evaluate
            </button>
            <LifecycleModal
                open={isOpen}
                onOpenChange={setIsOpen}
                type="eval"
            />
        </>
    );
};

export default EvalButton;
