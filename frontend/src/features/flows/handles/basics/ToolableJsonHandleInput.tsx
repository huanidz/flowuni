import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronRight,
    ChevronDown,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';

interface FieldNode {
    path: string;
    key: string;
    type: string;
    isToolable: boolean;
    defaultValue: any;
    children?: FieldNode[];
    isExpanded?: boolean;
}

interface ToolableJsonHandleInputProps {
    label: string;
    description?: string;
    value: any;
    onChange?: (value: { example_json: any; toolable_config: any }) => void;
    type_detail: any;
    disabled: boolean;
    isWholeAsToolMode?: boolean;
}

export const ToolableJsonHandleInput: React.FC<
    ToolableJsonHandleInputProps
> = ({ description, value, onChange, type_detail, disabled = false }) => {
    const hidden = (type_detail as any)?.defaults?.hidden ?? false;
    const [jsonInput, setJsonInput] = useState('');
    const [fields, setFields] = useState<FieldNode[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isParsed, setIsParsed] = useState(false);
    const parseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize from value prop
    useEffect(() => {
        if (value && value.example_json !== undefined) {
            if (typeof value.example_json === 'string') {
                setJsonInput(value.example_json);
            } else {
                try {
                    setJsonInput(JSON.stringify(value.example_json, null, 2));
                } catch {
                    setJsonInput(String(value.example_json));
                }
            }
            try {
                const parsed =
                    typeof value.example_json === 'string'
                        ? JSON.parse(value.example_json)
                        : value.example_json;
                const { nodes, errors } = parseToTree(parsed);
                setFields(nodes);
                setErrors(errors);
                setIsParsed(true);

                if (value.toolable_config) {
                    applyToolableConfig(nodes, value.toolable_config);
                }
            } catch {
                setFields([]);
                setErrors(['Invalid JSON format']);
                setIsParsed(false);
            }
        }
    }, [value]);

    const applyToolableConfig = (nodes: FieldNode[], toolableConfig: any) => {
        const applyConfig = (nodes: FieldNode[]): FieldNode[] => {
            return nodes.map(node => {
                const config = toolableConfig[node.path];
                const updatedNode = { ...node };

                if (config) {
                    updatedNode.isToolable = config.toolable || false;
                    updatedNode.defaultValue =
                        config.defaultValue !== undefined
                            ? config.defaultValue
                            : node.defaultValue;
                }

                if (node.children) {
                    updatedNode.children = applyConfig(node.children);
                }

                return updatedNode;
            });
        };

        const updatedNodes = applyConfig(nodes);
        setFields(updatedNodes);
    };

    const mergeArraySchema = (arr: any[]): any => {
        if (!arr.length) return null;
        const merged: any = {};
        const allKeys = new Set<string>();

        arr.forEach(item => {
            if (typeof item === 'object' && item) {
                Object.keys(item).forEach(key => allKeys.add(key));
            }
        });

        allKeys.forEach(key => {
            const firstValue = arr.find(item => item?.[key] !== undefined)?.[
                key
            ];
            merged[key] = Array.isArray(firstValue)
                ? [mergeArraySchema(arr.flatMap(item => item[key] || []))]
                : (firstValue ?? null);
        });

        return merged;
    };

    const validateArray = (arr: any[], path: string): string[] => {
        if (!arr.length) return [];

        const allKeys = new Set<string>();
        arr.forEach(item => {
            if (typeof item === 'object' && item) {
                Object.keys(item).forEach(key => allKeys.add(key));
            }
        });

        const errors: string[] = [];
        arr.forEach((item, i) => {
            if (typeof item === 'object' && item) {
                const missing = Array.from(allKeys).filter(
                    key => !(key in item)
                );
                if (missing.length) {
                    errors.push(`${path}[${i}] missing: ${missing.join(', ')}`);
                }
            }
        });

        return errors;
    };

    const parseToTree = (
        obj: any,
        path = '',
        key = ''
    ): { nodes: FieldNode[]; errors: string[] } => {
        const nodes: FieldNode[] = [];
        const errors: string[] = [];

        const createNode = (k: string, val: any, p: string): FieldNode => {
            const fullPath = p ? `${p}.${k}` : k;
            const type =
                val === null
                    ? 'null'
                    : Array.isArray(val)
                      ? 'array'
                      : typeof val;

            const node: FieldNode = {
                path: fullPath,
                key: k,
                type,
                isToolable: false,
                defaultValue: val,
                isExpanded: true,
            };

            if (type === 'object') {
                const result = parseToTree(val, fullPath, k);
                node.children = result.nodes;
                errors.push(...result.errors);
            } else if (type === 'array' && val.length) {
                errors.push(...validateArray(val, fullPath));
                const merged = mergeArraySchema(val);
                if (merged) {
                    const result = parseToTree(
                        merged,
                        `${fullPath}[*]`,
                        `${k}[*]`
                    );
                    node.children = result.nodes;
                    errors.push(...result.errors);
                }
            }

            return node;
        };

        if (Array.isArray(obj)) {
            errors.push(...validateArray(obj, path || 'root'));
            const merged = mergeArraySchema(obj);
            if (merged) {
                const result = parseToTree(merged, path, key);
                return {
                    nodes: result.nodes,
                    errors: [...errors, ...result.errors],
                };
            }
        } else if (typeof obj === 'object' && obj) {
            Object.entries(obj).forEach(([k, v]) => {
                nodes.push(createNode(k, v, path));
            });
        }

        return { nodes, errors };
    };

    const handleJsonInputChange = (newJsonInput: string) => {
        setJsonInput(newJsonInput);

        if (parseTimeoutRef.current) {
            clearTimeout(parseTimeoutRef.current);
        }

        const { success, data: parsed } = safeParse(newJsonInput);
        if (onChange) {
            onChange({
                example_json: success ? parsed : newJsonInput,
                toolable_config: value?.toolable_config || {},
            });
        }

        parseTimeoutRef.current = setTimeout(() => {
            if (success) {
                const { nodes, errors } = parseToTree(parsed);
                setFields(nodes);
                setErrors(errors);
                setIsParsed(true);
                notifyParent(parsed, nodes);
            } else {
                setIsParsed(false);
            }
        }, 1000);
    };

    const updateNodeAtPath = (
        nodes: FieldNode[],
        path: string,
        updateFn: (node: FieldNode) => FieldNode,
        includeChildren = false
    ): FieldNode[] => {
        return nodes.map(node => {
            if (node.path === path) {
                const updatedNode = updateFn(node);

                if (includeChildren && updatedNode.children) {
                    const updateAllChildren = (
                        children: FieldNode[]
                    ): FieldNode[] =>
                        children.map(child => ({
                            ...child,
                            ...updateFn(child),
                            children: child.children
                                ? updateAllChildren(child.children)
                                : child.children,
                        }));
                    updatedNode.children = updateAllChildren(
                        updatedNode.children
                    );
                }

                return updatedNode;
            }

            return {
                ...node,
                children: node.children
                    ? updateNodeAtPath(
                          node.children,
                          path,
                          updateFn,
                          includeChildren
                      )
                    : node.children,
            };
        });
    };

    const updateToolable = (
        path: string,
        isToolable: boolean,
        includeChildren = false
    ) => {
        const updatedFields = updateNodeAtPath(
            fields,
            path,
            node => ({ ...node, isToolable }),
            includeChildren
        );
        setFields(updatedFields);

        if (onChange && isParsed) {
            const { success, data: exampleJson } = safeParse(jsonInput);
            if (success) {
                notifyParent(exampleJson, updatedFields);
            }
        }
    };

    const updateDefault = (path: string, value: any) => {
        const updatedFields = updateNodeAtPath(fields, path, node => ({
            ...node,
            defaultValue: value,
        }));
        setFields(updatedFields);

        if (onChange && isParsed) {
            const { success, data: exampleJson } = safeParse(jsonInput);
            if (success) {
                notifyParent(exampleJson, updatedFields);
            }
        }
    };

    const toggleExpanded = (path: string) => {
        setFields(
            updateNodeAtPath(fields, path, node => ({
                ...node,
                isExpanded: !node.isExpanded,
            }))
        );
    };

    const allChildrenToolable = (node: FieldNode): boolean => {
        if (!node.children?.length) return node.isToolable;
        return node.children.every(child =>
            child.children ? allChildrenToolable(child) : child.isToolable
        );
    };

    const safeParse = (jsonString: string): { success: boolean; data: any } => {
        try {
            const parsed = JSON.parse(jsonString);
            return { success: true, data: parsed };
        } catch {
            return { success: false, data: null };
        }
    };

    const notifyParent = (parsedJson: any, fields: FieldNode[]) => {
        if (onChange) {
            const toolableConfig = generateMappingFromFields(fields);
            onChange({
                example_json: parsedJson,
                toolable_config: toolableConfig,
            });
        }
    };

    const formatDefaultValue = (value: any): string => {
        if (typeof value === 'string') {
            return value;
        }
        return JSON.stringify(value);
    };

    const generateMappingFromFields = (fieldNodes: FieldNode[]) => {
        const mapping: any = {};
        const collect = (nodes: FieldNode[]) => {
            nodes.forEach(node => {
                if (!node.children?.length) {
                    mapping[node.path] = {
                        toolable: node.isToolable,
                        defaultValue: node.defaultValue,
                        type: node.type,
                    };
                } else {
                    collect(node.children);
                }
            });
        };
        collect(fieldNodes);
        return mapping;
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            string: 'bg-blue-100 text-blue-700',
            number: 'bg-green-100 text-green-700',
            boolean: 'bg-purple-100 text-purple-700',
            array: 'bg-orange-100 text-orange-700',
            object: 'bg-gray-100 text-gray-700',
            null: 'bg-gray-100 text-gray-500',
        };
        return colors[type] || 'bg-gray-100 text-gray-600';
    };

    const renderNode = (node: FieldNode, depth = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const allSelected = hasChildren ? allChildrenToolable(node) : false;
        const indent = depth * 24;

        return (
            <div key={node.path} className="border-l-2 border-gray-200">
                <div
                    className={`flex items-center gap-3 py-2.5 px-3 hover:bg-blue-50 transition-colors duration-150 ${
                        node.isToolable ? 'bg-blue-50/50' : ''
                    }`}
                    style={{ marginLeft: `${indent}px` }}
                >
                    {hasChildren ? (
                        <button
                            onClick={() => toggleExpanded(node.path)}
                            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
                            disabled={disabled}
                        >
                            {node.isExpanded ? (
                                <ChevronDown
                                    size={16}
                                    className="text-gray-600"
                                />
                            ) : (
                                <ChevronRight
                                    size={16}
                                    className="text-gray-600"
                                />
                            )}
                        </button>
                    ) : (
                        <input
                            type="checkbox"
                            checked={node.isToolable}
                            onChange={e =>
                                updateToolable(node.path, e.target.checked)
                            }
                            className="flex-shrink-0 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={disabled}
                        />
                    )}

                    <span className="font-mono text-sm font-semibold text-gray-800 flex-shrink-0">
                        {node.key}
                    </span>

                    <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTypeColor(
                            node.type
                        )}`}
                    >
                        {node.type}
                    </span>

                    {hasChildren ? (
                        <div className="flex items-center gap-2 ml-auto">
                            <label className="flex items-center gap-1.5 cursor-pointer hover:bg-white rounded px-2 py-1 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={e =>
                                        updateToolable(
                                            node.path,
                                            e.target.checked,
                                            true
                                        )
                                    }
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={disabled}
                                />
                                <span className="text-xs font-medium text-gray-600">
                                    Select all
                                </span>
                            </label>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 ml-auto">
                            {node.isToolable && (
                                <CheckCircle2
                                    size={14}
                                    className="text-blue-600"
                                />
                            )}
                            <input
                                type="text"
                                value={formatDefaultValue(node.defaultValue)}
                                onChange={e => {
                                    let val: any = e.target.value;
                                    if (node.type === 'number')
                                        val = Number(val) || 0;
                                    if (node.type === 'boolean')
                                        val = val.toLowerCase() === 'true';
                                    updateDefault(node.path, val);
                                }}
                                placeholder="Default value"
                                className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                                disabled={disabled}
                            />
                        </div>
                    )}
                </div>

                {hasChildren && node.isExpanded && (
                    <div className="bg-gray-50/50">
                        {node.children!.map(child =>
                            renderNode(child, depth + 1)
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (hidden) return null;

    return (
        <div className="flex flex-col space-y-6 w-full">
            {description && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">{description}</p>
                </div>
            )}

            <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                    JSON Input
                </label>
                <textarea
                    value={jsonInput}
                    onChange={e => handleJsonInputChange(e.target.value)}
                    placeholder='{\n  "users": [{"name": "John", "age": 30}],\n  "settings": {"theme": "dark"}\n}'
                    className="w-full h-40 p-4 border-2 border-gray-300 rounded-lg font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-all"
                    disabled={disabled}
                />

                {errors.length > 0 && (
                    <div className="space-y-2">
                        {errors.map((error, i) => (
                            <div
                                key={i}
                                className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4 shadow-sm"
                            >
                                <div className="flex items-start gap-3">
                                    <AlertTriangle
                                        className="text-amber-600 flex-shrink-0 mt-0.5"
                                        size={18}
                                    />
                                    <div className="flex-1">
                                        <p className="text-amber-900 text-sm font-medium">
                                            {error}
                                        </p>
                                        {error.includes('missing') && (
                                            <p className="text-xs text-amber-700 mt-1.5 italic">
                                                💡 Tip: Use null for missing
                                                fields to maintain consistency
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isParsed && (
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                        Extracted Fields
                    </label>
                    <div className="border-2 border-gray-300 rounded-lg bg-white overflow-hidden shadow-sm">
                        <div className="max-h-96 overflow-y-auto">
                            {fields.length > 0 ? (
                                <div className="divide-y divide-gray-200">
                                    {fields.map(field => renderNode(field))}
                                </div>
                            ) : (
                                <div className="text-gray-400 text-center py-12">
                                    <p className="text-sm font-medium">
                                        No fields found
                                    </p>
                                    <p className="text-xs mt-1">
                                        Enter valid JSON to see extracted fields
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isParsed && fields.length > 0 && (
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                        Parameter Mapping
                    </label>
                    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
                        <pre className="text-green-400 p-5 overflow-x-auto text-xs leading-relaxed">
                            {JSON.stringify(
                                generateMappingFromFields(fields),
                                null,
                                2
                            )}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};
