import React, { useState, useEffect } from 'react';
import type { IOTypeDetail } from '@/features/nodes/types';
import { KeyValuePairItem } from '../sub_components/KeyValuePairItem';
import { AddNewPairSection } from '../sub_components/AddNewPairSection';

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
                {keyValuePairs.map(([key, value], index) => (
                    <KeyValuePairItem
                        key={index}
                        key_label={key_label}
                        value_label={value_label}
                        keyValue={key}
                        value={value}
                        index={index}
                        fixed_items={fixed_items}
                        predefined_items={predefined_items}
                        disabled={disabled}
                        allow_custom_keys={allow_custom_keys}
                        keyValuePairs={keyValuePairs}
                        min_pairs={min_pairs}
                        onKeyChange={handleUpdatePair}
                        onRemove={handleRemovePair}
                    />
                ))}
            </div>

            {/* Add new pair section */}
            {allow_custom_keys && canAddMore && !disabled && (
                <AddNewPairSection
                    key_label={key_label}
                    value_label={value_label}
                    newKey={newKey}
                    newValue={newValue}
                    onKeyChange={setNewKey}
                    onValueChange={setNewValue}
                    onAdd={handleAddPair}
                    disabled={disabled}
                />
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
