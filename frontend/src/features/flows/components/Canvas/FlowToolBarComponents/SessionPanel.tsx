import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import useExecutionStore from '@/features/flows/stores/execution_store';
import {
    sessionPanel,
    sessionCheckbox,
    sessionLabel,
    sessionIdText,
    resetButton,
    resetButtonHover,
} from '@/features/flows/styles/flowToolBarStyles';

const SessionPanel: React.FC = () => {
    const { sessionId, isSessionEnabled, setSessionEnabled, resetSessionId } =
        useExecutionStore();

    return (
        <div style={sessionPanel}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                }}
            >
                <Checkbox
                    id="session-checkbox"
                    checked={isSessionEnabled}
                    onCheckedChange={checked =>
                        setSessionEnabled(checked as boolean)
                    }
                    style={sessionCheckbox}
                />
                <Label htmlFor="session-checkbox" style={sessionLabel}>
                    Enable Session
                </Label>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'help',
                        color: '#666',
                        fontSize: '12px',
                    }}
                    title="Session will preserve ChatInput and ChatOutput as messages, it will affect some nodes like MemoryNode"
                >
                    <Info size={12} />
                </div>
            </div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                }}
            >
                <span style={sessionIdText} title={sessionId}>
                    {sessionId}
                </span>
                <button
                    onClick={resetSessionId}
                    style={resetButton}
                    onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor =
                            resetButtonHover.backgroundColor;
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor =
                            resetButton.backgroundColor;
                    }}
                    title="Reset session ID"
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default SessionPanel;
