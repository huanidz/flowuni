import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, AlertTriangle } from 'lucide-react';
import type { TypeDetail } from '@/features/nodes/types';

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
    type_detail: TypeDetail;
    disabled: boolean;
    isWholeAsToolMode?: boolean;
}

export const ToolableJsonHandleInput: React.FC<
    ToolableJsonHandleInputProps
> = ({
    label,
    description,
    value,
    onChange,
    type_detail,
    disabled = true,
    isWholeAsToolMode = false,
}) => {
    const hidden = (type_detail as any)?.defaults?.hidden ?? false;
    if (hidden) return null;
    const [jsonInput, setJsonInput] = useState('');
    const [fields, setFields] = useState<FieldNode[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isParsed, setIsParsed] = useState(false);
    const parseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize from value prop
    useEffect(() => {
        if (value && value.example_json !== undefined) {
            // Handle all types of data, not just valid JSON
            if (typeof value.example_json === 'string') {
                setJsonInput(value.example_json);
            } else {
                try {
                    setJsonInput(JSON.stringify(value.example_json, null, 2));
                } catch {
                    setJsonInput(String(value.example_json));
                }
            }
            // Try to parse the JSON to update the fields
            try {
                const parsed =
                    typeof value.example_json === 'string'
                        ? JSON.parse(value.example_json)
                        : value.example_json;
                const { nodes, errors } = parseToTree(parsed);
                setFields(nodes);
                setErrors(errors);
                setIsParsed(true);

                // Apply toolable_config if it exists
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

    // Apply toolable_config to field nodes
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

    // Merge all array items into single schema
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

    // Validate array consistency
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

    // Parse JSON to tree structure
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

    // Handle JSON input change with debouncing
    const handleJsonInputChange = (newJsonInput: string) => {
        setJsonInput(newJsonInput);

        // Clear any existing timeout
        if (parseTimeoutRef.current) {
            clearTimeout(parseTimeoutRef.current);
        }

        // Update the parent component immediately with the raw input for mirroring
        const { success, data: parsed } = safeParse(newJsonInput);
        if (onChange) {
            onChange({
                example_json: success ? parsed : newJsonInput,
                toolable_config: value?.toolable_config || {},
            });
        }

        // Set up debounced parsing
        parseTimeoutRef.current = setTimeout(() => {
            if (success) {
                const { nodes, errors } = parseToTree(parsed);
                setFields(nodes);
                setErrors(errors);
                setIsParsed(true);
                notifyParent(parsed, nodes);
            } else {
                // Don't update fields on invalid JSON
                setIsParsed(false);
            }
        }, 1000); // Wait 1 second after no changes
    };

    // Generic function to update nodes at a specific path
    const updateNodeAtPath = (
        nodes: FieldNode[],
        path: string,
        updateFn: (node: FieldNode) => FieldNode,
        includeChildren = false
    ): FieldNode[] => {
        return nodes.map(node => {
            if (node.path === path) {
                const updatedNode = updateFn(node);

                // If includeChildren is true and the node has children, apply the update to all children
                if (includeChildren && updatedNode.children) {
                    const updateAllChildren = (
                        children: FieldNode[]
                    ): FieldNode[] =>
                        children.map(child => ({
                            ...child,
                            ...updateFn(child), // Apply the same update to children
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

    // Update field toolability (with optional children update)
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

        // Update the toolable_config in the parent component
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

        // Update the toolable_config in the parent component
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

    // Check if all children are toolable
    const allChildrenToolable = (node: FieldNode): boolean => {
        if (!node.children?.length) return node.isToolable;
        return node.children.every(child =>
            child.children ? allChildrenToolable(child) : child.isToolable
        );
    };

    // Safe JSON parsing with error handling
    const safeParse = (jsonString: string): { success: boolean; data: any } => {
        try {
            const parsed = JSON.parse(jsonString);
            return { success: true, data: parsed };
        } catch {
            return { success: false, data: null };
        }
    };

    // Notify parent component of changes
    const notifyParent = (parsedJson: any, fields: FieldNode[]) => {
        if (onChange) {
            const toolableConfig = generateMappingFromFields(fields);
            onChange({
                example_json: parsedJson,
                toolable_config: toolableConfig,
            });
        }
    };

    // Format default value based on type
    const formatDefaultValue = (value: any, type: string): string => {
        if (typeof value === 'string') {
            return value;
        }
        return JSON.stringify(value);
    };

    // Generate parameter mapping from provided fields
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

    // Render field node
    const renderNode = (node: FieldNode, depth = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const allSelected = hasChildren ? allChildrenToolable(node) : false;

        return (
            <div key={node.path} className="mb-1">
                <div
                    className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-50 rounded ml-${depth * 4}`}
                >
                    {hasChildren ? (
                        <button
                            onClick={() => toggleExpanded(node.path)}
                            className="w-4 h-4 flex items-center justify-center"
                            disabled={disabled}
                        >
                            {node.isExpanded ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronRight size={14} />
                            )}
                        </button>
                    ) : (
                        <input
                            type="checkbox"
                            checked={node.isToolable}
                            onChange={e =>
                                updateToolable(node.path, e.target.checked)
                            }
                            className="w-3 h-3"
                            disabled={disabled}
                        />
                    )}

                    <span className="font-mono text-sm font-medium">
                        {hasChildren ? `[-] ${node.key}` : `[ ] ${node.key}`}
                    </span>

                    {hasChildren ? (
                        <div className="flex items-center gap-1 ml-2">
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
                                className="w-3 h-3"
                                disabled={disabled}
                            />
                            <span className="text-xs text-gray-500">all</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-xs bg-gray-100 px-1 rounded">
                                {node.type}
                            </span>
                            <span className="text-xs">
                                {node.isToolable ? '☑' : '☐'}
                            </span>
                            <input
                                type="text"
                                value={formatDefaultValue(
                                    node.defaultValue,
                                    node.type
                                )}
                                onChange={e => {
                                    let val: any = e.target.value;
                                    if (node.type === 'number')
                                        val = Number(val) || 0;
                                    if (node.type === 'boolean')
                                        val = val.toLowerCase() === 'true';
                                    updateDefault(node.path, val);
                                }}
                                className="text-xs border border-gray-300 rounded px-1 py-0.5 w-20"
                                disabled={disabled}
                            />
                        </div>
                    )}
                </div>

                {hasChildren && node.isExpanded && (
                    <div>
                        {node.children!.map(child =>
                            renderNode(child, depth + 1)
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col space-y-4 w-full">
            {description && (
                <span className="text-xs text-gray-600">{description}</span>
            )}

            <div className="space-y-2">
                <textarea
                    value={jsonInput}
                    onChange={e => handleJsonInputChange(e.target.value)}
                    placeholder={`{\n  "users": [{"name": "John", "age": 30}],\n  "settings": {"theme": "dark"}\n}`}
                    className="w-full h-32 p-3 border rounded-lg font-mono text-sm resize-none"
                    disabled={disabled}
                />

                {errors.length > 0 && (
                    <div className="space-y-2">
                        {errors.map((error, i) => (
                            <div
                                key={i}
                                className="bg-yellow-50 border border-yellow-200 rounded p-3"
                            >
                                <div className="flex items-start gap-2">
                                    <AlertTriangle
                                        className="text-yellow-600 mt-0.5"
                                        size={16}
                                    />
                                    <div className="text-yellow-800 text-sm">
                                        {error}
                                        {error.includes('missing') && (
                                            <div className="text-xs mt-1 italic">
                                                Use null for missing fields
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isParsed && (
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Extracted Fields
                    </label>
                    <div className="border rounded-lg p-4 bg-gray-50 min-h-32 max-h-64 overflow-y-auto">
                        {fields.length > 0 ? (
                            <div>{fields.map(field => renderNode(field))}</div>
                        ) : (
                            <div className="text-gray-500 text-center py-4">
                                No fields found
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isParsed && fields.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">
                        Parameter Mapping
                    </h3>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
                        {JSON.stringify(
                            generateMappingFromFields(fields),
                            null,
                            2
                        )}
                    </pre>
                </div>
            )}
        </div>
    );
};
