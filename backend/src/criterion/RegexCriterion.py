import re

from src.criterion.BaseCriterion import Criterion
from src.models.parsers.RegexRuleParser import RegexRuleParser
from src.models.validators.PassCriteriaRunnerModels import CheckResult


class RegexCriterion(Criterion):
    def __init__(self, id: str, input: str, rule: RegexRuleParser):
        super().__init__(id)
        self.input = input
        self.rule = rule

    def run(self) -> CheckResult:
        flag_map = {
            "IGNORECASE": re.IGNORECASE,
            "MULTILINE": re.MULTILINE,
            "DOTALL": re.DOTALL,
            "UNICODE": re.UNICODE,
            "ASCII": re.ASCII,
            "VERBOSE": re.VERBOSE,
        }

        # Build combined flags from rule
        re_flags = 0
        for f in self.rule.flags or []:
            re_flags |= flag_map.get(f.upper(), 0)

        try:
            compiled = re.compile(self.rule.pattern, re_flags)
            matched = compiled.search(self.input) is not None
        except re.error as e:
            return CheckResult(passed=False, reason=f"Invalid regex: {e}")

        if matched:
            return CheckResult(passed=True)
        else:
            return CheckResult(
                passed=False,
                reason=f"Pattern {self.rule.pattern!r} not found in '{self.input}'",
            )
