import React, { useState } from 'react';
import { MoreHorizontal, Trash2, Plus, AlertCircle, X } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    useDeleteApiKey,
    useDeactivateApiKey,
    useCreateApiKey,
} from '@/features/apikey';
import { API_KEY_DISPLAY_LENGTH, API_KEY_PREFIX } from '@/features/apikey';
import { type CreateApiKeyRequest } from '@/features/apikey';

interface ApiKey {
    key_id: string;
    name: string;
    description: string;
    is_active: boolean;
    created_at: string;
    last_used_at: string;
}

const ApiKeyPage: React.FC = () => {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [notification, setNotification] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newApiKey, setNewApiKey] = useState({
        name: '',
        description: '',
    });

    const deleteApiKeyMutation = useDeleteApiKey();
    const deactivateApiKeyMutation = useDeactivateApiKey();
    const createApiKeyMutation = useCreateApiKey();

    const formatKeyId = (keyId: string) => {
        return `${API_KEY_PREFIX}${keyId.slice(0, API_KEY_DISPLAY_LENGTH)}...`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const handleDelete = async (keyId: string, name: string) => {
        if (
            !confirm(
                `Are you sure you want to delete API key "${name}"? This action cannot be undone.`
            )
        ) {
            return;
        }

        try {
            await deleteApiKeyMutation.mutateAsync(keyId);
            setApiKeys(prev => prev.filter(key => key.key_id !== keyId));
            setNotification({
                type: 'success',
                message: `API key "${name}" has been deleted successfully.`,
            });
        } catch (error: any) {
            setNotification({
                type: 'error',
                message: error.message || 'Failed to delete API key.',
            });
        }
    };

    const handleDeactivate = async (keyId: string, name: string) => {
        try {
            await deactivateApiKeyMutation.mutateAsync(keyId);
            setApiKeys(prev =>
                prev.map(key =>
                    key.key_id === keyId ? { ...key, is_active: false } : key
                )
            );
            setNotification({
                type: 'success',
                message: `API key "${name}" has been deactivated successfully.`,
            });
        } catch (error: any) {
            setNotification({
                type: 'error',
                message: error.message || 'Failed to deactivate API key.',
            });
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newApiKey.name.trim()) {
            setNotification({
                type: 'error',
                message: 'API key name is required.',
            });
            return;
        }

        try {
            const request: CreateApiKeyRequest = {
                name: newApiKey.name.trim(),
                description: newApiKey.description.trim() || undefined,
            };

            const response = await createApiKeyMutation.mutateAsync(request);

            // Add the new API key to the list
            const newKey = {
                key_id: response.key_id,
                name: response.name,
                description: response.description || '',
                is_active: true,
                created_at: response.created_at,
                last_used_at: '',
            };

            setApiKeys(prev => [newKey, ...prev]);
            setNotification({
                type: 'success',
                message: `API key "${response.name}" has been created successfully. Please save the key: ${response.key}`,
            });

            // Reset form
            setNewApiKey({ name: '', description: '' });
            setShowCreateForm(false);
        } catch (error: any) {
            setNotification({
                type: 'error',
                message: error.message || 'Failed to create API key.',
            });
        }
    };

    return (
        <div className="flex-1 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">API Keys</h1>
                    <p className="mt-2 text-gray-600">
                        Manage your API keys here.
                    </p>
                </div>
                <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {showCreateForm ? 'Cancel' : 'Add New API Key'}
                </Button>
            </div>

            {notification && (
                <Alert
                    className={`mt-6 ${notification.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}
                >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{notification.message}</AlertDescription>
                </Alert>
            )}

            {showCreateForm && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Create New API Key
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowCreateForm(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={newApiKey.name}
                                    onChange={e =>
                                        setNewApiKey(prev => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter API key name"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={newApiKey.description}
                                    onChange={e =>
                                        setNewApiKey(prev => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter API key description (optional)"
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowCreateForm(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createApiKeyMutation.isPending}
                                >
                                    {createApiKeyMutation.isPending
                                        ? 'Creating...'
                                        : 'Create API Key'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="mt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Key ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Last Used</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {apiKeys.map(apiKey => (
                            <TableRow key={apiKey.key_id}>
                                <TableCell className="font-medium">
                                    {apiKey.name}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                    {apiKey.description}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                    {formatKeyId(apiKey.key_id)}
                                </TableCell>
                                <TableCell>
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            apiKey.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {apiKey.is_active
                                            ? 'Active'
                                            : 'Inactive'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                    {formatDate(apiKey.created_at)}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                    {apiKey.last_used_at
                                        ? formatDate(apiKey.last_used_at)
                                        : 'Never'}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {apiKey.is_active && (
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleDeactivate(
                                                            apiKey.key_id,
                                                            apiKey.name
                                                        )
                                                    }
                                                    disabled={
                                                        deactivateApiKeyMutation.isPending
                                                    }
                                                >
                                                    Deactivate
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onClick={() =>
                                                    handleDelete(
                                                        apiKey.key_id,
                                                        apiKey.name
                                                    )
                                                }
                                                disabled={
                                                    deleteApiKeyMutation.isPending
                                                }
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {apiKeys.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-600">
                            No API keys found. Create your first API key to get
                            started.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApiKeyPage;
