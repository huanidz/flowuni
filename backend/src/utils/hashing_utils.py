import hashlib


def hash_sha256(data: str) -> str:
    """Return the SHA-256 hash of the given data."""
    return hashlib.sha256(data.encode(encoding="utf-8")).hexdigest()
