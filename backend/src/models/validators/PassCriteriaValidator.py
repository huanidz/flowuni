from typing import List, Literal, Optional, Union

from pydantic import BaseModel, Field
from src.models.parsers.LLMJudgeParser import LLMJudgeRuleParser
from src.models.parsers.RegexRuleParser import RegexRuleParser
from src.models.parsers.StringRuleParser import StringRuleParser


class PassCriteriaRuleItem(BaseModel):
    type: Literal["string", "regex", "llm_judge"] = Field(
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

    rules: Optional[List[PassCriteriaRuleItem]] = Field(
        default=None, description="List of rules to validate against"
    )
    logics: Optional[List[str]] = Field(
        default=None, description="List of logical operations to combine rules"
    )

    class Config:
        """Pydantic model configuration"""

        arbitrary_types_allowed = True
