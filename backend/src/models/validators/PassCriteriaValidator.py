from typing import List, Literal, Union

from loguru import logger
from pydantic import BaseModel, Field
from src.models.parsers.LLMJudgeParser import LLMJudgeRuleParser
from src.models.parsers.RegexRuleParser import RegexRuleParser
from src.models.parsers.StringRuleParser import StringRuleParser


class PassCriteriaRuleItem(BaseModel):
    type: Literal["string", "regex", "llm_judege"] = Field(
        ..., description="Type of the Rule. Must be one of above"
    )
    config: Union[LLMJudgeRuleParser, RegexRuleParser, StringRuleParser] = Field(
        ..., description="Rule specific configuration"
    )
    id: int = Field(..., description="Id of the rule.")


class PassCriteriaValidator(BaseModel):
    """
    Validator for pass_criteria field in test cases.

    This model validates the structure of pass_criteria which consists of:
    - rules: A list of rule parsers (LLMJudgeRuleParser, RegexRuleParser, or StringRuleParser)
    - logics: A list of strings representing logical operations
    """

    rules: List[PassCriteriaRuleItem] = Field(
        ..., description="List of rules to validate against"
    )
    logics: List[str] = Field(
        ..., description="List of logical operations to combine rules"
    )

    class Config:
        """Pydantic model configuration"""

        arbitrary_types_allowed = True

    def __init__(self, **data):
        """
        Initialize the PassCriteriaValidator with validation logging.

        Args:
            **data: Data to initialize the model with

        Raises:
            ValidationError: If the data doesn't conform to the model schema
        """
        try:
            super().__init__(**data)
            logger.debug("PassCriteria validation successful")
        except Exception as e:
            logger.error(f"PassCriteria validation failed: {e}")
            raise
