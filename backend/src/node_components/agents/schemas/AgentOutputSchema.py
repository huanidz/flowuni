from typing import List
from pydantic import BaseModel, Field
from ..tools.ToolBase import ToolUsed


class AgentOutputSchema(BaseModel):
    reasoning: str = Field(
        description=(
            "The agent's internal reasoning about whether a tool is needed and which tool(s) "
            "would be most effective for the current user query. This should consider the context "
            "of the query and any recent tool usage."
        )
    )
    planned_tool_calls: List[ToolUsed] = Field(
        description=(
            "A list of tool calls the agent plans to make next, including tool names and "
            "all required input parameters."
        )
    )
    final_response: str = Field(
        description=(
            "The final user-facing response. This should clearly communicate the outcome, "
            "including a summary of the tool selection process if relevant. "
            "If tool usage is involved, the response should indicate to the user that you "
            "are performing an internal action or retrieving necessary information, "
            "without revealing the specific tool name or implementation details."
        )
    )
