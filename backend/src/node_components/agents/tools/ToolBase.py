from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from abc import ABC, abstractmethod

from pydantic import BaseModel, Field

@dataclass
class ToolResult:
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None

class BaseTool(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        pass
    
    @property
    @abstractmethod
    def parameters(self) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    def execute(self, input_dict: Dict[str, Any]) -> ToolResult:
        pass

    @staticmethod
    @abstractmethod
    def result_to_llm_friendly(tool_result: ToolResult) -> str:
        pass

# Pydantic models
# This can be used for structured output schema
class ToolParam(BaseModel):
    name: str = Field(description="Name of the tool parameter.")
    value: str = Field(description="Value of the tool parameter.")

class ToolUsed(BaseModel):
    tool_name: str = Field(description="Name of the tool used.")
    tool_params: List[ToolParam] = Field(description="Tool's parameters")

    def _to_llm_friendly(self) -> str:
        tool_params_str = "\n".join([f"- `{param.name}`: {param.value}" for param in self.tool_params])
        return f"Tool used: {self.tool_name}\nParameters:\n{tool_params_str}"