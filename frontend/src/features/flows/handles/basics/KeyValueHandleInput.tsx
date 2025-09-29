import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { IOTypeDetail } from '@/features/nodes/types';

interface KeyValueItem {
    key: string;
    value: string;
    dtype: 'string' | 'number' | 'boolean';
    required: boolean;
    key_placeholder?: string;
    value_placeholder?: string;
    multiline?: boolean;
}

interface KeyValueHandleInputProps {
    label: string;
    description?: string;
    value: Record<string, string>;
    onChange?: (value: Record<string, string>) => void;
    type_detail: IOTypeDetail;
    disabled: boolean;
    isWholeAsToolMode?: boolean;
}

export const KeyValueHandleInput: React.FC<KeyValueHandleInputProps> = ({
    label,
    description,
    value,
    onChange,
    type_detail,
    disabled = true,
    isWholeAsToolMode = false,
}) => {
    const {
        key_label = 'Key',
        value_label = 'Value',
        fixed_items = [],
        predefined_items = [],
        allow_custom_keys = true,
        allow_duplicate_keys = false,
        min_pairs = 0,
        max_pairs,
        key_pattern,
        value_pattern,
        hidden = false,
    } = type_detail.defaults || {};

    const [keyValuePairs, setKeyValuePairs] = useState<Array<[string, string]>>(
        []
    );
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    // Initialize from value prop
    useEffect(() => {
        if (value) {
            const pairs = Object.entries(value) as [string, string][];
            setKeyValuePairs(pairs);
        } else {
            // Initialize with fixed items first, then predefined items
            const fixedPairs = fixed_items.map((item: KeyValueItem) => [
                item.key,
                item.value,
            ]) as [string, string][];

            const predefinedPairs = predefined_items.map(
                (item: KeyValueItem) => [item.key, item.value]
            ) as [string, string][];

            setKeyValuePairs([...fixedPairs, ...predefinedPairs]);
        }
    }, [value, fixed_items, predefined_items]);

    // Validate key against pattern
    const isValidKey = (key: string): boolean => {
        if (!key_pattern) return true;
        try {
            const regex = new RegExp(key_pattern);
            return regex.test(key);
        } catch {
            return true; // Invalid regex pattern, allow any key
        }
    };

    // Validate value against pattern
    const isValidValue = (value: string): boolean => {
        if (!value_pattern) return true;
        try {
            const regex = new RegExp(value_pattern);
            return regex.test(value);
        } catch {
            return true; // Invalid regex pattern, allow any value
        }
    };

    // Check if key already exists (if duplicates not allowed)
    const isKeyDuplicate = (key: string, excludeIndex?: number): boolean => {
        if (allow_duplicate_keys) return false;

        return keyValuePairs.some(
            (pair, index) => pair[0] === key && index !== excludeIndex
        );
    };

    const handleAddPair = () => {
        if (!newKey.trim() || !newValue.trim()) return;
        if (!isValidKey(newKey)) return;

        // For new items, default to string type
        const dtype: 'string' | 'number' | 'boolean' = 'string';

        // Convert value based on dtype
        let convertedValue: string = newValue;
        if ((dtype as 'number') === 'number') {
            convertedValue = newValue;
        } else if ((dtype as 'boolean') === 'boolean') {
            convertedValue =
                newValue.toLowerCase() === 'true' ? 'true' : 'false';
        }

        if (!isValidValue(convertedValue)) return;
        if (isKeyDuplicate(newKey)) return;

        const newPair = [newKey.trim(), convertedValue] as [string, string];
        const updatedPairs = [...keyValuePairs, newPair];
        setKeyValuePairs(updatedPairs);
        setNewKey('');
        setNewValue('');

        // Notify parent
        if (onChange) {
            const newValueObj = Object.fromEntries(updatedPairs);
            onChange(newValueObj);
        }
    };

    const handleUpdatePair = (
        index: number,
        newKey: string,
        newValue: string
    ) => {
        if (!newKey.trim()) return;
        if (!isValidKey(newKey)) return;

        // Check if this is a fixed item
        const fixedItem = fixed_items.find(
            (item: KeyValueItem) => item.key === keyValuePairs[index][0]
        );

        // Check if this is a predefined item
        const predefinedItem = predefined_items.find(
            (item: KeyValueItem) => item.key === keyValuePairs[index][0]
        );

        const dtype = fixedItem?.dtype || predefinedItem?.dtype || 'string';

        // Convert value based on dtype
        let convertedValue: string = newValue;
        if ((dtype as 'number') === 'number') {
            convertedValue = newValue;
        } else if ((dtype as 'boolean') === 'boolean') {
            convertedValue =
                newValue.toLowerCase() === 'true' ? 'true' : 'false';
        }

        if (!isValidValue(convertedValue)) return;
        if (isKeyDuplicate(newKey, index)) return;

        const updatedPairs = [...keyValuePairs];
        updatedPairs[index] = [newKey.trim(), convertedValue];
        setKeyValuePairs(updatedPairs);

        // Notify parent
        if (onChange) {
            const newValueObj = Object.fromEntries(updatedPairs);
            onChange(newValueObj);
        }
    };

    const handleRemovePair = (index: number) => {
        const updatedPairs = keyValuePairs.filter((_, i) => i !== index);
        setKeyValuePairs(updatedPairs);

        // Notify parent
        if (onChange) {
            const newValueObj = Object.fromEntries(updatedPairs);
            onChange(newValueObj);
        }
    };

    // Check if we can add more pairs
    const canAddMore = !max_pairs || keyValuePairs.length < max_pairs;

    // Check if minimum pairs requirement is met
    const meetsMinPairs = keyValuePairs.length >= min_pairs;

    // Don't render if hidden
    if (hidden) {
        return null;
    }

    return (
        <div className="flex flex-col space-y-4 w-full">
            {description && (
                <span className="text-xs text-gray-600">{description}</span>
            )}

            {/* Existing key-value pairs */}
            <div className="space-y-2">
                {keyValuePairs.map(([key, value], index) => {
                    // Check if this is a fixed item
                    const fixedItem = fixed_items.find(
                        (item: KeyValueItem) => item.key === key
                    );

                    // Check if this is a predefined item
                    const predefinedItem = predefined_items.find(
                        (item: KeyValueItem) => item.key === key
                    );

                    const isFixed = !!fixedItem;
                    const isRequired =
                        fixedItem?.required ||
                        predefinedItem?.required ||
                        false;
                    const isMultiline =
                        fixedItem?.multiline ||
                        predefinedItem?.multiline ||
                        false;
                    const dtype =
                        fixedItem?.dtype || predefinedItem?.dtype || 'string';
                    const keyPlaceholder =
                        fixedItem?.key_placeholder ||
                        predefinedItem?.key_placeholder ||
                        '';
                    const valuePlaceholder =
                        fixedItem?.value_placeholder ||
                        predefinedItem?.value_placeholder ||
                        '';

                    return (
                        <div key={index} className="flex gap-2 items-start">
                            <div className="flex-1">
                                <Label className="text-xs">
                                    {key_label}
                                    {isRequired && (
                                        <span className="text-red-500 ml-1">
                                            *
                                        </span>
                                    )}
                                    {isFixed && (
                                        <span className="text-blue-500 ml-1">
                                            (Fixed)
                                        </span>
                                    )}
                                </Label>
                                <Input
                                    value={key}
                                    onChange={e =>
                                        handleUpdatePair(
                                            index,
                                            e.target.value,
                                            value
                                        )
                                    }
                                    disabled={
                                        disabled ||
                                        !allow_custom_keys ||
                                        isFixed
                                    }
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
                                            handleUpdatePair(
                                                index,
                                                key,
                                                e.target.value
                                            )
                                        }
                                        disabled={disabled || isFixed}
                                        placeholder={valuePlaceholder}
                                        className="w-full p-2 border rounded text-xs resize-none min-h-[60px]"
                                        rows={2}
                                    />
                                ) : (
                                    <Input
                                        value={value}
                                        onChange={e =>
                                            handleUpdatePair(
                                                index,
                                                key,
                                                e.target.value
                                            )
                                        }
                                        disabled={disabled || isFixed}
                                        placeholder={valuePlaceholder}
                                        className="text-xs"
                                        type={
                                            (dtype as 'number') === 'number'
                                                ? 'number'
                                                : (dtype as 'boolean') ===
                                                    'boolean'
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
                                    onClick={() => handleRemovePair(index)}
                                    disabled={
                                        disabled ||
                                        isFixed ||
                                        (isRequired &&
                                            keyValuePairs.length <= min_pairs)
                                    }
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                    ×
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add new pair section */}
            {allow_custom_keys && canAddMore && !disabled && (
                <div className="flex gap-2 items-start border-t pt-4">
                    <div className="flex-1">
                        <Label className="text-xs">{key_label}</Label>
                        <Input
                            value={newKey}
                            onChange={e => setNewKey(e.target.value)}
                            placeholder="Enter key..."
                            className="text-xs"
                        />
                    </div>
                    <div className="flex-1">
                        <Label className="text-xs">{value_label}</Label>
                        <Input
                            value={newValue}
                            onChange={e => setNewValue(e.target.value)}
                            placeholder="Enter value..."
                            className="text-xs"
                        />
                    </div>
                    <div className="flex items-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddPair}
                            disabled={!newKey.trim() || !newValue.trim()}
                            className="h-8 px-3"
                        >
                            Add
                        </Button>
                    </div>
                </div>
            )}

            {/* Validation messages */}
            {!meetsMinPairs && (
                <div className="text-xs text-red-500">
                    Minimum {min_pairs} key-value pairs required
                </div>
            )}
            {max_pairs && keyValuePairs.length >= max_pairs && (
                <div className="text-xs text-orange-500">
                    Maximum {max_pairs} key-value pairs allowed
                </div>
            )}
        </div>
    );
};
