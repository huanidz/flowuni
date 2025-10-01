import React, { useState } from 'react';
import { Plus, AlertCircle, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    useListApiKeys,
    useDeleteApiKey,
    useDeactivateApiKey,
    useActivateApiKey,
    useCreateApiKey,
} from '@/features/apikey';
import { type CreateApiKeyRequest } from '@/features/apikey';
import ApiList from '@/features/apikey/components/ApiList';

const ApiKeyPage: React.FC = () => {
    const [notification, setNotification] = useState<{
        type: 'success' | 'error';
        message: string;
        apiKey?: string;
    } | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newApiKey, setNewApiKey] = useState({
        name: '',
        description: '',
    });
    const [copyButtonState, setCopyButtonState] = useState<'copy' | 'copied'>(
        'copy'
    );

    // Use the list hook to fetch API keys (including inactive ones)
    const { data: apiKeyListResponse, isLoading, error } = useListApiKeys(true);
    const apiKeys = apiKeyListResponse?.api_keys || [];

    const deleteApiKeyMutation = useDeleteApiKey();
    const deactivateApiKeyMutation = useDeactivateApiKey();
    const activateApiKeyMutation = useActivateApiKey();
    const createApiKeyMutation = useCreateApiKey();

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyButtonState('copied');
            // Reset button after 2 seconds
            setTimeout(() => {
                setCopyButtonState('copy');
            }, 2000);
        } catch (error) {
            setNotification(prev =>
                prev
                    ? {
                          ...prev,
                          message:
                              'Failed to copy to clipboard. Please copy manually.',
                      }
                    : null
            );
        }
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

    const handleActivate = async (keyId: string, name: string) => {
        try {
            await activateApiKeyMutation.mutateAsync(keyId);
            setNotification({
                type: 'success',
                message: `API key "${name}" has been activated successfully.`,
            });
        } catch (error: any) {
            setNotification({
                type: 'error',
                message: error.message || 'Failed to activate API key.',
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

            // The list will be automatically refetched by the mutation's onSuccess
            setNotification({
                type: 'success',
                message: `API key "${response.name}" has been created successfully.`,
                apiKey: response.key,
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
            <div className="flex items-center justify-between p-6 mb-6 bg-gradient-to-r from-[#644CEA] to-[#7B68EE] rounded-lg shadow-sm">
                <div className="text-white">
                    <h1 className="text-2xl font-bold text-white">API Keys</h1>
                    <p className="mt-2 text-white/80">
                        Manage your API keys here.
                    </p>
                </div>
                <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-white text-[#644CEA] hover:bg-gray-50 border-0"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {showCreateForm ? 'Cancel' : 'Add New API Key'}
                </Button>
            </div>

            {notification && (
                <div
                    className={`mt-6 p-4 rounded-lg border ${
                        notification.type === 'error'
                            ? 'border-red-200 bg-red-50'
                            : 'border-green-200 bg-green-50'
                    }`}
                >
                    <div className="flex items-start">
                        <AlertCircle
                            className={`h-5 w-5 mt-0.5 mr-3 ${
                                notification.type === 'error'
                                    ? 'text-red-600'
                                    : 'text-green-600'
                            }`}
                        />
                        <div className="flex-1">
                            <div
                                className={`font-medium ${
                                    notification.type === 'error'
                                        ? 'text-red-800'
                                        : 'text-green-800'
                                }`}
                            >
                                {notification.type === 'success'
                                    ? 'Success!'
                                    : 'Error'}
                            </div>
                            <div
                                className={`mt-1 ${
                                    notification.type === 'error'
                                        ? 'text-red-700'
                                        : 'text-green-700'
                                }`}
                            >
                                {notification.message}
                            </div>
                            {notification.type === 'success' &&
                                notification.apiKey && (
                                    <div className="mt-3 p-3 bg-white rounded border border-green-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-gray-700 mb-1">
                                                    Your API Key:
                                                </div>
                                                <div className="font-mono text-sm bg-gray-100 p-2 rounded border break-all">
                                                    {notification.apiKey}
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    copyToClipboard(
                                                        notification.apiKey!
                                                    )
                                                }
                                                className="ml-3 flex-shrink-0"
                                                disabled={
                                                    copyButtonState === 'copied'
                                                }
                                            >
                                                {copyButtonState ===
                                                'copied' ? (
                                                    <>
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Copied
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-4 w-4 mr-1" />
                                                        Copy
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-600">
                                            Make sure to copy this key now. You
                                            won't be able to see it again!
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
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

            <ApiList
                apiKeys={apiKeys}
                isLoading={isLoading}
                error={error}
                onDelete={handleDelete}
                onDeactivate={handleDeactivate}
                onActivate={handleActivate}
                isDeletePending={deleteApiKeyMutation.isPending}
                isDeactivatePending={deactivateApiKeyMutation.isPending}
                isActivatePending={activateApiKeyMutation.isPending}
            />
        </div>
    );
};

export default ApiKeyPage;
