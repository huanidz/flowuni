from typing import Any, Dict, Optional

from pydantic import BaseModel
from src.repositories.RepositoriesContainer import RepositoriesContainer
from src.services.ServicesContainer import ServicesContainer


class ExecutionContext(BaseModel):
    """Immutable run-level context, plus a handle to shared state."""

    run_id: str
    flow_id: str
    session_id: Optional[str] = (
        None  # Optional, this will control the whole execution session, if this value is None, then a flow will be treated as single execution request. # noqa
    )
    user_id: Optional[str] = None

    # Small metadata to carry around (safe to serialize if needed)
    metadata: Dict[str, Any] = {}

    # Shared repos and services
    repositories: RepositoriesContainer = RepositoriesContainer()
    services: ServicesContainer = ServicesContainer()

    class Config:
        arbitrary_types_allowed = True
