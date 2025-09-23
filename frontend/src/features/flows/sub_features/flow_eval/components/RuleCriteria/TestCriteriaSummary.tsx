import React, { useMemo } from 'react';
import type { TestRule } from './RuleEditor';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type CriteriaWithConnectors = {
    rules: TestRule[];
    connectors: ('AND' | 'OR')[]; // connectors between rules
};

interface TestCriteriaSummaryProps {
    criteria: CriteriaWithConnectors;
    onToggleConnector?: (index: number) => void;
}

const TestCriteriaSummary: React.FC<TestCriteriaSummaryProps> = ({
    criteria,
    onToggleConnector,
}) => {
    const ruleLabel = (r: TestRule) => {
        if (r.type === 'string') return `String("${(r as any).value || ''}")`;
        if (r.type === 'regex') return `Regex(/${(r as any).pattern || ''}/)`;
        if (r.type === 'llm_judge') return `LLM(${(r as any).model || 'LLM'})`;
        return 'Rule';
    };

    const logicChain = useMemo(() => {
        const chain: string[] = [];
        criteria.rules.forEach((r, i) => {
            chain.push(ruleLabel(r));
            if (i < criteria.connectors.length)
                chain.push(criteria.connectors[i]);
        });
        return chain;
    }, [criteria]);

    return (
        <div className="sticky top-4">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                Logic Chain Summary
            </h3>
            {criteria.rules.length > 0 ? (
                <Card className="border-muted">
                    <CardContent className="py-2">
                        <div className="flex flex-wrap gap-2 items-center text-sm">
                            {logicChain.map((token, i) =>
                                token === 'AND' || token === 'OR' ? (
                                    <Badge
                                        key={i}
                                        variant="secondary"
                                        onClick={() =>
                                            onToggleConnector?.(
                                                Math.floor(i / 2)
                                            )
                                        }
                                        className={`cursor-pointer ${
                                            onToggleConnector
                                                ? ''
                                                : 'pointer-events-none'
                                        }`}
                                    >
                                        {token}
                                    </Badge>
                                ) : (
                                    <Badge key={i} variant="outline">
                                        {token}
                                    </Badge>
                                )
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-muted">
                    <CardContent className="py-6 text-center text-muted-foreground text-sm">
                        No rules added yet
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default TestCriteriaSummary;
