# Note: The id (primary key) of this model is declared at AppBaseModel.
# This id is treated as database-level unique. All kind of id currently defined
# is for app logic which may looks confusing at first but it does serve a purpose.

from enum import Enum

from sqlalchemy import BigInteger, Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from src.models.alchemy.shared.AppBaseModel import AppBaseModel


class TestCaseRunStatus(str, Enum):
    PENDING = "PENDING"
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    PASSED = "PASSED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    SYSTEM_ERROR = "SYSTEM_ERROR"


class FlowTestCaseRunModel(AppBaseModel):
    __tablename__ = "flow_test_case_runs"

    # Khóa ngoại trỏ về test case mà nó thuộc về
    test_case_id = Column(
        BigInteger,
        ForeignKey("flow_test_cases.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Dữ liệu kết quả được chuyển từ FlowTestCaseModel sang đây
    task_run_id = Column(String, nullable=True)  # Celery task run id
    status = Column(
        SQLEnum(TestCaseRunStatus, name="test_case_run_status"),
        nullable=False,
        default=TestCaseRunStatus.PENDING,
    )
    actual_output = Column(
        JSONB, nullable=True
    )  # The output of the flow (same as celery worker output (or same as FlowRunSyncWorker)) # noqa
    error_message = Column(Text, nullable=True)
    execution_time_ms = Column(Float, nullable=True)
    run_detail = Column(
        JSONB, nullable=True
    )  # This will be the whole graph with data. (This is used to load flow_from it. So user can know where to debug.) # noqa
    criteria_results = Column(JSONB, nullable=True)  # Kết quả pass_criteria chi tiết

    # Metadata về lần chạy (Rất quan trọng cho việc truy vết)
    trigger_type = Column(String, default="MANUAL")  # vd: "MANUAL", "API", "SCHEDULED"
    triggered_by = Column(String, nullable=True)  # vd: user_id, api_key_name

    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)

    # Quan hệ ngược lại để từ một Run có thể truy cập Test Case
    test_case = relationship("FlowTestCaseModel", back_populates="runs")
