import React from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    clearButton,
    clearButtonHover,
} from '@/features/flows/styles/flowToolBarStyles';

interface ClearButtonProps {
    onClear: () => void;
    isDropdownOpen: boolean;
    onDropdownOpenChange: (open: boolean) => void;
}

const ClearButton: React.FC<ClearButtonProps> = ({
    onClear,
    isDropdownOpen,
    onDropdownOpenChange,
}) => {
    const handleConfirmClear = () => {
        onClear();
        console.log('Flow cleared successfully.');
        onDropdownOpenChange(false);
    };

    const handleCancelClear = () => {
        onDropdownOpenChange(false);
    };

    return (
        <DropdownMenu open={isDropdownOpen} onOpenChange={onDropdownOpenChange}>
            <DropdownMenuTrigger asChild>
                <button
                    style={clearButton}
                    onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor =
                            clearButtonHover.backgroundColor;
                        onDropdownOpenChange(true);
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor =
                            clearButton.backgroundColor;
                    }}
                >
                    Clear
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-48"
                align="end"
                onMouseEnter={() => onDropdownOpenChange(true)}
                onMouseLeave={() => onDropdownOpenChange(false)}
            >
                <div className="p-2">
                    <p className="text-sm text-muted-foreground mb-3">
                        Clear the flow?
                    </p>
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
    );
};

export default ClearButton;
