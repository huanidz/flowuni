import React, { useEffect, useState, useMemo } from 'react';
import { useNodes } from '@xyflow/react';
import { runResolver } from '@/api/resolvers/registry';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, Search, Check } from 'lucide-react';

interface DropdownHandleInputProps {
    label: string;
    description?: string;
    value: any;
    nodeId: string;
    onChange?: (value: string | string[]) => void;
    isWholeAsToolMode?: boolean;

    // Config (NEW)
    type_detail: {
        defaults?: {
            client_resolver?: any;
            multiple?: boolean;
            searchable?: boolean;
            sort_options?: boolean;
            options?: Array<{ label: string; value: string }>;
            hidden?: boolean;
        };
    };
}

export const DropdownHandleInput: React.FC<DropdownHandleInputProps> = ({
    label,
    description,
    value,
    nodeId,
    onChange,
    type_detail,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [resolvedOptions, setResolvedOptions] = useState<
        Array<{ label: string; value: string }>
    >([]);
    const [isOpen, setIsOpen] = useState(false);

    const nodes = useNodes();
    const resolver = type_detail.defaults?.client_resolver;

    const {
        multiple: defaultMultiple = false,
        searchable: defaultSearchable = false,
        sort_options: defaultSortOptions = false,
        options: defaultOptions = [],
        hidden: defaultHidden = false,
    } = type_detail.defaults || {};

    // Get current node data for resolver context
    const currentNode = nodes.find(node => node.id === nodeId);
    const node_input_values: any = currentNode?.data?.input_values || {};

    // Create dependency values excluding the current handle
    const dependencyValues = useMemo(() => {
        if (!resolver) return {};

        const deps = resolver.depends_on || [];
        const depValues: any = {};

        // For conditional resolvers, we need to watch the field_id
        if (resolver.type === 'conditional' && resolver.field_id) {
            if (resolver.field_id !== label) {
                depValues[resolver.field_id] =
                    node_input_values[resolver.field_id];
            }
        }

        // Also include any explicit dependencies
        deps.forEach((dep: string) => {
            if (dep !== label) {
                depValues[dep] = node_input_values[dep];
            }
        });

        return depValues;
    }, [resolver, node_input_values, label]);

    // === RESOLVER HANDLING ===
    useEffect(() => {
        const fetchResolvedOptions = async () => {
            if (!resolver) {
                return;
            }

            try {
                const deps = resolver.depends_on || [];

                // Filter out the current handle from dependencies
                const relevantDeps = deps.filter(
                    (dep: string) => dep !== label
                );

                const allDepsReady = relevantDeps.every(
                    (dep: string) =>
                        node_input_values[dep] !== undefined &&
                        node_input_values[dep] !== ''
                );

                if (!allDepsReady && relevantDeps.length > 0) {
                    setResolvedOptions([]);
                    return;
                }

                const result = await runResolver(resolver, node_input_values);

                let options: Array<{ label: string; value: string }> = [];

                if (Array.isArray(result)) {
                    options = result.map(item =>
                        typeof item === 'string'
                            ? { value: item, label: item }
                            : { value: item.value, label: item.label }
                    );
                } else if (result && typeof result === 'object') {
                    options = [result as { label: string; value: string }];
                }

                setResolvedOptions(options);
            } catch (err) {
                console.error('Error running resolver:', err);
                setResolvedOptions([]);
            }
        };

        fetchResolvedOptions();
    }, [JSON.stringify(dependencyValues)]);

    // Natural sort function for strings
    const naturalSort = (a: string, b: string) => {
        return a.localeCompare(b, undefined, {
            numeric: true,
            sensitivity: 'base',
        });
    };

    // Apply sorting to options if sort_options is enabled
    const optionsToUse = useMemo(() => {
        const options =
            resolvedOptions.length > 0 ? resolvedOptions : defaultOptions || [];

        if (defaultSortOptions && options.length > 0) {
            return [...options].sort((a, b) => naturalSort(a.label, b.label));
        }

        return options;
    }, [resolvedOptions, defaultOptions, defaultSortOptions]);

    // === HANDLE CHANGE LOGIC ===
    const handleChange = (newValue: string | string[]) => {
        if (onChange) {
            onChange(newValue);
        }
    };

    const handleSingleSelect = (selectedValue: string) => {
        handleChange(selectedValue);
    };

    const handleMultipleSelect = (optionValue: string, checked: boolean) => {
        const currentValues = Array.isArray(value) ? value : [];
        const newValues = checked
            ? [...currentValues, optionValue]
            : currentValues.filter(v => v !== optionValue);
        handleChange(newValues);
    };

    // Filter options based on search term
    const filteredOptions = (optionsToUse || []).filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Display value for multiple selection
    const getMultipleDisplayValue = () => {
        if (!Array.isArray(value) || value.length === 0)
            return 'Select items...';
        if (value.length === 1) {
            const option = optionsToUse.find(opt => opt.value === value[0]);
            return option?.label || value[0];
        }
        return `${value.length} items selected`;
    };

    // Don't render if hidden
    if (defaultHidden) {
        return null;
    }

    // Render single select dropdown
    if (!defaultMultiple) {
        return (
            <div className="flex flex-col space-y-2 text-xs w-full">
                {description && (
                    <span className="text-xs text-gray-500 mb-1 leading-relaxed">
                        {description}
                    </span>
                )}
                <Select value={value || ''} onValueChange={handleSingleSelect}>
                    <SelectTrigger className="h-9 text-xs w-full border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-150 bg-white shadow-sm">
                        <SelectValue placeholder="Select an option..." />
                    </SelectTrigger>
                    <SelectContent className="shadow-lg border-gray-200">
                        {defaultSearchable && (
                            <div className="sticky top-0 bg-white z-10 p-2 border-b border-gray-100">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                    <Input
                                        placeholder="Search options..."
                                        value={searchTerm}
                                        onChange={e =>
                                            setSearchTerm(e.target.value)
                                        }
                                        onKeyDown={e => {
                                            e.stopPropagation();
                                        }}
                                        className="pl-8 h-8 text-xs border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="max-h-64 overflow-y-auto">
                            {filteredOptions.length === 0 ? (
                                <div className="p-6 text-center">
                                    <div className="text-xs text-gray-400 italic">
                                        {searchTerm
                                            ? 'No options match your search'
                                            : 'No options available'}
                                    </div>
                                </div>
                            ) : (
                                filteredOptions.map(option => {
                                    const isSelected = value === option.value;
                                    return (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                            className="text-xs py-2 px-3 cursor-pointer transition-colors duration-100 hover:bg-blue-50 focus:bg-blue-50 data-[state=checked]:bg-blue-50 relative"
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span>{option.label}</span>
                                                {isSelected && (
                                                    <Check className="h-3.5 w-3.5 text-blue-600 ml-2" />
                                                )}
                                            </div>
                                        </SelectItem>
                                    );
                                })
                            )}
                        </div>
                    </SelectContent>
                </Select>
            </div>
        );
    }

    // Render multiple select dropdown
    return (
        <div className="flex flex-col space-y-2 text-xs w-full">
            {description && (
                <span className="text-xs text-gray-500 mb-1 leading-relaxed">
                    {description}
                </span>
            )}
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isOpen}
                        className="w-full justify-between h-9 text-xs px-3 border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-150 bg-white shadow-sm"
                    >
                        <span className="truncate flex items-center gap-2">
                            {Array.isArray(value) && value.length > 0 ? (
                                <>
                                    <span>{getMultipleDisplayValue()}</span>
                                    {value.length > 1 && (
                                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full">
                                            {value.length}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-gray-400">
                                    Select items...
                                </span>
                            )}
                        </span>
                        <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-[var(--radix-dropdown-menu-trigger-width)] max-w-[300px] p-0 shadow-lg border-gray-200"
                    align="start"
                >
                    {defaultSearchable && (
                        <div className="sticky top-0 bg-white z-10 p-2 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                <Input
                                    placeholder="Search options..."
                                    value={searchTerm}
                                    onChange={e =>
                                        setSearchTerm(e.target.value)
                                    }
                                    onKeyDown={e => {
                                        e.stopPropagation();
                                    }}
                                    className="pl-8 h-8 text-xs border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}
                    <div className="max-h-64 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="p-6 text-center">
                                <div className="text-xs text-gray-400 italic">
                                    {searchTerm
                                        ? 'No options match your search'
                                        : 'No options available'}
                                </div>
                            </div>
                        ) : (
                            filteredOptions.map(option => {
                                const isChecked =
                                    Array.isArray(value) &&
                                    value.includes(option.value);

                                return (
                                    <DropdownMenuCheckboxItem
                                        key={option.value}
                                        checked={isChecked}
                                        onCheckedChange={checked =>
                                            handleMultipleSelect(
                                                option.value,
                                                checked
                                            )
                                        }
                                        className={`text-xs py-2.5 px-3 cursor-pointer transition-all duration-100 focus:outline-none ${
                                            isChecked
                                                ? 'bg-blue-50 hover:bg-blue-100'
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <span
                                            className={
                                                isChecked
                                                    ? 'font-medium text-blue-900'
                                                    : ''
                                            }
                                        >
                                            {option.label}
                                        </span>
                                    </DropdownMenuCheckboxItem>
                                );
                            })
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
