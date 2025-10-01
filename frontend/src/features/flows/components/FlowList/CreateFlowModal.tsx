import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useCreateFlow } from '@/features/flows/hooks';
import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface CreateFlowModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (flowId: string) => void;
}

const CreateFlowModal: React.FC<CreateFlowModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [flowName, setFlowName] = useState('');
    const [flowDescription, setFlowDescription] = useState('');
    const [flowDefinition, setFlowDefinition] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isValidJson, setIsValidJson] = useState<boolean | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const createFlowMutation = useCreateFlow();

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/json') {
            toast('Error', {
                description: 'Please upload a JSON file.',
            });
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const content = e.target?.result as string;
                const parsedContent = JSON.parse(content);
                const formattedContent = JSON.stringify(parsedContent, null, 2);
                setFlowDefinition(formattedContent);
                setIsValidJson(true);
                toast('Success', {
                    description: 'Flow definition loaded successfully.',
                });
            } catch (error) {
                toast('Error', {
                    description: 'Failed to parse JSON file.',
                });
                console.error('JSON parsing error:', error);
                setIsValidJson(false);
            } finally {
                setIsUploading(false);
            }
        };
        reader.onerror = () => {
            toast('Error', {
                description: 'Failed to read file.',
            });
            setIsUploading(false);
        };
        reader.readAsText(file);
    };

    const validateJson = (jsonString: string): boolean => {
        if (!jsonString.trim()) {
            setIsValidJson(null);
            return true;
        }

        try {
            JSON.parse(jsonString);
            setIsValidJson(true);
            return true;
        } catch (error) {
            setIsValidJson(false);
            return false;
        }
    };

    const handleFlowDefinitionChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        const value = e.target.value;
        setFlowDefinition(value);
        validateJson(value);
    };

    const handleCreateFlow = async () => {
        try {
            // If no name, no description, and no definition, create empty flow
            if (
                !flowName.trim() &&
                !flowDescription.trim() &&
                !flowDefinition.trim()
            ) {
                const flow = await createFlowMutation.mutateAsync(undefined);
                const { flow_id } = flow;
                toast('Flow Created', {
                    description: `Flow created successfully.`,
                });
                onSuccess(flow_id);

                // Clear flow name, description, and definition
                setFlowName('');
                setFlowDescription('');
                setFlowDefinition('');

                onClose();
                return;
            }

            // Otherwise, create flow with data
            const flowData: any = {};
            if (flowName.trim()) {
                flowData.name = flowName.trim();
            }
            if (flowDescription.trim()) {
                flowData.description = flowDescription.trim();
            }
            if (flowDefinition.trim()) {
                try {
                    flowData.flow_definition = JSON.parse(flowDefinition);
                } catch (error) {
                    toast('Error', {
                        description: 'Invalid JSON in flow definition.',
                    });
                    return;
                }
            }

            const flow = await createFlowMutation.mutateAsync(flowData);
            toast('Flow Created', {
                description: `Flow "${flow.name}" created successfully.`,
            });
            onSuccess(flow.flow_id);
            // Clear flow name, description, and definition
            setFlowName('');
            setFlowDescription('');
            setFlowDefinition('');
            onClose();
        } catch (error) {
            console.error('Create flow failed:', error);
            toast('Error', {
                description: 'An error occurred while creating flow.',
            });
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl font-semibold">
                        Create New Flow
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Create a new flow with optional name and definition
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    <div className="space-y-2">
                        <Label
                            htmlFor="flowName"
                            className="text-sm font-medium"
                        >
                            Flow Name
                        </Label>
                        <Input
                            id="flowName"
                            value={flowName}
                            onChange={e => setFlowName(e.target.value)}
                            placeholder="Enter flow name"
                            className="h-10"
                        />
                        <p className="text-xs text-muted-foreground">
                            Optional: Give your flow a descriptive name
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="flowDescription"
                            className="text-sm font-medium"
                        >
                            Description
                        </Label>
                        <Textarea
                            id="flowDescription"
                            value={flowDescription}
                            onChange={e => setFlowDescription(e.target.value)}
                            placeholder="Enter a description for your flow (optional)"
                            rows={3}
                            className="resize-y max-h-32 overflow-y-auto"
                        />
                        <p className="text-xs text-muted-foreground">
                            Optional: Provide a description to help others
                            understand what this flow does
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label
                                htmlFor="flowDefinition"
                                className="text-sm font-medium"
                            >
                                Flow Definition
                            </Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={triggerFileInput}
                                disabled={isUploading}
                                className="h-8 px-3 text-xs"
                            >
                                {isUploading ? 'Uploading...' : 'Upload JSON'}
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>
                        <div className="relative">
                            <Textarea
                                id="flowDefinition"
                                value={flowDefinition}
                                onChange={handleFlowDefinitionChange}
                                placeholder="Enter flow definition as JSON or upload a file"
                                rows={6}
                                className="resize-y max-h-60 overflow-y-auto"
                            />
                            {isValidJson !== null && (
                                <div className="absolute top-2 right-2">
                                    {isValidJson ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Optional: Provide a JSON definition for your
                                flow
                            </p>
                            {isValidJson === false && (
                                <div className="flex items-center text-xs text-red-500">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Invalid JSON format
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="h-10"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateFlow}
                        disabled={createFlowMutation.isPending}
                        className="h-10 min-w-[100px]"
                    >
                        {createFlowMutation.isPending
                            ? 'Creating...'
                            : 'Create Flow'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateFlowModal;
