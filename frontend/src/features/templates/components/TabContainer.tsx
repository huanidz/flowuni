import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import LLMJudgesTab from './LLMJudgesTab';
import PromptTab from './PromptTab';

const TabContainer: React.FC = () => {
    return (
        <Tabs defaultValue="llm-judges" className="w-full">
            <TabsList className="w-fit">
                <TabsTrigger value="llm-judges">LLM Judges</TabsTrigger>
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
            </TabsList>
            <TabsContent
                value="llm-judges"
                className="mt-4 border rounded-md p-4"
            >
                <LLMJudgesTab />
            </TabsContent>
            <TabsContent value="prompt" className="mt-4 border rounded-md p-4">
                <PromptTab />
            </TabsContent>
        </Tabs>
    );
};

export default TabContainer;
