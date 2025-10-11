from contextlib import asynccontextmanager
from time import time

from loguru import logger


@asynccontextmanager
async def timer(prefix=""):
    start = time()

    try:
        yield
    finally:
        end = time()
        logger.info(f"{prefix} took {end - start:.2f} seconds")
