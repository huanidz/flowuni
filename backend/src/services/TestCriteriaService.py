from typing import Any, Dict, Union

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

    def __init__(self):
        """Initialize the TestCriteriaService."""
        logger.debug("TestCriteriaService initialized")

    def load(self, pass_criteria: PassCriteriaValidator) -> Dict[str, Any]:
        """
        Load rules from the PassCriteriaValidator while preserving order.

        This method processes the rules in the PassCriteriaValidator and returns them in
        their original order while also providing categorized access. The order is important
        because the logics (AND, OR, etc.) operate on the rules in sequence.

        Args:
            pass_criteria: PassCriteriaValidator containing rules and logics

        Returns:
            Dict[str, Any]: A dictionary containing:
                - ordered_rules: List of rule items in original order with their types and configs
                - llm_judge_rules: List of LLMJudgeRuleParser objects (for convenience)
                - regex_rules: List of RegexRuleParser objects (for convenience)
                - string_rules: List of StringRuleParser objects (for convenience)
                - logics: List of logical operations from the pass_criteria
        """
        logger.debug("Loading test criteria rules")

        ordered_rules: list[Dict[str, Any]] = []
        llm_judge_rules: list[LLMJudgeRuleParser] = []
        regex_rules: list[RegexRuleParser] = []
        string_rules: list[StringRuleParser] = []

        try:
            for rule_item in pass_criteria.rules:
                rule_type = rule_item.type
                rule_config = rule_item.config
                rule_id = rule_item.id

                # Add to ordered rules list to preserve sequence
                ordered_rules.append(
                    {"id": rule_id, "type": rule_type, "config": rule_config}
                )

                # Also categorize for convenience access
                if rule_type == "llm_judge" and isinstance(
                    rule_config, LLMJudgeRuleParser
                ):
                    llm_judge_rules.append(rule_config)
                    logger.debug(f"Loaded LLMJudge rule with ID: {rule_id}")

                elif rule_type == "regex" and isinstance(rule_config, RegexRuleParser):
                    regex_rules.append(rule_config)
                    logger.debug(f"Loaded Regex rule with ID: {rule_id}")

                elif rule_type == "string" and isinstance(
                    rule_config, StringRuleParser
                ):
                    string_rules.append(rule_config)
                    logger.debug(f"Loaded String rule with ID: {rule_id}")

                else:
                    logger.warning(
                        f"Unknown rule type '{rule_type}' or invalid config for rule ID: {rule_id}"
                    )

            result = {
                "ordered_rules": ordered_rules,
                "llm_judge_rules": llm_judge_rules,
                "regex_rules": regex_rules,
                "string_rules": string_rules,
                "logics": pass_criteria.logics,
            }

            logger.info(
                f"Successfully loaded {len(ordered_rules)} rules in order: "
                f"{len(llm_judge_rules)} LLMJudge, {len(regex_rules)} Regex, {len(string_rules)} String"
            )

            return result

        except Exception as e:
            logger.error(f"Error loading test criteria rules: {e}")
            raise
