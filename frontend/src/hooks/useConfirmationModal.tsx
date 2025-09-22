// hooks/useConfirmation.tsx
import { useState, useCallback, type ReactNode } from 'react';
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
            setOptions(null);
        } catch (error) {
            console.error('Confirmation action failed:', error);
            // Keep dialog open on error so user can retry
        } finally {
            setIsLoading(false);
        }
    }, [options]);

    const handleClose = useCallback(() => {
        if (isLoading) return; // Prevent closing during loading

        setIsOpen(false);
        setOptions(null);
        setIsLoading(false);

        // Call onCancel if provided
        options?.onCancel?.();
    }, [isLoading, options]);

    const ConfirmationDialog = useCallback(() => {
        if (!options) return null;

        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
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
                            onClick={handleClose}
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
    }, [options, isOpen, isLoading, handleConfirm, handleClose]);

    return {
        confirm,
        ConfirmationDialog,
        isOpen,
        isLoading,
    };
};
