import re

VALID_ID_RE = re.compile(r"^\d+-\d+$")


def _normalize_since_id(since_id) -> str:
    # Keep this conservative: just coerce common bad inputs into a valid XREAD ID
    if since_id is None:
        return "0-0"
    s = str(since_id).strip()
    if s in {"0-0", "$"}:
        return s
    if s == "0":  # main culprit
        return "0-0"
    if VALID_ID_RE.match(s):
        return s
    # Fallback to safe start
    return "0-0"
