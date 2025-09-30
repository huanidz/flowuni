import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface AddNewPairSectionProps {
    key_label: string;
    value_label: string;
    newKey: string;
    newValue: string;
    onKeyChange: (value: string) => void;
    onValueChange: (value: string) => void;
    onAdd: () => void;
    disabled: boolean;
}

export const AddNewPairSection: React.FC<AddNewPairSectionProps> = ({
    key_label,
    value_label,
    newKey,
    newValue,
    onKeyChange,
    onValueChange,
    onAdd,
    disabled,
}) => {
    return (
        <div className="flex gap-2 items-start border-t pt-4">
            <div className="flex-1">
                <Label className="text-xs">{key_label}</Label>
                <Input
                    value={newKey}
                    onChange={e => onKeyChange(e.target.value)}
                    placeholder="Enter key..."
                    className="text-xs"
                />
            </div>
            <div className="flex-1">
                <Label className="text-xs">{value_label}</Label>
                <Input
                    value={newValue}
                    onChange={e => onValueChange(e.target.value)}
                    placeholder="Enter value..."
                    className="text-xs"
                />
            </div>
            <div className="flex items-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onAdd}
                    disabled={!newKey.trim() || !newValue.trim() || disabled}
                    className="h-8 px-3"
                >
                    Add
                </Button>
            </div>
        </div>
    );
};
