import { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';

const EditableField: React.FC<{
    value: string;
    label?: string;
    placeholder?: string;
    isMultiline?: boolean;
    onSave: (newValue: string) => void;
}> = ({ value, label, placeholder, isMultiline = false, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(value);

    useEffect(() => setDraft(value), [value]);

    const handleSave = () => {
        if (draft !== value) onSave(draft);
        setIsEditing(false);
    };

    return (
        <div className="mb-6">
            {label && (
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {label.toUpperCase()}
                    </label>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}
            {isEditing ? (
                <div className="space-y-2">
                    {isMultiline ? (
                        <textarea
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            placeholder={placeholder}
                            className="w-full h-24 p-3 border rounded-md bg-white dark:bg-slate-900 text-sm resize-none"
                            autoFocus
                        />
                    ) : (
                        <input
                            type="text"
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            className="text-xl font-bold px-2 py-1 rounded border"
                            autoFocus
                        />
                    )}
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-3 py-1 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Save
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className={`${
                        isMultiline
                            ? 'p-3 border rounded-md text-sm min-h-[60px]'
                            : 'flex items-center gap-2'
                    }`}
                >
                    {value || (
                        <span className="text-slate-500 italic">
                            No {label} provided
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default EditableField;
