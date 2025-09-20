from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class FlowSnapshotCreateRequest(BaseModel):
    """Represents the request to create a flow snapshot."""

    flow_id: str = Field(..., description="Flow ID")
    version: int = Field(..., description="Snapshot version")
    name: Optional[str] = Field(None, description="Flow name at snapshot time")
    description: Optional[str] = Field(
        None, description="Flow description at snapshot time"
    )
    flow_definition: Dict[str, Any] = Field(..., description="Flow definition")
    snapshot_metadata: Optional[Dict[str, Any]] = Field(
        None, description="Additional metadata"
    )
    flow_schema_version: Optional[str] = Field(None, description="Flow schema version")


class FlowSnapshotUpdateRequest(BaseModel):
    """Represents the request to update a flow snapshot."""

    id: int = Field(..., description="Snapshot ID")
    name: Optional[str] = Field(None, description="Flow name at snapshot time")
    description: Optional[str] = Field(
        None, description="Flow description at snapshot time"
    )
    flow_definition: Optional[Dict[str, Any]] = Field(
        None, description="Flow definition"
    )
    snapshot_metadata: Optional[Dict[str, Any]] = Field(
        None, description="Additional metadata"
    )
    flow_schema_version: Optional[str] = Field(None, description="Flow schema version")


class FlowSnapshotResponse(BaseModel):
    """Represents the response for a flow snapshot."""

    id: int = Field(..., description="Snapshot ID")
    flow_id: str = Field(..., description="Flow ID")
    version: int = Field(..., description="Snapshot version")
    name: Optional[str] = Field(None, description="Flow name at snapshot time")
    description: Optional[str] = Field(
        None, description="Flow description at snapshot time"
    )
    flow_definition: Dict[str, Any] = Field(..., description="Flow definition")
    snapshot_metadata: Optional[Dict[str, Any]] = Field(
        None, description="Additional metadata"
    )
    flow_schema_version: Optional[str] = Field(None, description="Flow schema version")
    created_at: str = Field(..., description="Creation timestamp")
    modified_at: str = Field(..., description="Modification timestamp")


class FlowSnapshotListResponseItem(BaseModel):
    """Represents a simplified flow snapshot for list responses."""

    id: int = Field(..., description="Snapshot ID")
    flow_id: str = Field(..., description="Flow ID")
    version: int = Field(..., description="Snapshot version")
    name: Optional[str] = Field(None, description="Flow name at snapshot time")
    created_at: str = Field(..., description="Creation timestamp")


class FlowSnapshotListResponse(BaseModel):
    """Represents the response for a list of flow snapshots."""

    data: List[FlowSnapshotListResponseItem] = Field(
        ..., description="List of flow snapshots"
    )
    total_count: int = Field(..., description="Total number of snapshots")
