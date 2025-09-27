from typing import Any, Dict

from loguru import logger
from src.models.parsers.LLMJudgeParser import LLMJudgeRuleParser
from src.models.parsers.RegexRuleParser import RegexRuleParser
from src.models.parsers.StringRuleParser import StringRuleParser
from src.models.validators.PassCriteriaValidator import PassCriteriaValidator


class TestCriteriaService:
    """
    Service for loading and managing test criteria rules.

    This service handles loading different types of rules (LLMJudge, RegexRule, StringRule)
    from the PassCriteriaValidator and provides methods to work with them.
    """

    def __init__(self, pass_criteria_dict: Dict[str, Any]):
        """Initialize the TestCriteriaService."""
        logger.debug("TestCriteriaService initialized")
        self.pass_criteria = PassCriteriaValidator.model_validate(pass_criteria_dict)

    def load(self, pass_criteria_dict: Dict[str, Any]) -> Dict[str, Any]:
        pass_criteria = PassCriteriaValidator.model_validate(pass_criteria_dict)

        logger.debug("Loaded test criteria rules")

        return pass_criteria
