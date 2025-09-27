from typing import List, Sequence

from src.criterion.BaseCriterion import Criterion
from src.models.validators.PassCriteriaRunnerModels import (
    CheckResult,
    RunnerResult,
    StepDetail,
)


class PassCriteriaRunner:
    """
    Evaluate criteria with AND/OR (no parentheses).
    - AND binds tighter than OR.
    - Short-circuits inside AND-groups on first failure.
    - Short-circuits across groups on first success.
    """

    def run(self, criteria: Sequence[Criterion], logics: Sequence[str]) -> RunnerResult:  # noqa
        if len(criteria) != len(logics) + 1:
            raise ValueError("Number of criteria must be len(logics) + 1")

        # Partition into AND-groups split by OR
        groups: List[List[Criterion]] = []
        cur: List[Criterion] = [criteria[0]]
        for op, crit in zip(logics, criteria[1:]):
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
