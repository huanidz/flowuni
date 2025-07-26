import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleConfirmClear = () => {
    onClear();
    toast.success('Flow cleared successfully.', {
      description: 'Flow has been cleared successfully.',
    });
    setIsDropdownOpen(false);
  };

  const handleCancelClear = () => {
    setIsDropdownOpen(false);
  };

  // Auto-dismiss after 3000ms
  useEffect(() => {
    if (isDropdownOpen) {
      const timer = setTimeout(() => {
        setIsDropdownOpen(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isDropdownOpen]);

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
    <div className="absolute top-4 right-4 z-10">
      <div className="bg-white rounded-lg shadow-lg p-2 border">
        <div className="flex gap-2">
          <Button
            onClick={onRun}
            size="sm"
            className="bg-green-500 hover:bg-green-600"
          >
            Run Flow
          </Button>
          
          <Button
            onClick={onCompile}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600"
          >
            Compile Flow
          </Button>
          
          <Button
            onClick={onSave}
            size="sm"
            className="bg-yellow-500 hover:bg-yellow-600"
          >
            Save Flow
          </Button>

          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
              >
                Clear
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="end">
              <div className="p-2">
                <p className="text-sm text-muted-foreground mb-3">Clear the flow?</p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleConfirmClear}
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                  >
                    Yes
                  </Button>
                  <Button
                    onClick={handleCancelClear}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    No
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default FlowToolbar;