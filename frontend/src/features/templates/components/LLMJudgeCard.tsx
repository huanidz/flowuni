import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import type { LLMJudge } from '../types';

interface LLMJudgeCardProps {
    llmJudge: LLMJudge;
    onEdit: (llmJudge: LLMJudge) => void;
    onDelete: (id: number) => void;
}

const LLMJudgeCard: React.FC<LLMJudgeCardProps> = ({
    llmJudge,
    onEdit,
    onDelete,
}) => {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    {llmJudge.name || 'Unnamed Judge'}
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(llmJudge)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(llmJudge.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardTitle>
                <CardDescription>
                    {llmJudge.description || 'No description provided'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {llmJudge.data && (
                    <div className="space-y-2">
                        <div>
                            <span className="font-medium">Provider:</span>{' '}
                            {llmJudge.data.provider}
                        </div>
                        <div>
                            <span className="font-medium">Model:</span>{' '}
                            {llmJudge.data.model}
                        </div>
                        {llmJudge.data.system_prompt && (
                            <div>
                                <span className="font-medium">
                                    System Prompt:
                                </span>{' '}
                                {llmJudge.data.system_prompt}
                            </div>
                        )}
                        {llmJudge.data.temperature !== undefined && (
                            <div>
                                <span className="font-medium">
                                    Temperature:
                                </span>{' '}
                                {llmJudge.data.temperature}
                            </div>
                        )}
                        {llmJudge.data.max_output_tokens !== undefined && (
                            <div>
                                <span className="font-medium">
                                    Max Output Tokens:
                                </span>{' '}
                                {llmJudge.data.max_output_tokens}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
                Created: {new Date(llmJudge.created_at).toLocaleDateString()}
                {llmJudge.modified_at !== llmJudge.created_at && (
                    <>
                        {' '}
                        • Updated:{' '}
                        {new Date(llmJudge.modified_at).toLocaleDateString()}
                    </>
                )}
            </CardFooter>
        </Card>
    );
};

export default LLMJudgeCard;
