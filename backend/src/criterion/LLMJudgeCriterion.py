from loguru import logger
from pydantic import BaseModel, Field
from src.components.llm.models.core import (
    ChatMessage,
)
from src.components.llm.providers.adapters.LLMProviderInterface import LLMProviderBase
from src.components.llm.providers.LLMProviderFactory import LLMProviderFactory
from src.criterion.BaseCriterion import Criterion
from src.models.parsers.LLMProviderParser import LLMProviderParser
from src.models.validators.PassCriteriaRunnerModels import CheckResult
from src.models.validators.PassCriteriaValidator import LLMJudgeRuleParser


class JudgeResult(BaseModel):
    is_passed: bool = Field(description="Whether the criterion passed")
    reason: str = Field(
        description="Reason for failure. If success, this will be empty."
    )


class LLMJudgeCriterion(Criterion):
    def __init__(self, id: str, input: str, rule: LLMJudgeRuleParser):
        super().__init__(id)
        self.input = input
        self.rule = rule

        llm_provider: LLMProviderParser = rule.llm_provider

        self.llm_provider_instance: LLMProviderBase = LLMProviderFactory.get_provider(
            provider_name=llm_provider.provider
        )

        default_system_prompt = (
            "You are a judge. Check if the input meets the given criteria. "
            "If it does, return PASSED. If not, return FAILED with a short reason. "
            "If no criteria are given, return PASSED."
        )  # noqa
        self.llm_provider_instance.init(
            model=llm_provider.model,
            system_prompt=llm_provider.system_prompt
            if llm_provider.system_prompt
            else default_system_prompt,
            api_key=llm_provider.api_key,
        )

    def run(self) -> CheckResult:
        """
        Runs the LLM Judge criterion.

        It generates a chat message with the given input, and then asks the LLM provider to generate a response based on the given criteria.
        The response is then judged based on the criteria, and a CheckResult is returned with the result of the judgment.

        Returns:
            CheckResult: The result of the judgment.
        """  # noqa

        try:
            CHAT_CONTENT = self._get_chat_content()

            chat_messages = [ChatMessage(role="user", content=CHAT_CONTENT)]
            response_model = self.llm_provider_instance.structured_completion(
                messages=chat_messages, output_schema=JudgeResult
            )

            return CheckResult(
                passed=response_model.is_passed, reason=response_model.reason
            )
        except Exception as e:
            logger.error(f"Error running LLM Judge criterion: {e}")
            return CheckResult(passed=False, reason="System error")

    def _get_chat_content(self):
        INPUT = f"""<input>\n{self.input}\n</input>"""
        NO_CRITERIA = """<criteria>\nNO CRITERIA\n</criteria>"""

        criteria_instruction = f"""<criteria>\n{self.rule.instruction}\n</criteria>"""

        if not criteria_instruction:
            return INPUT + "\n\n" + NO_CRITERIA

        return INPUT + "\n\n" + criteria_instruction
