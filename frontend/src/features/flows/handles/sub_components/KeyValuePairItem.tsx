import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, HelpCircle } from 'lucide-react';

interface KeyValueItem {
    key: string;
    value: string;
    dtype: 'string' | 'number' | 'boolean';
    required: boolean;
    description?: string;
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
    const description =
        fixedItem?.description || predefinedItem?.description || '';
    const keyPlaceholder =
        fixedItem?.key_placeholder || predefinedItem?.key_placeholder || '';
    const valuePlaceholder =
        fixedItem?.value_placeholder || predefinedItem?.value_placeholder || '';

    const canDelete =
        !disabled &&
        !isFixed &&
        !(isRequired && keyValuePairs.length <= min_pairs);

    const [showDescriptionTooltip, setShowDescriptionTooltip] = useState(false);

    return (
        <div className="group flex gap-2 items-start p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200">
            <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                    {key_label}
                    {isRequired && <span className="text-red-500">*</span>}
                    {isFixed && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
                            Fixed
                        </span>
                    )}
                    {description && (
                        <div
                            style={{ position: 'relative' }}
                            onMouseEnter={() => setShowDescriptionTooltip(true)}
                            onMouseLeave={() =>
                                setShowDescriptionTooltip(false)
                            }
                        >
                            <HelpCircle
                                size={12}
                                className="text-gray-400 hover:text-gray-600 cursor-help transition-colors"
                            />
                            {showDescriptionTooltip && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: '0',
                                        top: '20px',
                                        zIndex: 50,
                                        backgroundColor: '#374151',
                                        color: 'white',
                                        fontSize: '12px',
                                        borderRadius: '6px',
                                        padding: '6px 10px',
                                        boxShadow:
                                            '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        minWidth: '150px',
                                        maxWidth: '250px',
                                        whiteSpace: 'normal',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '-4px',
                                            left: '8px',
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: '#374151',
                                            transform: 'rotate(45deg)',
                                        }}
                                    />
                                    {description}
                                </div>
                            )}
                        </div>
                    )}
                </Label>
                <Input
                    value={keyValue}
                    onChange={e => onKeyChange(index, e.target.value, value)}
                    disabled={disabled || !allow_custom_keys || isFixed}
                    placeholder={keyPlaceholder}
                    className="h-8 text-xs border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
            </div>

            <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">
                    {value_label}
                </Label>
                {isMultiline ? (
                    <textarea
                        value={value}
                        onChange={e =>
                            onKeyChange(index, keyValue, e.target.value)
                        }
                        disabled={disabled}
                        placeholder={valuePlaceholder}
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none resize-none min-h-[64px] disabled:bg-gray-50 disabled:text-gray-500"
                        rows={2}
                    />
                ) : (
                    <Input
                        value={value}
                        onChange={e =>
                            onKeyChange(index, keyValue, e.target.value)
                        }
                        disabled={disabled}
                        placeholder={valuePlaceholder}
                        className="h-8 text-xs border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        type={
                            dtype === 'number'
                                ? 'number'
                                : dtype === 'boolean'
                                  ? 'checkbox'
                                  : 'text'
                        }
                    />
                )}
            </div>

            {canDelete && (
                <div className="flex items-start pt-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(index)}
                        className="h-7 w-7 p-0 rounded-md transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                        title="Remove item"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};
