from typing import List, Optional

from pydantic import BaseModel


class RegexRuleParser(BaseModel):
    pattern: str
    flags: Optional[List[str]] = []
