from pydantic import BaseModel


class EmptyFlowCreateResponse(BaseModel):
    """Represents the response to a successful flow creation request."""

    flow_id: str
