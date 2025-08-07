from typing import Union

from .basics.ConditionalResolver import ConditionalResolver
from .basics.HttpResolver import HttpResolver
from .basics.StaticResolver import StaticResolver

Resolver = Union[
    ConditionalResolver,
    HttpResolver,
    StaticResolver,
]
