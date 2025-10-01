from typing import List, Literal  # NEW

from pydantic import BaseModel, Field, create_model


class ToolUsed(BaseModel):
    tool_name: str = Field(description="Name of the tool used.")


class SchemaFieldDescriptions:
    reasoning = (
        "Short internal reasoning that: (1) justifies the tool choice(s), "
        "(2) VALIDATES whether the latest tool result matches the user's request, and "
        "(3) decides the next step (RETRY vs CONTINUE vs FINALIZE). "
        "If the tool result is irrelevant/incomplete/mismatched, "
        "you MUST prefer RETRY over FINALIZE and explain the adjustment you will make."
    )
    planned_tool_calls = (
        "A list of tool calls you plan to execute next. "
        "If next_action is CONTINUE or RETRY, this list MUST NOT be empty."
    )
    next_action = (
        "Loop control. "
        "Use 'CONTINUE' when you have more tool calls to execute in this iteration. "
        "Use 'RETRY' when the last tool attempt produced irrelevant, incorrect, or incomplete results, "
        "and you will try a different query, parameters, or approach. "
        "Use 'FINALIZE' ONLY when the final_response is ready AND the latest tool result (if any) "
        "is relevant and directly addresses the user's request."
    )
    final_response = (
        "The final user-facing response. Only non-empty when next_action is FINALIZE. "
        "Do not apologize and finalize if a retry is viable."
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

        # NEW: Always include next_action to control loop
        fields["next_action"] = (
            Literal["CONTINUE", "FINALIZE", "RETRY"],
            Field(description=(SchemaFieldDescriptions.next_action)),
        )

        # Trường final_response luôn được bao gồm
        fields["final_response"] = (
            str,
            Field(description=(SchemaFieldDescriptions.final_response)),
        )

        # Tạo model động sử dụng create_model
        return create_model("AgentResponse", __base__=BaseModel, **fields)
