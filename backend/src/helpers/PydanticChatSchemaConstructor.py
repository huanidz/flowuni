from typing import List

from pydantic import BaseModel, Field, create_model


class ToolUsed(BaseModel):
    tool_name: str = Field(description="Name of the tool used.")


class SchemaFieldDescriptions:
    reasoning = (
        "The agent's internal reasoning about whether a tool is needed and which tool(s) "
        "would be most effective for the current user query. This should consider the context "
        "of the query and any recent tool usage."
    )
    planned_tool_calls = "A list of tool calls the agent plans to use."
    final_response = (
        "The final user-facing response. This should clearly communicate the outcome, "
        "including a summary of the tool selection process if relevant. "
        "If tool usage is involved, the response should indicate to the user that you "
        "are performing an internal action or retrieving necessary information, "
        "without revealing the specific tool name or implementation details."
    )


class PydanticChatSchemaConstructor:
    @staticmethod
    def create_agent_response_model(
        enable_reasoning: bool = True, enable_tool_use: bool = True
    ) -> type[BaseModel]:
        """
        Tạo một Pydantic model động cho AgentResponse dựa trên các tham số boolean.

        Args:
            enable_reasoning: Nếu True, trường reasoning sẽ được bao gồm trong model
            enable_tool_use: Nếu True, trường planned_tool_calls sẽ được bao gồm trong model

        Returns:
            Một Pydantic model class có tên là AgentResponse
        """
        fields = {}

        # Thêm trường reasoning nếu enable_reasoning là True
        if enable_reasoning:
            fields["reasoning"] = (
                str,
                Field(description=(SchemaFieldDescriptions.reasoning)),
            )

        # Thêm trường planned_tool_calls nếu enable_tool_use là True
        if enable_tool_use:
            fields["planned_tool_calls"] = (
                List[ToolUsed],
                Field(description=(SchemaFieldDescriptions.planned_tool_calls)),
            )

        # Trường final_response luôn được bao gồm
        fields["final_response"] = (
            str,
            Field(description=(SchemaFieldDescriptions.final_response)),
        )

        # Tạo model động sử dụng create_model
        return create_model("AgentResponse", __base__=BaseModel, **fields)

    # def
