import React from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
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

// Mock data for API keys
const mockApiKeys = [
    {
        id: '1',
        name: 'Production API Key',
        description: 'Main production environment key for live deployment',
        keyId: 'sk-prod-1234...abcd',
        createdAt: '2024-01-15',
    },
    {
        id: '2',
        name: 'Development API Key',
        description: 'Development environment key for testing and development',
        keyId: 'sk-dev-5678...efgh',
        createdAt: '2024-01-20',
    },
    {
        id: '3',
        name: 'Staging API Key',
        description: 'Staging environment key for pre-production testing',
        keyId: 'sk-stag-9012...ijkl',
        createdAt: '2024-02-01',
    },
];

const ApiKeyPage: React.FC = () => {
    const handleDelete = (id: string, name: string) => {
        // TODO: Implement delete functionality
        console.log(`Delete API key: ${name} (${id})`);
    };

    const handleEdit = (id: string, name: string) => {
        // TODO: Implement edit functionality
        console.log(`Edit API key: ${name} (${id})`);
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
                <Button>Add New API Key</Button>
            </div>

            <div className="mt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>KeyID</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockApiKeys.map(apiKey => (
                            <TableRow key={apiKey.id}>
                                <TableCell className="font-medium">
                                    {apiKey.name}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                    {apiKey.description}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                    {apiKey.keyId}
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
                                            {/* TODO: Add Edit functionality */}
                                            {/* <DropdownMenuItem onClick={() => handleEdit(apiKey.id, apiKey.name)}>
                                                Edit
                                            </DropdownMenuItem> */}
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onClick={() =>
                                                    handleDelete(
                                                        apiKey.id,
                                                        apiKey.name
                                                    )
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

                {mockApiKeys.length === 0 && (
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
