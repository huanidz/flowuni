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
import { JSONPath } from 'jsonpath-plus';
import { Search } from 'lucide-react';
import type {
    LLMJudge,
    CreateLLMJudgeRequest,
    UpdateLLMJudgeRequest,
    LLMProviderParser,
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
    const [isLoadingConfig, setIsLoadingConfig] = useState(false);
    const [providerSearchTerm, setProviderSearchTerm] = useState('');
    const [modelSearchTerm, setModelSearchTerm] = useState('');

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
        <form onSubmit={handleSubmit} className="w-full space-y-6">
            {/* Basic Information Section */}
            <div className="w-full space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Basic Information
                    </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    <div className="space-y-3 w-full">
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
                            className="w-full h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-3 w-full">
                        <Label
                            htmlFor="description"
                            className="text-sm font-medium text-gray-700"
                        >
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe the purpose of this template"
                            rows={3}
                            className="w-full resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* LLM Provider Configuration Section */}
            <div className="w-full space-y-6 border-t border-gray-200 pt-6">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        LLM Provider Configuration
                    </h3>
                </div>

                {/* Provider, Model, and API Key Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                    <div className="space-y-3 w-full">
                        <Label
                            htmlFor="provider"
                            className="text-sm font-medium text-gray-700"
                        >
                            Provider <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={provider}
                            onValueChange={setProvider}
                            disabled={isLoadingConfig || !llmConfig}
                            required
                        >
                            <SelectTrigger className="w-full h-11 min-h-[44px] border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Select a provider" />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="p-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search providers..."
                                            value={providerSearchTerm}
                                            onChange={e =>
                                                setProviderSearchTerm(
                                                    e.target.value
                                                )
                                            }
                                            onKeyDown={e => {
                                                // Prevent Select component's keyboard navigation
                                                // when typing in the search input
                                                e.stopPropagation();
                                            }}
                                            className="pl-8 h-8 text-sm"
                                        />
                                    </div>
                                </div>
                                {isLoadingConfig ? (
                                    <SelectItem value="loading" disabled>
                                        Loading providers...
                                    </SelectItem>
                                ) : llmConfig &&
                                  llmConfig.supported_providers.length > 0 ? (
                                    llmConfig.supported_providers
                                        .filter(provider =>
                                            provider.provider_name
                                                .toLowerCase()
                                                .includes(
                                                    providerSearchTerm.toLowerCase()
                                                )
                                        )
                                        .map(provider => (
                                            <SelectItem
                                                key={provider.provider_name}
                                                value={provider.provider_name}
                                            >
                                                {provider.provider_name}
                                            </SelectItem>
                                        ))
                                ) : (
                                    <SelectItem value="none" disabled>
                                        No providers available
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3 w-full">
                        <Label
                            htmlFor="model"
                            className="text-sm font-medium text-gray-700"
                        >
                            Model <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={model}
                            onValueChange={setModel}
                            disabled={!provider || availableModels.length === 0}
                            required
                        >
                            <SelectTrigger className="w-full h-11 min-h-[44px] border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="p-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search models..."
                                            value={modelSearchTerm}
                                            onChange={e =>
                                                setModelSearchTerm(
                                                    e.target.value
                                                )
                                            }
                                            onKeyDown={e => {
                                                // Prevent Select component's keyboard navigation
                                                // when typing in the search input
                                                e.stopPropagation();
                                            }}
                                            className="pl-8 h-8 text-sm"
                                        />
                                    </div>
                                </div>
                                {provider && availableModels.length > 0 ? (
                                    availableModels
                                        .filter(model =>
                                            model
                                                .toLowerCase()
                                                .includes(
                                                    modelSearchTerm.toLowerCase()
                                                )
                                        )
                                        .map(model => (
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

                    <div className="space-y-3 w-full">
                        <Label
                            htmlFor="apiKey"
                            className="text-sm font-medium text-gray-700"
                        >
                            API Key <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="apiKey"
                            type="password"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="Enter your API key"
                            className="w-full h-11 min-h-[44px] border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>
                </div>

                {/* System Prompt Row */}
                <div className="space-y-3 w-full">
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
                        onChange={e => setSystemPrompt(e.target.value)}
                        placeholder="Enter a system prompt for the LLM"
                        rows={4}
                        className="w-full resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-200 w-full">
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
            </div>
        </form>
    );
};

export default LLMJudgeForm;
