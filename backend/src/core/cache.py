# src/core/cache.py
import hashlib
import json
from typing import Any, List


def generate_catalog_etag(catalog_data: List[Any]) -> str:
    """
    Generates a hash-based ETag from the catalog data.

    Args:
        catalog_data: Python list of node specs (before JSON serialization)

    Returns:
        A strong ETag string wrapped in quotes, e.g., "abc123def456"
    """
    # Serialize the data deterministically
    data_str = json.dumps(catalog_data, sort_keys=True, separators=(",", ":"))

    # Generate a SHA1 hash (or MD5 if you prefer shorter tags)
    etag_hash = hashlib.sha1(data_str.encode("utf-8")).hexdigest()

    # Wrap in quotes for valid ETag format
    return f'"{etag_hash}"'
