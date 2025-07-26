import React, { useState, useEffect } from 'react';
import ConfirmModal from '../ui/ConfirmModal';

interface FlowToolbarProps {
  onRun: () => void;
  onClear: () => void;
  onCompile: () => void;
  onSave: () => void;
}

const FlowToolbar: React.FC<FlowToolbarProps> = ({
  onRun,
  onClear,
  onCompile,
  onSave,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClearClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmClear = () => {
    onClear();
    setIsModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isSaveShortcut = (isMac && e.metaKey) || (!isMac && e.ctrlKey);

      if (isSaveShortcut && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  return (
    <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2 border">
      <div className="flex gap-2">
        <button
          onClick={onRun}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Run Flow
        </button>
        <button
          onClick={onCompile}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Compile Flow
        </button>
        <button
          onClick={onSave}
          className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
        >
          Save Flow
        </button>
        <button
          onClick={handleClearClick}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Clear
        </button>
      </div>
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmClear}
        message="Are you sure you want to clear the flow?"
      />
    </div>
  );
};

export default FlowToolbar;
