from __future__ import annotations

from typing import List, Optional, Union

from pydantic import BaseModel

# ---------- Result Models ----------


class CheckResult(BaseModel):
    passed: bool
    reason: Optional[str] = None
    is_cancelled: bool = False


class StepDetail(BaseModel):
    id: Union[str, int]
    result: CheckResult


class RunnerResult(BaseModel):
    passed: bool
    stop_reason: str
    failed_items: List[StepDetail] = []
    details: List[StepDetail] = []
