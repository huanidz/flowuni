import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useActivateFlow } from '@/features/flows/hooks';
import { toast } from 'sonner';
import type { Flow } from '@/features/flows/types';

interface ActivateDeactivateButtonProps {
    flow: Flow;
}

const ActivateDeactivateButton: React.FC<ActivateDeactivateButtonProps> = ({
    flow,
}) => {
    const { mutate: activateFlow, isPending } = useActivateFlow();
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    const handleToggleClick = () => {
        setConfirmModalOpen(true);
    };

    const handleConfirmToggle = () => {
        const newIsActive = !flow.is_active;
        activateFlow(
            {
                flow_id: flow.flow_id,
                is_active: newIsActive,
            },
            {
                onSuccess: () => {
                    toast.success(
                        newIsActive
                            ? 'Flow đã được kích hoạt thành công'
                            : 'Flow đã được tạm dừng thành công'
                    );
                    setConfirmModalOpen(false);
                },
                onError: error => {
                    console.error('Error toggling flow activation:', error);
                    toast.error(
                        newIsActive
                            ? 'Không thể kích hoạt flow'
                            : 'Không thể tạm dừng flow'
                    );
                },
            }
        );
    };

    const getButtonText = () => {
        if (isPending) return 'Đang xử lý...';
        return flow.is_active ? 'Deactivate' : 'Activate';
    };

    return (
        <>
            <Button
                onClick={handleToggleClick}
                variant="ghost"
                size="sm"
                disabled={isPending}
                style={{
                    backgroundColor: flow.is_active ? '#f97316' : '#22c55e',
                    color: '#fff',
                }}
            >
                {getButtonText()}
            </Button>
            <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {flow.is_active
                                ? 'Tạm dừng Flow'
                                : 'Kích hoạt Flow'}
                        </DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn{' '}
                            {flow.is_active ? 'tạm dừng' : 'kích hoạt'} flow "
                            {flow.name}" (ID: {flow.flow_id}) không?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmModalOpen(false)}
                            disabled={isPending}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleConfirmToggle}
                            disabled={isPending}
                            style={{
                                backgroundColor: flow.is_active
                                    ? '#f97316'
                                    : '#22c55e',
                                color: '#fff',
                            }}
                        >
                            {isPending
                                ? 'Đang xử lý...'
                                : flow.is_active
                                  ? 'Tạm dừng'
                                  : 'Kích hoạt'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ActivateDeactivateButton;
