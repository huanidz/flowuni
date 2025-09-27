import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { JSONPath } from 'jsonpath-plus';
import type {
    LLMJudge,
    CreateLLMJudgeRequest,
    UpdateLLMJudgeRequest,
    LLMProviderParser,
    LLMProvider,
    LLMSupportConfig,
} from '../types';
import { getLLMConfig } from '../api';

interface LLMJudgeFormProps {
    llmJudge?: LLMJudge;
    onSave: (request: CreateLLMJudgeRequest | UpdateLLMJudgeRequest) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const LLMJudgeForm: React.FC<LLMJudgeFormProps> = ({
    llmJudge,
    onSave,
    onCancel,
    isLoading = false,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [provider, setProvider] = useState('');
    const [model, setModel] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [temperature, setTemperature] = useState<number>(0.0);
    const [maxOutputTokens, setMaxOutputTokens] = useState<number>(1024);
    const [llmConfig, setLLMConfig] = useState<LLMSupportConfig | null>(null);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [selectedProvider, setSelectedProvider] =
        useState<LLMProvider | null>(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(false);

    useEffect(() => {
        const fetchLLMConfig = async () => {
            setIsLoadingConfig(true);
            try {
                const config = await getLLMConfig();
                setLLMConfig(config);
            } catch (error) {
                console.error('Failed to fetch LLM config:', error);
            } finally {
                setIsLoadingConfig(false);
            }
        };

        fetchLLMConfig();
    }, []);

    useEffect(() => {
        if (llmJudge) {
            setName(llmJudge.name || '');
            setDescription(llmJudge.description || '');

            if (llmJudge.data) {
                setProvider(llmJudge.data.provider);
                setModel(llmJudge.data.model);
                setApiKey(llmJudge.data.api_key);
                setSystemPrompt(llmJudge.data.system_prompt || '');
                setTemperature(llmJudge.data.temperature || 0.0);
                setMaxOutputTokens(llmJudge.data.max_output_tokens || 1024);
            }
        }
    }, [llmJudge]);

    useEffect(() => {
        if (llmConfig && provider) {
            const selectedProvider = llmConfig.supported_providers.find(
                p => p.provider_name === provider
            );
            setSelectedProvider(selectedProvider || null);

            if (selectedProvider) {
                if (selectedProvider.type === 'predefined') {
                    setAvailableModels(selectedProvider.predefined_models);
                } else if (selectedProvider.type === 'http') {
                    // For HTTP providers, we need to fetch models from the URL
                    fetchHttpModels(
                        selectedProvider.http_url,
                        selectedProvider.response_path
                    );
                }
            } else {
                setAvailableModels([]);
            }
        }
    }, [llmConfig, provider]);

    const fetchHttpModels = async (url: string, responsePath: string) => {
        try {
            const response = await fetch(url);
            const data = await response.json();

            // Extract models using JSONPath
            const models = JSONPath({ path: responsePath, json: data });

            // Normalize array results
            if (Array.isArray(models)) {
                setAvailableModels(
                    models.map(item =>
                        typeof item === 'string' ? item : String(item)
                    )
                );
            } else {
                setAvailableModels([]);
            }
        } catch (error) {
            console.error('Failed to fetch HTTP models:', error);
            setAvailableModels([]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const data: LLMProviderParser = {
            provider,
            model,
            api_key: apiKey,
            system_prompt: systemPrompt || undefined,
            temperature: temperature || undefined,
            max_output_tokens: maxOutputTokens || undefined,
        };

        if (llmJudge) {
            // Update existing LLM Judge
            const updateRequest: UpdateLLMJudgeRequest = {
                name: name || undefined,
                description: description || undefined,
                data: data,
            };
            onSave(updateRequest);
        } else {
            // Create new LLM Judge
            const createRequest: CreateLLMJudgeRequest = {
                name: name || undefined,
                description: description || undefined,
                data: data,
            };
            onSave(createRequest);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>
                    {llmJudge ? 'Edit LLM Judge' : 'Create New LLM Judge'}
                </CardTitle>
                <CardDescription>
                    Configure your LLM judge for evaluating responses
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Template Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Enter a name for this template"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe the purpose of this template"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <h3 className="text-lg font-medium">
                            LLM Provider Configuration
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="provider">Provider</Label>
                                <Select
                                    value={provider}
                                    onValueChange={setProvider}
                                    disabled={isLoadingConfig || !llmConfig}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a provider" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isLoadingConfig ? (
                                            <SelectItem
                                                value="loading"
                                                disabled
                                            >
                                                Loading providers...
                                            </SelectItem>
                                        ) : llmConfig &&
                                          llmConfig.supported_providers.length >
                                              0 ? (
                                            llmConfig.supported_providers.map(
                                                provider => (
                                                    <SelectItem
                                                        key={
                                                            provider.provider_name
                                                        }
                                                        value={
                                                            provider.provider_name
                                                        }
                                                    >
                                                        {provider.provider_name}
                                                    </SelectItem>
                                                )
                                            )
                                        ) : (
                                            <SelectItem value="none" disabled>
                                                No providers available
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="model">Model</Label>
                                <Select
                                    value={model}
                                    onValueChange={setModel}
                                    disabled={
                                        !provider ||
                                        availableModels.length === 0
                                    }
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {provider &&
                                        availableModels.length > 0 ? (
                                            availableModels.map(model => (
                                                <SelectItem
                                                    key={model}
                                                    value={model}
                                                >
                                                    {model}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>
                                                {provider
                                                    ? 'Loading models...'
                                                    : 'Select a provider first'}
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="Enter your API key"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="systemPrompt">
                                System Prompt (Optional)
                            </Label>
                            <Textarea
                                id="systemPrompt"
                                value={systemPrompt}
                                onChange={e => setSystemPrompt(e.target.value)}
                                placeholder="Enter a system prompt for the LLM"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="temperature">Temperature</Label>
                                <Input
                                    id="temperature"
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="2"
                                    value={temperature}
                                    onChange={e =>
                                        setTemperature(
                                            parseFloat(e.target.value) || 0.0
                                        )
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxOutputTokens">
                                    Max Output Tokens
                                </Label>
                                <Input
                                    id="maxOutputTokens"
                                    type="number"
                                    min="1"
                                    value={maxOutputTokens}
                                    onChange={e =>
                                        setMaxOutputTokens(
                                            parseInt(e.target.value) || 1024
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading
                            ? 'Saving...'
                            : llmJudge
                              ? 'Update'
                              : 'Create'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};

export default LLMJudgeForm;
