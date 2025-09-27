import React, { useMemo } from 'react';
import type { TestRule, CriteriaWithLogicConnectors } from '../../types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TEST_CRITERIA_RULE_TYPES } from '../../const';

interface TestCriteriaSummaryProps {
    criteria: CriteriaWithLogicConnectors;
    onToggleConnector?: (index: number) => void;
}

const TestCriteriaSummary: React.FC<TestCriteriaSummaryProps> = ({
    criteria,
    onToggleConnector,
}) => {
    const ruleLabel = (r: TestRule) => {
        if (r.type === TEST_CRITERIA_RULE_TYPES.STRING)
            return `String("${(r as any).config?.value || ''}")`;
        if (r.type === TEST_CRITERIA_RULE_TYPES.REGEX)
            return `Regex(/${(r as any).config?.pattern || ''}/)`;
        if (r.type === TEST_CRITERIA_RULE_TYPES.LLM_JUDGE)
            return `LLM(${(r as any).config?.data?.model || 'LLM'})`;
        return 'Rule';
    };

    const logicChain = useMemo(() => {
        const chain: string[] = [];
        criteria.rules.forEach((r, i) => {
            chain.push(ruleLabel(r));
            if (i < criteria.logics.length) chain.push(criteria.logics[i]);
        });
        return chain;
    }, [criteria]);

    return (
        <div className="sticky top-4">
            <h3 className="text-sm font-medium mb-3 text-emerald-950">
                Logic Chain Summary
                <span className="text-xs text-red-900">
                    <br />
                    (Runs in optimized order, stops at first failed rule/group)
                </span>
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
