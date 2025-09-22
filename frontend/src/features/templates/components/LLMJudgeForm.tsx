import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type {
    LLMJudge,
    CreateLLMJudgeRequest,
    UpdateLLMJudgeRequest,
    LLMJudgeParser,
    LLMProviderParser,
} from '../types';

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
    const [judgeName, setJudgeName] = useState('');
    const [judgeDescription, setJudgeDescription] = useState('');
    const [provider, setProvider] = useState('');
    const [model, setModel] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [temperature, setTemperature] = useState<number>(0.0);
    const [maxOutputTokens, setMaxOutputTokens] = useState<number>(1024);

    useEffect(() => {
        if (llmJudge) {
            setName(llmJudge.name || '');
            setDescription(llmJudge.description || '');

            if (llmJudge.judge_config) {
                setJudgeName(llmJudge.judge_config.judge_name);
                setJudgeDescription(
                    llmJudge.judge_config.judge_description || ''
                );

                const llmProvider = llmJudge.judge_config.judge_llm_provider;
                setProvider(llmProvider.provider);
                setModel(llmProvider.model);
                setApiKey(llmProvider.api_key);
                setSystemPrompt(llmProvider.system_prompt || '');
                setTemperature(llmProvider.temperature || 0.0);
                setMaxOutputTokens(llmProvider.max_output_tokens || 1024);
            }
        }
    }, [llmJudge]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const llmProvider: LLMProviderParser = {
            provider,
            model,
            api_key: apiKey,
            system_prompt: systemPrompt || undefined,
            temperature: temperature || undefined,
            max_output_tokens: maxOutputTokens || undefined,
        };

        const judgeConfig: LLMJudgeParser = {
            judge_name: judgeName,
            judge_description: judgeDescription || undefined,
            judge_llm_provider: llmProvider,
        };

        if (llmJudge) {
            // Update existing LLM Judge
            const updateRequest: UpdateLLMJudgeRequest = {
                name: name || undefined,
                description: description || undefined,
                judge_config: judgeConfig,
            };
            onSave(updateRequest);
        } else {
            // Create new LLM Judge
            const createRequest: CreateLLMJudgeRequest = {
                name: name || undefined,
                description: description || undefined,
                judge_config: judgeConfig,
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
                            Judge Configuration
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="judgeName">Judge Name</Label>
                            <Input
                                id="judgeName"
                                value={judgeName}
                                onChange={e => setJudgeName(e.target.value)}
                                placeholder="Enter a name for the judge"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="judgeDescription">
                                Judge Description
                            </Label>
                            <Textarea
                                id="judgeDescription"
                                value={judgeDescription}
                                onChange={e =>
                                    setJudgeDescription(e.target.value)
                                }
                                placeholder="Describe the judge's purpose"
                                rows={2}
                            />
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h4 className="text-md font-medium">
                                LLM Provider Configuration
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="provider">Provider</Label>
                                    <Input
                                        id="provider"
                                        value={provider}
                                        onChange={e =>
                                            setProvider(e.target.value)
                                        }
                                        placeholder="e.g., OpenAI, Anthropic"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="model">Model</Label>
                                    <Input
                                        id="model"
                                        value={model}
                                        onChange={e => setModel(e.target.value)}
                                        placeholder="e.g., gpt-4, claude-3"
                                        required
                                    />
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
                                    onChange={e =>
                                        setSystemPrompt(e.target.value)
                                    }
                                    placeholder="Enter a system prompt for the LLM"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="temperature">
                                        Temperature
                                    </Label>
                                    <Input
                                        id="temperature"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="2"
                                        value={temperature}
                                        onChange={e =>
                                            setTemperature(
                                                parseFloat(e.target.value) ||
                                                    0.0
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
