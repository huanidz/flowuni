import React from 'react';
import { MoreHorizontal, Trash2, Power, PowerOff } from 'lucide-react';
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
import { API_KEY_DISPLAY_LENGTH, API_KEY_PREFIX } from '@/features/apikey';
import { type ApiKeyInfoResponse } from '@/features/apikey';

interface ApiListProps {
    apiKeys: ApiKeyInfoResponse[];
    isLoading: boolean;
    error: Error | null;
    onDelete: (keyId: string, name: string) => void;
    onDeactivate: (keyId: string, name: string) => void;
    onActivate: (keyId: string, name: string) => void;
    isDeletePending: boolean;
    isDeactivatePending: boolean;
    isActivatePending: boolean;
}

const ApiList: React.FC<ApiListProps> = ({
    apiKeys,
    isLoading,
    error,
    onDelete,
    onDeactivate,
    onActivate,
    isDeletePending,
    isDeactivatePending,
    isActivatePending,
}) => {
    const formatKeyId = (keyId: string) => {
        return `${API_KEY_PREFIX}${keyId.slice(0, API_KEY_DISPLAY_LENGTH)}...`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
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
                                    {apiKey.is_active ? 'Active' : 'Inactive'}
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
                                        {apiKey.is_active ? (
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    onDeactivate(
                                                        apiKey.key_id,
                                                        apiKey.name
                                                    )
                                                }
                                                disabled={isDeactivatePending}
                                            >
                                                <PowerOff className="h-4 w-4 mr-2" />
                                                Deactivate
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    onActivate(
                                                        apiKey.key_id,
                                                        apiKey.name
                                                    )
                                                }
                                                disabled={isActivatePending}
                                            >
                                                <Power className="h-4 w-4 mr-2" />
                                                Activate
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onClick={() =>
                                                onDelete(
                                                    apiKey.key_id,
                                                    apiKey.name
                                                )
                                            }
                                            disabled={isDeletePending}
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

            {isLoading && (
                <div className="text-center py-8">
                    <p className="text-gray-600">Loading API keys...</p>
                </div>
            )}

            {error && (
                <div className="text-center py-8">
                    <p className="text-red-600">
                        Error loading API keys: {error.message}
                    </p>
                </div>
            )}

            {!isLoading && !error && apiKeys.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-600">
                        No API keys found. Create your first API key to get
                        started.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ApiList;
