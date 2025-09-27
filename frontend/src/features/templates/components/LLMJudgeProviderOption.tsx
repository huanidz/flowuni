import React from 'react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { LLMSupportConfig, LLMProvider } from '../types';

interface LLMJudgeProviderOptionProps {
    provider: string;
    setProvider: (provider: string) => void;
    llmConfig: LLMSupportConfig | null;
    isLoadingConfig: boolean;
}

const LLMJudgeProviderOption: React.FC<LLMJudgeProviderOptionProps> = ({
    provider,
    setProvider,
    llmConfig,
    isLoadingConfig,
}) => {
    return (
        <div className="space-y-2 w-full">
            <Label htmlFor="provider">Provider</Label>
            <Select
                value={provider}
                onValueChange={setProvider}
                disabled={isLoadingConfig || !llmConfig}
                required
            >
                <SelectTrigger className="w-full h-11 min-h-[44px]">
                    <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                    {isLoadingConfig ? (
                        <SelectItem value="loading" disabled>
                            Loading providers...
                        </SelectItem>
                    ) : llmConfig &&
                      llmConfig.supported_providers.length > 0 ? (
                        llmConfig.supported_providers.map(
                            (provider: LLMProvider) => (
                                <SelectItem
                                    key={provider.provider_name}
                                    value={provider.provider_name}
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
    );
};

export default LLMJudgeProviderOption;
