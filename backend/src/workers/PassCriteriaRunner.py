from typing import Any, Dict, List

from src.criterion import LLMJudgeCriterion, RegexCriterion, StringCriterion
from src.criterion.BaseCriterion import Criterion
from src.models.parsers import LLMJudgeParser, RegexRuleParser, StringRuleParser
from src.models.validators.PassCriteriaRunnerModels import (
    CheckResult,
    RunnerResult,
    StepDetail,
)
from src.models.validators.PassCriteriaValidator import PassCriteriaValidator


class PassCriteriaRunner:
    """
    Evaluate criteria with AND/OR (no parentheses).
    - AND binds tighter than OR.
    - Short-circuits inside AND-groups on first failure.
    - Short-circuits across groups on first success.
    """

    def __init__(self, flow_output: str):
        self.flow_output = flow_output

        self.logics_sequence: List[str] = []
        self.criteria_sequence: List[Criterion] = []

    def load(self, pass_criteria: Dict[str, Any]):
        # Literal["string", "regex", "llm_judge"]
        pass_criteria: PassCriteriaValidator = PassCriteriaValidator.model_validate(
            pass_criteria
        )
        self.logics_sequence: List[str] = pass_criteria.logics

        criteria_sequence: List[Criterion] = []
        for rule_parser in pass_criteria.rules:
            if rule_parser.type == "llm_judge":
                criteria_sequence.append(
                    LLMJudgeCriterion(
                        id=rule_parser.id,
                        input=self.flow_output,
                        rule=LLMJudgeParser.model_validate(rule_parser),
                    )
                )
            elif rule_parser.type == "string":
                criteria_sequence.append(
                    StringCriterion(
                        id=rule_parser.id,
                        input=self.flow_output,
                        rule=StringRuleParser.model_validate(rule_parser),
                    )
                )
            elif rule_parser.type == "regex":
                criteria_sequence.append(
                    RegexCriterion(
                        id=rule_parser.id,
                        input=self.flow_output,
                        rule=RegexRuleParser.model_validate(rule_parser),
                    )
                )
            else:
                raise ValueError(f"Unknown rule type: {rule_parser.type}")
        self.criteria_sequence: List[Criterion] = criteria_sequence

    def run(self) -> RunnerResult:  # noqa
        if len(self.criteria_sequence) != len(self.logics_sequence) + 1:
            raise ValueError("Number of criteria must be len(logics) + 1")

        # Partition into AND-groups split by OR
        groups: List[List[Criterion]] = []
        cur: List[Criterion] = [self.criteria_sequence[0]]
        for op, crit in zip(self.logics_sequence, self.criteria_sequence[1:]):
            op_u = op.strip().upper()
            if op_u == "AND":
                cur.append(crit)
            elif op_u == "OR":
                groups.append(cur)
                cur = [crit]
            else:
                raise ValueError(f"Unknown operator: {op}")
        groups.append(cur)

        failed_items: List[StepDetail] = []
        details: List[StepDetail] = []

        # Evaluate groups
        for gi, group in enumerate(groups):
            group_all_true = True
            for crit in group:
                res = crit.run()
                detail = StepDetail(id=crit.id, result=res)
                details.append(detail)

                if not res.passed:
                    failed_items.append(detail)
                    # cancel remaining in this AND group
                    for rem in group[group.index(crit) + 1 :]:
                        cancelled = CheckResult(passed=False, is_cancelled=True)
                        detail = StepDetail(id=rem.id, result=cancelled)
                        details.append(detail)
                        failed_items.append(detail)
                    group_all_true = False
                    break

            if group_all_true:
                # cancel subsequent groups
                for rem_group in groups[gi + 1 :]:
                    for rem in rem_group:
                        cancelled = CheckResult(passed=False, is_cancelled=True)
                        detail = StepDetail(id=rem.id, result=cancelled)
                        details.append(detail)
                        failed_items.append(detail)
                return RunnerResult(
                    passed=True,
                    stop_reason=f"group_success@{gi}",
                    failed_items=failed_items,
                    details=details,
                )

        # All groups failed
        return RunnerResult(
            passed=False,
            stop_reason="all_groups_failed",
            failed_items=failed_items,
            details=details,
        )
