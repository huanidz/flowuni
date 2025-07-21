from pydantic import BaseModel, create_model, Field, field_validator
from typing import Literal, List, Type

from src.agents.Agent import Agent


class StructuredOutputModelBuilder:
    def __init__(self):
        pass

    @staticmethod
    def create_classification_model(
        pydantic_model_name: str, labels: List[str]
    ) -> Type[BaseModel]:
        """
        Dynamically creates a Pydantic model for classification with a 'label' field
        constrained to the provided list of labels.

        Args:
            labels (List[str]): List of valid classification labels.

        Returns:
            Type[BaseModel]: A Pydantic model class with a 'label' field using Literal.
        """
        # Create a Literal type dynamically from the labels list
        LabelLiteral = Literal[*labels]

        fields = {
            "reasoning": (
                str,
                Field(description="The reasoning lead to the prediction."),
            ),
            "labels": (
                List[LabelLiteral],
                Field(description="The classification labels."),
            ),
        }

        # Create the model with the 'label' field
        ClassificationModel = create_model(
            pydantic_model_name, **fields, __base__=BaseModel
        )

        return ClassificationModel

    @staticmethod
    def create_task_planning_model(
        pydantic_model_name: str, agents: List[Agent]
    ) -> Type[BaseModel]:
        agent_ids = [agent.settings.agent_id for agent in agents]

        # Validator function that checks allowed values
        def validate_agent_id(cls, v):
            if v not in agent_ids:
                raise ValueError(f"Invalid agent ID. Allowed values: {agent_ids}")
            return v

        # Create TaskItem model with direct enum injection
        TaskItem = create_model(
            "TaskItem",
            task_agent_id=(
                str,  # Basic type
                Field(
                    ...,
                    description="ID of the agent who will handle the task.",
                    json_schema_extra={"enum": agent_ids},  # Direct enum injection
                ),
            ),
            task_name=(str, Field(description="Name of the task.")),
            task_description=(str, Field(description="Description of the task.")),
            task_input=(
                str,
                Field(
                    description="Inputs for the task with all the context that is needed. This is the part of the original query that will involved in the task (Note: timestamp of the input is also included)."
                ),
            ),
            __validators__={
                "validate_agent_id": field_validator("task_agent_id")(validate_agent_id)
            },
            __base__=BaseModel,
        )

        # Create main model
        return create_model(
            pydantic_model_name,
            reasoning=(
                str,
                Field(
                    description="Reasoning for the task planning (Based on other agent's capabilities and limitations). Your reasoning should follow and output these steps:"
                    "## STEP 1: Identify the user query"
                    "## STEP 2: Identify other agents capabilities and limitations. DO NOT assume their capabilities other than provided."
                    "## STEP 3: Decide whether the capabilities of other agents are enough to handle the user query. If not, then the task planning should be empty."
                    "## SETP 4: If there're agent that can handle the query, identify the most suitable agent to handle it. Do not guess or make things up."
                ),
            ),
            task_items=(List[TaskItem], Field(description="List of task items.")),
            __base__=BaseModel,
        )
