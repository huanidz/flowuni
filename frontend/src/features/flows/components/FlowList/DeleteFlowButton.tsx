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
import { useDeleteFlow } from '@/features/flows/hooks';
import { toast } from 'sonner';

interface DeleteFlowButtonProps {
    flowId: string;
    flowName: string;
}

const DeleteFlowButton: React.FC<DeleteFlowButtonProps> = ({
    flowId,
    flowName,
}) => {
    const { mutate: deleteFlow } = useDeleteFlow();
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    const handleDeleteClick = () => {
        setConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        console.log('delete flow', flowId);
        deleteFlow(flowId);
        toast.success('Flow đã được xóa thành công');
        setConfirmModalOpen(false);
    };

    return (
        <>
            <Button
                onClick={handleDeleteClick}
                variant="ghost"
                size="icon"
                className="text-red-500"
            >
                Delete
            </Button>
            <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Flow</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa flow "{flowName}" (ID:{' '}
                            {flowId}) không?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DeleteFlowButton;
