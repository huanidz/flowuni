from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from src.models.alchemy.shared.AppBaseModel import AppBaseModel


class FlowSnapshotModel(AppBaseModel):
    """
    Immutable snapshot of a Flow definition.
    """

    __tablename__ = "flow_snapshots"

    flow_id = Column(
        Integer, ForeignKey("flows.id", ondelete="CASCADE"), nullable=False
    )
    version = Column(Integer, nullable=False)

    # denormalized flow info at snapshot time
    name = Column(String, nullable=True)
    description = Column(String, nullable=True)

    flow_definition = Column(JSONB, nullable=False)
    is_current = Column(Boolean, default=False, nullable=False)

    # optional extras
    snapshot_metadata = Column(JSONB, nullable=True)
    flow_schema_version = Column(String, nullable=True)

    # relationships
    flow = relationship("FlowModel", back_populates="snapshots")

    __table_args__ = (
        UniqueConstraint("flow_id", "version", name="uq_flow_snapshot_flow_version"),
        Index("ix_flow_snapshots_flow_id", "flow_id"),
    )

    def __repr__(self):
        return (
            f"<FlowSnapshotModel(id={self.id}, flow_id={self.flow_id}, "
            f"version={self.version}, name={self.name}, is_current={self.is_current})>"
        )
