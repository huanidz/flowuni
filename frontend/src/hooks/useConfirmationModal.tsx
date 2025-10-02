// hooks/useConfirmation.tsx
import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmationOptions {
    title: string;
    description: string | ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive' | 'secondary';
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
}

export const useConfirmation = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmationOptions | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const confirm = useCallback((opts: ConfirmationOptions) => {
        setOptions(opts);
        setIsOpen(true);
    }, []);

    const handleConfirm = useCallback(async () => {
        if (!options) return;

        setIsLoading(true);
        try {
            await options.onConfirm();
            setIsOpen(false);
        } catch (error) {
            console.error('Confirmation action failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, [options]);

    const handleCancel = useCallback(() => {
        if (isLoading) return;

        options?.onCancel?.();
        setIsOpen(false);
    }, [isLoading, options]);

    // Clear options when dialog closes
    useEffect(() => {
        if (!isOpen && options) {
            const timer = setTimeout(() => {
                setOptions(null);
            }, 300); // Match dialog animation duration
            return () => clearTimeout(timer);
        }
    }, [isOpen, options]);

    // Force cleanup of any stuck overlays
    useEffect(() => {
        if (!isOpen) {
            // Small delay to ensure Dialog has finished its cleanup
            const timer = setTimeout(() => {
                // Remove any stuck Radix overlays
                const overlays = document.querySelectorAll(
                    '[data-radix-dialog-overlay]'
                );
                overlays.forEach(overlay => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                });

                // Reset body styles that might be stuck
                document.body.style.pointerEvents = '';
                document.body.style.overflow = '';
            }, 350);

            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const ConfirmationDialog = useCallback(() => {
        if (!options) return null;

        return (
            <Dialog
                open={isOpen}
                onOpenChange={open => {
                    if (!open && !isLoading) {
                        handleCancel();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{options.title}</DialogTitle>
                        <DialogDescription>
                            {options.description}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                        >
                            {options.cancelText || 'Cancel'}
                        </Button>
                        <Button
                            variant={options.variant || 'default'}
                            onClick={handleConfirm}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? 'Processing...'
                                : options.confirmText || 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }, [options, isOpen, isLoading, handleConfirm, handleCancel]);

    return {
        confirm,
        ConfirmationDialog,
        isOpen,
        isLoading,
    };
};
