import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface KeyValueItem {
    key: string;
    value: string;
    dtype: 'string' | 'number' | 'boolean';
    required: boolean;
    key_placeholder?: string;
    value_placeholder?: string;
    multiline?: boolean;
}

interface KeyValuePairItemProps {
    key_label: string;
    value_label: string;
    keyValue: string;
    value: string;
    index: number;
    fixed_items: KeyValueItem[];
    predefined_items: KeyValueItem[];
    disabled: boolean;
    allow_custom_keys: boolean;
    keyValuePairs: Array<[string, string]>;
    min_pairs: number;
    onKeyChange: (index: number, newKey: string, newValue: string) => void;
    onRemove: (index: number) => void;
}

export const KeyValuePairItem: React.FC<KeyValuePairItemProps> = ({
    key_label,
    value_label,
    keyValue,
    value,
    index,
    fixed_items,
    predefined_items,
    disabled,
    allow_custom_keys,
    keyValuePairs,
    min_pairs,
    onKeyChange,
    onRemove,
}) => {
    // Check if this is a fixed item
    const fixedItem = fixed_items.find(
        (item: KeyValueItem) => item.key === keyValue
    );

    // Check if this is a predefined item
    const predefinedItem = predefined_items.find(
        (item: KeyValueItem) => item.key === keyValue
    );

    const isFixed = !!fixedItem;
    const isRequired = fixedItem?.required || predefinedItem?.required || false;
    const isMultiline =
        fixedItem?.multiline || predefinedItem?.multiline || false;
    const dtype = fixedItem?.dtype || predefinedItem?.dtype || 'string';
    const keyPlaceholder =
        fixedItem?.key_placeholder || predefinedItem?.key_placeholder || '';
    const valuePlaceholder =
        fixedItem?.value_placeholder || predefinedItem?.value_placeholder || '';

    return (
        <div className="flex gap-2 items-start">
            <div className="flex-1">
                <Label className="text-xs">
                    {key_label}
                    {isRequired && <span className="text-red-500 ml-1">*</span>}
                    {isFixed && (
                        <span className="text-blue-500 ml-1">(Fixed)</span>
                    )}
                </Label>
                <Input
                    value={keyValue}
                    onChange={e => onKeyChange(index, e.target.value, value)}
                    disabled={disabled || !allow_custom_keys || isFixed}
                    placeholder={keyPlaceholder}
                    className="text-xs"
                />
            </div>
            <div className="flex-1">
                <Label className="text-xs">{value_label}</Label>
                {isMultiline ? (
                    <textarea
                        value={value}
                        onChange={e =>
                            onKeyChange(index, keyValue, e.target.value)
                        }
                        disabled={disabled} // Allow editing value even for fixed items
                        placeholder={valuePlaceholder}
                        className="w-full p-2 border rounded text-xs resize-none min-h-[60px]"
                        rows={2}
                    />
                ) : (
                    <Input
                        value={value}
                        onChange={e =>
                            onKeyChange(index, keyValue, e.target.value)
                        }
                        disabled={disabled} // Allow editing value even for fixed items
                        placeholder={valuePlaceholder}
                        className="text-xs"
                        type={
                            (dtype as 'number') === 'number'
                                ? 'number'
                                : (dtype as 'boolean') === 'boolean'
                                  ? 'checkbox'
                                  : 'text'
                        }
                    />
                )}
            </div>
            <div className="flex items-end">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                    disabled={
                        disabled ||
                        isFixed || // Keep isFixed to prevent deletion of fixed items
                        (isRequired && keyValuePairs.length <= min_pairs)
                    }
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                    ×
                </Button>
            </div>
        </div>
    );
};
