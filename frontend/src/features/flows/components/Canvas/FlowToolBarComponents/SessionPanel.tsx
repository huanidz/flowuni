import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    const [confirmResetOpen, setConfirmResetOpen] = useState(false);

    const handleResetClick = () => {
        setConfirmResetOpen(true);
    };

    const handleConfirmReset = () => {
        resetSessionId();
        setConfirmResetOpen(false);
    };

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
                    onClick={handleResetClick}
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
                <Dialog
                    open={confirmResetOpen}
                    onOpenChange={setConfirmResetOpen}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reset Session ID</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to reset the session ID?
                                This will start a new session and clear any
                                existing session data.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setConfirmResetOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmReset}
                            >
                                Reset
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default SessionPanel;
