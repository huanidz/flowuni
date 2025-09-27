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
        <div className="w-full max-w-6xl mx-auto p-6">
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="pb-8">
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        {llmJudge ? 'Edit LLM Judge' : 'Create New LLM Judge'}
                    </CardTitle>
                    <CardDescription className="text-base text-gray-600">
                        Configure your LLM judge for evaluating responses
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-10">
                        {/* Basic Information Section */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Basic Information
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label
                                        htmlFor="name"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Template Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Enter a name for this template"
                                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label
                                        htmlFor="description"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={e =>
                                            setDescription(e.target.value)
                                        }
                                        placeholder="Describe the purpose of this template"
                                        rows={3}
                                        className="resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* LLM Provider Configuration Section */}
                        <div className="space-y-6 border-t border-gray-200 pt-8">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    LLM Provider Configuration
                                </h3>
                            </div>

                            {/* Provider, Model, and API Key Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="space-y-3">
                                    <Label
                                        htmlFor="provider"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Provider{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={provider}
                                        onValueChange={setProvider}
                                        disabled={isLoadingConfig || !llmConfig}
                                        required
                                    >
                                        <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
                                              llmConfig.supported_providers
                                                  .length > 0 ? (
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
                                                            {
                                                                provider.provider_name
                                                            }
                                                        </SelectItem>
                                                    )
                                                )
                                            ) : (
                                                <SelectItem
                                                    value="none"
                                                    disabled
                                                >
                                                    No providers available
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label
                                        htmlFor="model"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Model{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={model}
                                        onValueChange={setModel}
                                        disabled={
                                            !provider ||
                                            availableModels.length === 0
                                        }
                                        required
                                    >
                                        <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
                                                <SelectItem
                                                    value="none"
                                                    disabled
                                                >
                                                    {provider
                                                        ? 'Loading models...'
                                                        : 'Select a provider first'}
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label
                                        htmlFor="apiKey"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        API Key{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="apiKey"
                                        type="password"
                                        value={apiKey}
                                        onChange={e =>
                                            setApiKey(e.target.value)
                                        }
                                        placeholder="Enter your API key"
                                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* System Prompt Row */}
                            <div className="space-y-3">
                                <Label
                                    htmlFor="systemPrompt"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    System Prompt
                                    <span className="text-gray-500 font-normal ml-1">
                                        (Optional)
                                    </span>
                                </Label>
                                <Textarea
                                    id="systemPrompt"
                                    value={systemPrompt}
                                    onChange={e =>
                                        setSystemPrompt(e.target.value)
                                    }
                                    placeholder="Enter a system prompt for the LLM"
                                    rows={4}
                                    className="resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-between items-center pt-8 border-t border-gray-200 bg-gray-50/50">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            className="px-8 py-2.5 border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        >
                            {isLoading
                                ? 'Saving...'
                                : llmJudge
                                  ? 'Update Template'
                                  : 'Create Template'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default LLMJudgeForm;
