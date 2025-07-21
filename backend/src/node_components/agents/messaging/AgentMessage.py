from dataclasses import dataclass, field
from typing import Dict


@dataclass
class ContentType:
    TEXT = "text"


@dataclass
class AgentMessage:
    content: str
    content_type: str = "text"
    metadata: Dict = field(default_factory=dict)

    def __repr__(self) -> str:
        return (
            f"AgentMessage(\n"
            f"    content={self.content},\n"
            f"    content_type={self.content_type},\n"
            f"    metadata={self.metadata}\n"
            f")"
        )
