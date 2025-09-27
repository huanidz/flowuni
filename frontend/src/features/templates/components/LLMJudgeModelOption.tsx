import React from 'react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface LLMJudgeModelOptionProps {
    model: string;
    setModel: (model: string) => void;
    provider: string;
    availableModels: string[];
}

const LLMJudgeModelOption: React.FC<LLMJudgeModelOptionProps> = ({
    model,
    setModel,
    provider,
    availableModels,
}) => {
    return (
        <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select
                value={model}
                onValueChange={setModel}
                disabled={!provider || availableModels.length === 0}
                required
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                    {provider && availableModels.length > 0 ? (
                        availableModels.map(model => (
                            <SelectItem key={model} value={model}>
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
    );
};

export default LLMJudgeModelOption;
