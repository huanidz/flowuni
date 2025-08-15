import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, AlertTriangle } from 'lucide-react';

interface FieldNode {
    path: string;
    key: string;
    type: string;
    isToolable: boolean;
    defaultValue: any;
    children?: FieldNode[];
    isExpanded?: boolean;
}

const JsonFieldExtractor: React.FC = () => {
    const [jsonInput, setJsonInput] = useState('');
    const [fields, setFields] = useState<FieldNode[]>([]);
    const [errors, setErrors] = useState<string[]>([]);

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
                : firstValue ?? null;
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

    const handleParse = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            const { nodes, errors } = parseToTree(parsed);
            setFields(nodes);
            setErrors(errors);
        } catch {
            setFields([]);
            setErrors(['Invalid JSON format']);
        }
    };

    // Update field toolability (with optional children update)
    const updateToolable = (
        path: string,
        isToolable: boolean,
        includeChildren = false
    ) => {
        const updateNodes = (nodes: FieldNode[]): FieldNode[] => {
            return nodes.map(node => {
                if (node.path === path) {
                    const updated = { ...node, isToolable };
                    if (includeChildren && node.children) {
                        const updateAll = (
                            children: FieldNode[]
                        ): FieldNode[] =>
                            children.map(child => ({
                                ...child,
                                isToolable,
                                children: child.children
                                    ? updateAll(child.children)
                                    : child.children,
                            }));
                        updated.children = updateAll(node.children);
                    }
                    return updated;
                }
                return {
                    ...node,
                    children: node.children
                        ? updateNodes(node.children)
                        : node.children,
                };
            });
        };
        setFields(updateNodes(fields));
    };

    const updateDefault = (path: string, value: any) => {
        const updateNodes = (nodes: FieldNode[]): FieldNode[] => {
            return nodes.map(node =>
                node.path === path
                    ? { ...node, defaultValue: value }
                    : {
                          ...node,
                          children: node.children
                              ? updateNodes(node.children)
                              : node.children,
                      }
            );
        };
        setFields(updateNodes(fields));
    };

    const toggleExpanded = (path: string) => {
        const updateNodes = (nodes: FieldNode[]): FieldNode[] => {
            return nodes.map(node =>
                node.path === path
                    ? { ...node, isExpanded: !node.isExpanded }
                    : {
                          ...node,
                          children: node.children
                              ? updateNodes(node.children)
                              : node.children,
                      }
            );
        };
        setFields(updateNodes(fields));
    };

    // Check if all children are toolable
    const allChildrenToolable = (node: FieldNode): boolean => {
        if (!node.children?.length) return node.isToolable;
        return node.children.every(child =>
            child.children ? allChildrenToolable(child) : child.isToolable
        );
    };

    // Generate parameter mapping
    const generateMapping = () => {
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
        collect(fields);
        return mapping;
    };

    const copyMapping = async () => {
        try {
            await navigator.clipboard.writeText(
                JSON.stringify(generateMapping(), null, 2)
            );
        } catch (e) {
            console.error('Copy failed:', e);
        }
    };

    // Render field node
    const renderNode = (node: FieldNode, depth = 0) => {
        const hasChildren = node.children?.length > 0;
        const allSelected = hasChildren ? allChildrenToolable(node) : false;

        return (
            <div key={node.path} className="mb-1">
                <div
                    className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-50 rounded ml-${
                        depth * 4
                    }`}
                >
                    {/* Expand/Collapse or Checkbox */}
                    {hasChildren ? (
                        <button
                            onClick={() => toggleExpanded(node.path)}
                            className="w-4 h-4 flex items-center justify-center"
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
                        />
                    )}

                    {/* Field name */}
                    <span className="font-mono text-sm font-medium">
                        {hasChildren ? `[-] ${node.key}` : `[ ] ${node.key}`}
                    </span>

                    {/* Parent selection */}
                    {hasChildren && (
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
                            />
                            <span className="text-xs text-gray-500">all</span>
                        </div>
                    )}

                    {/* Leaf node controls */}
                    {!hasChildren && (
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-xs bg-gray-100 px-1 rounded">
                                {node.type}
                            </span>
                            <span className="text-xs">
                                {node.isToolable ? '☑' : '☐'}
                            </span>
                            <input
                                type="text"
                                value={
                                    typeof node.defaultValue === 'string'
                                        ? node.defaultValue
                                        : JSON.stringify(node.defaultValue)
                                }
                                onChange={e => {
                                    let val: any = e.target.value;
                                    if (node.type === 'number')
                                        val = Number(val) || 0;
                                    if (node.type === 'boolean')
                                        val = val.toLowerCase() === 'true';
                                    updateDefault(node.path, val);
                                }}
                                className="text-xs border border-gray-300 rounded px-1 py-0.5 w-20"
                            />
                        </div>
                    )}
                </div>

                {/* Children */}
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
        <div className="max-w-6xl mx-auto p-6 bg-white">
            <h1 className="text-2xl font-bold mb-6">JSON Field Extractor</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input */}
                <div className="space-y-4">
                    <textarea
                        value={jsonInput}
                        onChange={e => setJsonInput(e.target.value)}
                        placeholder={`{
  "users": [
    {"name": "John", "age": 30, "email": "john@example.com"},
    {"name": "Jane", "age": 25}
  ],
  "settings": {"theme": "dark", "notifications": true}
}`}
                        className="w-full h-64 p-3 border rounded-lg font-mono text-sm resize-none"
                    />

                    <button
                        onClick={handleParse}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Parse JSON
                    </button>

                    {/* Errors */}
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

                {/* Tree */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                            Extracted Fields
                        </label>
                        {fields.length > 0 && (
                            <button
                                onClick={copyMapping}
                                className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                <Copy size={14} /> Copy
                            </button>
                        )}
                    </div>

                    <div className="border rounded-lg p-4 bg-gray-50 min-h-64 max-h-96 overflow-y-auto">
                        {fields.length > 0 ? (
                            <div>{fields.map(field => renderNode(field))}</div>
                        ) : (
                            <div className="text-gray-500 text-center py-8">
                                Parse JSON to see fields
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Output Preview */}
            {fields.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">
                        Parameter Mapping
                    </h2>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                        {JSON.stringify(generateMapping(), null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default JsonFieldExtractor;
