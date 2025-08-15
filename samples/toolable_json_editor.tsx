import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';

interface FieldNode {
    path: string;
    key: string;
    value: any;
    type: string;
    isToolable: boolean;
    defaultValue: any;
    children?: FieldNode[];
    isExpanded?: boolean;
}

interface ParameterMapping {
    [key: string]: {
        toolable: boolean;
        defaultValue: any;
        type: string;
    };
}

const JsonFieldExtractor: React.FC = () => {
    const [jsonInput, setJsonInput] = useState('');
    const [parsedFields, setParsedFields] = useState<FieldNode[]>([]);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const getValueType = (value: any): string => {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    };

    const parseJsonToTree = useCallback(
        (obj: any, parentPath = '', parentKey = ''): FieldNode[] => {
            const result: FieldNode[] = [];

            const processValue = (
                key: string,
                value: any,
                currentPath: string
            ) => {
                const fullPath = currentPath ? `${currentPath}.${key}` : key;
                const valueType = getValueType(value);

                const node: FieldNode = {
                    path: fullPath,
                    key,
                    value,
                    type: valueType,
                    isToolable: false,
                    defaultValue: value,
                    isExpanded: true,
                };

                if (valueType === 'object' && value !== null) {
                    node.children = parseJsonToTree(value, fullPath, key);
                } else if (valueType === 'array' && value.length > 0) {
                    // For arrays, we'll show the structure of the first item if it's an object
                    if (typeof value[0] === 'object' && value[0] !== null) {
                        node.children = parseJsonToTree(
                            value[0],
                            `${fullPath}[0]`,
                            key
                        );
                    }
                }

                return node;
            };

            if (Array.isArray(obj)) {
                obj.forEach((item, index) => {
                    if (typeof item === 'object' && item !== null) {
                        const children = parseJsonToTree(
                            item,
                            `${parentPath}[${index}]`,
                            `[${index}]`
                        );
                        result.push(...children);
                    } else {
                        result.push(
                            processValue(`[${index}]`, item, parentPath)
                        );
                    }
                });
            } else if (typeof obj === 'object' && obj !== null) {
                Object.entries(obj).forEach(([key, value]) => {
                    result.push(processValue(key, value, parentPath));
                });
            }

            return result;
        },
        []
    );

    const handleJsonParse = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            const fields = parseJsonToTree(parsed);
            setParsedFields(fields);
            setError('');
        } catch (err) {
            setError('Invalid JSON format');
            setParsedFields([]);
        }
    };

    const updateFieldToolability = (path: string, isToolable: boolean) => {
        const updateNode = (nodes: FieldNode[]): FieldNode[] => {
            return nodes.map(node => {
                if (node.path === path) {
                    return { ...node, isToolable };
                }
                if (node.children) {
                    return { ...node, children: updateNode(node.children) };
                }
                return node;
            });
        };
        setParsedFields(updateNode(parsedFields));
    };

    const updateFieldDefault = (path: string, defaultValue: any) => {
        const updateNode = (nodes: FieldNode[]): FieldNode[] => {
            return nodes.map(node => {
                if (node.path === path) {
                    return { ...node, defaultValue };
                }
                if (node.children) {
                    return { ...node, children: updateNode(node.children) };
                }
                return node;
            });
        };
        setParsedFields(updateNode(parsedFields));
    };

    const toggleExpanded = (path: string) => {
        const updateNode = (nodes: FieldNode[]): FieldNode[] => {
            return nodes.map(node => {
                if (node.path === path) {
                    return { ...node, isExpanded: !node.isExpanded };
                }
                if (node.children) {
                    return { ...node, children: updateNode(node.children) };
                }
                return node;
            });
        };
        setParsedFields(updateNode(parsedFields));
    };

    const generateParameterMapping = (): ParameterMapping => {
        const mapping: ParameterMapping = {};

        const collectFields = (nodes: FieldNode[]) => {
            nodes.forEach(node => {
                if (!node.children || node.children.length === 0) {
                    // Leaf node
                    mapping[node.path] = {
                        toolable: node.isToolable,
                        defaultValue: node.defaultValue,
                        type: node.type,
                    };
                } else {
                    // Branch node - collect children
                    collectFields(node.children);
                }
            });
        };

        collectFields(parsedFields);
        return mapping;
    };

    const copyParameterMapping = async () => {
        const mapping = generateParameterMapping();
        const mappingJson = JSON.stringify(mapping, null, 2);

        try {
            await navigator.clipboard.writeText(mappingJson);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const renderFieldNode = (node: FieldNode, depth = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isLeaf = !hasChildren;
        const indentClass = `ml-${depth * 4}`;

        return (
            <div key={node.path} className="mb-1">
                <div
                    className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-50 rounded ${indentClass}`}
                >
                    {hasChildren ? (
                        <button
                            onClick={() => toggleExpanded(node.path)}
                            className="flex items-center justify-center w-4 h-4 text-gray-600 hover:text-gray-800"
                        >
                            {node.isExpanded ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronRight size={14} />
                            )}
                        </button>
                    ) : (
                        <div className="w-4 h-4 flex items-center justify-center">
                            <input
                                type="checkbox"
                                checked={node.isToolable}
                                onChange={e =>
                                    updateFieldToolability(
                                        node.path,
                                        e.target.checked
                                    )
                                }
                                className="w-3 h-3"
                            />
                        </div>
                    )}

                    <span className="font-mono text-sm font-medium">
                        {hasChildren ? `[-] ${node.key}` : `[ ] ${node.key}`}
                    </span>

                    {isLeaf && (
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                                {node.type}
                            </span>
                            <span className="text-xs text-gray-600">
                                toolable:
                            </span>
                            <span className="text-xs">
                                {node.isToolable ? '☑' : '☐'}
                            </span>
                            <span className="text-xs text-gray-600">
                                default:
                            </span>
                            <input
                                type="text"
                                value={
                                    typeof node.defaultValue === 'string'
                                        ? node.defaultValue
                                        : JSON.stringify(node.defaultValue)
                                }
                                onChange={e => {
                                    let newValue: any = e.target.value;
                                    if (node.type === 'number') {
                                        newValue = Number(newValue) || 0;
                                    } else if (node.type === 'boolean') {
                                        newValue =
                                            newValue.toLowerCase() === 'true';
                                    }
                                    updateFieldDefault(node.path, newValue);
                                }}
                                className="text-xs border border-gray-300 rounded px-1 py-0.5 w-20 bg-white"
                            />
                        </div>
                    )}
                </div>

                {hasChildren && node.isExpanded && node.children && (
                    <div>
                        {node.children.map(child =>
                            renderFieldNode(child, depth + 1)
                        )}
                    </div>
                )}
            </div>
        );
    };

    const exampleJson = `{
  "user": {
    "name": "John",
    "age": 30
  },
  "settings": {
    "theme": "dark",
    "notifications": true
  }
}`;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white">
            <h1 className="text-2xl font-bold mb-6">JSON Field Extractor</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* JSON Input Section */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            JSON Input
                        </label>
                        <textarea
                            value={jsonInput}
                            onChange={e => setJsonInput(e.target.value)}
                            placeholder={exampleJson}
                            className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <button
                        onClick={handleJsonParse}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Parse JSON
                    </button>

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
                            {error}
                        </div>
                    )}
                </div>

                {/* Tree Structure Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium">
                            Extracted Fields
                        </label>
                        {parsedFields.length > 0 && (
                            <button
                                onClick={copyParameterMapping}
                                className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                                {copied ? (
                                    <Check size={14} />
                                ) : (
                                    <Copy size={14} />
                                )}
                                {copied ? 'Copied!' : 'Copy Mapping'}
                            </button>
                        )}
                    </div>

                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 min-h-64 max-h-96 overflow-y-auto">
                        {parsedFields.length > 0 ? (
                            <div className="space-y-1">
                                {parsedFields.map(field =>
                                    renderFieldNode(field)
                                )}
                            </div>
                        ) : (
                            <div className="text-gray-500 text-center py-8">
                                Parse JSON to see field structure
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Generated Parameter Mapping Preview */}
            {parsedFields.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">
                        Generated Parameter Mapping
                    </h2>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                        {JSON.stringify(generateParameterMapping(), null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default JsonFieldExtractor;
