from typing import List

from pydantic import BaseModel, Field


class ToolParam(BaseModel):
    name: str = Field(description="Name of the tool parameter.")
    value: str = Field(description="Value of the tool parameter.")


class ToolUsed(BaseModel):
    tool_name: str = Field(description="Name of the tool used.")
    tool_params: List[ToolParam] = Field(description="Tool's parameters")


class AgentOutputSchema(BaseModel):
    reasoning: str = Field(
        description=(
            "The agent's internal reasoning about whether a tool is needed and which tool(s) "  # noqa
            "would be most effective for the current user query. This should consider the context "  # noqa
            "of the query and any recent tool usage."
        )
    )
    planned_tool_calls: List[ToolUsed] = Field(
        description=(
            "A list of tool calls the agent plans to make next, including tool names and "  # noqa
            "all required input parameters."
        )
    )
    final_response: str = Field(
        description=(
            "The final user-facing response. This should clearly communicate the outcome, "  # noqa
            "including a summary of the tool selection process if relevant. "
            "If tool usage is involved, the response should indicate to the user that you "  # noqa
            "are performing an internal action or retrieving necessary information, "
            "without revealing the specific tool name or implementation details."
        )
    )
