import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useDeleteFlow } from '@/features/flows/hooks';

interface DeleteFlowButtonProps {
  flowId: string;
  flowName: string;
}

const DeleteFlowButton: React.FC<DeleteFlowButtonProps> = ({ flowId, flowName }) => {
  const { mutate: deleteFlow } = useDeleteFlow();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const handleDeleteClick = () => {
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    console.log('delete flow', flowId);
    deleteFlow(flowId);
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
        🗑️
      </Button>
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        message={`Bạn có chắc chắn muốn xóa flow "${flowName}" không?`}
      />
    </>
  );
};

export default DeleteFlowButton;