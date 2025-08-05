from typing import Dict, Literal, Optional

from pydantic import Field, HttpUrl

from backend.src.nodes.handles.resolvers.BaseResolver import BaseResolver


class HttpResolver(BaseResolver):
    type: Literal["http"] = "http"

    # === REQUEST CONFIG ===
    url: HttpUrl = Field(
        ...,
        description="Endpoint URL (must be HTTPS)",
        example="https://api.openai.com/v1/models",
    )
    method: Literal["GET", "POST"] = Field(default="GET", description="HTTP method")
    headers: Dict[str, str] = Field(
        default_factory=lambda: {"Content-Type": "application/json"},
        description="Request headers (placeholders supported)",
    )
    params: Dict[str, str] = Field(
        default_factory=Dict, description="Query parameters (placeholders supported)"
    )
    body: Optional[Dict] = Field(
        default=None, description="Request body (for POST/PUT)"
    )

    # === RESPONSE HANDLING ===
    response_path: str = Field(
        default="data[*].id",
        description="JMESPath to extract values from response",
        example="data[?contains(id, 'gpt-4')].id",
    )
    error_path: Optional[str] = Field(
        default=None,
        description="JMESPath to extract error messages from response",
        example="error.message",
    )
