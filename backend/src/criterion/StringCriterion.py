from loguru import logger
from src.criterion.BaseCriterion import Criterion
from src.models.validators.PassCriteriaRunnerModels import CheckResult
from src.models.validators.PassCriteriaValidator import StringRuleParser


class StringCriterion(Criterion):
    def __init__(self, id: str, input: str, rule: StringRuleParser):
        super().__init__(id)
        self.input = input
        self.rule = rule

    def run(self) -> CheckResult:
        op = self.rule.operation
        val = self.rule.value
        logger.info(f"👉 val: {val}")
        s = self.input
        logger.info(f"👉 s: {s}")

        if op == "contains":
            passed = val in s
            reason = None if passed else f"'{val}' not found in '{s}'"
        elif op == "equals":
            passed = s == val
            reason = None if passed else f"'{s}' != '{val}'"
        elif op == "starts_with":
            passed = s.startswith(val)
            reason = None if passed else f"'{s}' does not start with '{val}'"
        elif op == "ends_with":
            passed = s.endswith(val)
            reason = None if passed else f"'{s}' does not end with '{val}'"
        elif op == "not_contains":
            passed = val not in s
            reason = None if passed else f"'{val}' unexpectedly found in '{s}'"
        elif op == "length_gt":
            passed = len(s) > int(val)
            reason = None if passed else f"len('{s}') = {len(s)} is not > {val}"
        elif op == "length_lt":
            passed = len(s) < int(val)
            reason = None if passed else f"len('{s}') = {len(s)} is not < {val}"
        elif op == "length_eq":
            passed = len(s) == int(val)
            reason = None if passed else f"len('{s}') = {len(s)} is not == {val}"
        else:
            return CheckResult(passed=False, reason=f"Unknown operation {op}")

        return CheckResult(passed=passed, reason=reason)
