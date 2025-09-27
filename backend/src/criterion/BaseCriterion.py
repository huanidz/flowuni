from abc import ABC, abstractmethod

from src.models.validators.PassCriteriaRunnerModels import CheckResult


class Criterion(ABC):
    def __init__(self, id: str):
        self.id = id

    @abstractmethod
    def run(self) -> CheckResult:
        """Execute the check and return its result."""
