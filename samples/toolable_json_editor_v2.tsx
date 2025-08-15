import React, { useState, useCallback } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Copy,
    Check,
    AlertTriangle,
} from 'lucide-react';

interface FieldNode {
    path: string;
    key: string;
    value: any;
    type: string;
    isToolable: boolean;
    defaultValue: any;
    children?: FieldNode[];
    isExpanded?: boolean;
    isParent?: boolean;
}

interface ParameterMapping {
    [key: string]: {
        toolable: boolean;
        defaultValue: any;
        type: string;
    };
}

interface ValidationError {
    path: string;
    message: string;
    type: 'schema_mismatch' | 'missing_fields';
    details: string[];
}

const JsonFieldExtractor: React.FC = () => {
    const [jsonInput, setJsonInput] = useState('');
    const [parsedFields, setParsedFields] = useState<FieldNode[]>([]);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
        []
    );
    const [copied, setCopied] = useState(false);

    const getValueType = (value: any): string => {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    };

    // Merge schemas from all array items to ensure completeness
    const mergeArrayItemSchemas = (array: any[]): any => {
        if (array.length === 0) return null;

        const merged: any = {};
        const allKeys = new Set<string>();

        // Collect all possible keys from all items
        array.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                Object.keys(item).forEach(key => allKeys.add(key));
            }
        });

        // For each key, determine the merged value
        allKeys.forEach(key => {
            const valuesForKey = array
                .filter(item => typeof item === 'object' && item !== null)
                .map(item => item[key]);

            // Find the first non-null value to determine type
            const firstNonNull = valuesForKey.find(
                val => val !== null && val !== undefined
            );

            if (firstNonNull !== undefined) {
                if (Array.isArray(firstNonNull)) {
                    // For arrays, merge schemas of their items too
                    const allArrayItems = valuesForKey
                        .filter(val => Array.isArray(val))
                        .flat();
                    merged[key] =
                        allArrayItems.length > 0
                            ? [mergeArrayItemSchemas(allArrayItems)]
                            : [];
                } else if (typeof firstNonNull === 'object') {
                    // For objects, recursively merge
                    const objectsToMerge = valuesForKey.filter(
                        val => typeof val === 'object' && val !== null
                    );
                    merged[key] =
                        objectsToMerge.length > 0
                            ? mergeArrayItemSchemas(objectsToMerge)
                            : {};
                } else {
                    merged[key] = firstNonNull;
                }
            } else {
                merged[key] = null;
            }
        });

        return merged;
    };

    // Validate array schema consistency
    const validateArraySchema = (
        array: any[],
        path: string
    ): ValidationError[] => {
        const errors: ValidationError[] = [];

        if (array.length === 0) return errors;

        const firstItem = array[0];
        if (typeof firstItem !== 'object' || firstItem === null) return errors;

        const expectedKeys = new Set<string>();
        array.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                Object.keys(item).forEach(key => expectedKeys.add(key));
            }
        });

        const missingFieldsByItem: { [index: number]: string[] } = {};

        array.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
                const itemKeys = new Set(Object.keys(item));
                const missingKeys = Array.from(expectedKeys).filter(
                    key => !itemKeys.has(key)
                );

                if (missingKeys.length > 0) {
                    missingFieldsByItem[index] = missingKeys;
                }
            }
        });

        if (Object.keys(missingFieldsByItem).length > 0) {
            errors.push({
                path,
                type: 'missing_fields',
                message: `Array items have inconsistent schemas`,
                details: Object.entries(missingFieldsByItem).map(
                    ([index, missing]) =>
                        `Item ${index} missing: ${missing.join(', ')}`
                ),
            });
        }

        return errors;
    };

    const parseJsonToTree = useCallback(
        (
            obj: any,
            parentPath = '',
            parentKey = ''
        ): { nodes: FieldNode[]; errors: ValidationError[] } => {
            const result: FieldNode[] = [];
            const errors: ValidationError[] = [];

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
                    isParent: false,
                };

                if (valueType === 'object' && value !== null) {
                    node.isParent = true;
                    const childResult = parseJsonToTree(value, fullPath, key);
                    node.children = childResult.nodes;
                    errors.push(...childResult.errors);
                } else if (valueType === 'array' && value.length > 0) {
                    node.isParent = true;

                    // Validate array schema
                    const arrayErrors = validateArraySchema(value, fullPath);
                    errors.push(...arrayErrors);

                    // Use merged schema for the array structure
                    const mergedSchema = mergeArrayItemSchemas(value);
                    if (mergedSchema && typeof mergedSchema === 'object') {
                        const childResult = parseJsonToTree(
                            mergedSchema,
                            `${fullPath}[*]`,
                            `${key}[*]`
                        );
                        node.children = childResult.nodes;
                        errors.push(...childResult.errors);
                    }
                }

                return node;
            };

            if (Array.isArray(obj)) {
                // Validate the root array
                const arrayErrors = validateArraySchema(
                    obj,
                    parentPath || 'root'
                );
                errors.push(...arrayErrors);

                const mergedSchema = mergeArrayItemSchemas(obj);
                if (mergedSchema && typeof mergedSchema === 'object') {
                    const childResult = parseJsonToTree(
                        mergedSchema,
                        parentPath,
                        parentKey
                    );
                    result.push(...childResult.nodes);
                    errors.push(...childResult.errors);
                }
            } else if (typeof obj === 'object' && obj !== null) {
                Object.entries(obj).forEach(([key, value]) => {
                    result.push(processValue(key, value, parentPath));
                });
            }

            return { nodes: result, errors };
        },
        []
    );

    const handleJsonParse = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            const { nodes: fields, errors } = parseJsonToTree(parsed);
            setParsedFields(fields);
            setValidationErrors(errors);
            setError('');
        } catch (err) {
            setError('Invalid JSON format');
            setParsedFields([]);
            setValidationErrors([]);
        }
    };

    const updateFieldToolability = (
        path: string,
        isToolable: boolean,
        updateChildren = false
    ) => {
        const updateNode = (nodes: FieldNode[]): FieldNode[] => {
            return nodes.map(node => {
                if (node.path === path) {
                    const updatedNode = { ...node, isToolable };

                    if (updateChildren && node.children) {
                        // Recursively update all children
                        const updateAllChildren = (
                            children: FieldNode[]
                        ): FieldNode[] => {
                            return children.map(child => ({
                                ...child,
                                isToolable,
                                children: child.children
                                    ? updateAllChildren(child.children)
                                    : child.children,
                            }));
                        };
                        updatedNode.children = updateAllChildren(node.children);
                    }

                    return updatedNode;
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

    // Check if all children are toolable (for parent checkbox state)
    const areAllChildrenToolable = (node: FieldNode): boolean => {
        if (!node.children || node.children.length === 0)
            return node.isToolable;

        return node.children.every(child => {
            if (child.isParent) {
                return areAllChildrenToolable(child);
            }
            return child.isToolable;
        });
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
        const allChildrenToolable = hasChildren
            ? areAllChildrenToolable(node)
            : false;

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

                    {hasChildren && (
                        <div className="flex items-center gap-2 ml-2">
                            <input
                                type="checkbox"
                                checked={allChildrenToolable}
                                onChange={e =>
                                    updateFieldToolability(
                                        node.path,
                                        e.target.checked,
                                        true
                                    )
                                }
                                className="w-3 h-3"
                                title="Select all children"
                            />
                            <span className="text-xs text-gray-500">
                                all children
                            </span>
                        </div>
                    )}

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
  "users": [
    {
      "name": "John",
      "age": 30,
      "email": "john@example.com"
    },
    {
      "name": "Jane",
      "age": 25
    }
  ],
  "settings": {
    "theme": "dark",
    "notifications": true
  }
}`;

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white">
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

                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <div className="space-y-2">
                            {validationErrors.map((error, index) => (
                                <div
                                    key={index}
                                    className="bg-yellow-50 border border-yellow-200 rounded p-3"
                                >
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle
                                            className="text-yellow-600 mt-0.5"
                                            size={16}
                                        />
                                        <div>
                                            <div className="text-yellow-800 font-medium text-sm">
                                                Schema Warning at {error.path}
                                            </div>
                                            <div className="text-yellow-700 text-xs mt-1">
                                                {error.message}
                                            </div>
                                            <div className="text-yellow-600 text-xs mt-1">
                                                {error.details.map(
                                                    (detail, i) => (
                                                        <div key={i}>
                                                            • {detail}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                            <div className="text-yellow-600 text-xs mt-2 italic">
                                                All array items must have the
                                                same fields (use null for
                                                missing values)
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
