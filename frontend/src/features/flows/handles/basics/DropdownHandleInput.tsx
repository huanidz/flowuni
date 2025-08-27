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
import { ChevronDown, Search } from 'lucide-react';

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

    const optionsToUse =
        resolvedOptions.length > 0 ? resolvedOptions : defaultOptions || [];

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
                    <span className="text-xs text-gray-600 mb-1">
                        {description}
                    </span>
                )}
                <Select value={value || ''} onValueChange={handleSingleSelect}>
                    <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        {defaultSearchable && (
                            <div className="p-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={e =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="pl-8 h-8 text-xs"
                                    />
                                </div>
                            </div>
                        )}
                        {filteredOptions.length === 0 ? (
                            <div className="p-2 text-xs text-gray-600 italic">
                                No options found
                            </div>
                        ) : (
                            filteredOptions.map(option => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="text-xs"
                                >
                                    {option.label}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>
        );
    }

    // Render multiple select dropdown
    return (
        <div className="flex flex-col space-y-2 text-xs w-full">
            {description && (
                <span className="text-xs text-gray-600 mb-1">
                    {description}
                </span>
            )}
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isOpen}
                        className="w-100 justify-between h-8 text-xs px-2 border border-gray-300 hover:border-gray-400 focus:border-blue-500"
                    >
                        <span className="truncate">
                            {getMultipleDisplayValue()}
                        </span>
                        <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-[var(--radix-dropdown-menu-trigger-width)] max-w-[300px] p-0"
                    align="start"
                >
                    {defaultSearchable && (
                        <div className="p-2 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-3 w-3 text-gray-400" />
                                <Input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={e =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="pl-7 h-7 text-xs border-gray-200"
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="p-2 text-xs text-gray-600 italic">
                                No options found
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
                                        className="text-xs cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                                    >
                                        {option.label}
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
