from typing import Union

from .basics import ConditionalResolver, HttpResolver, StaticResolver

__all__ = [
    "ConditionalResolver",
    "HttpResolver",
    "StaticResolver",
]

Resolver = Union[
    ConditionalResolver,
    HttpResolver,
    StaticResolver,
]
