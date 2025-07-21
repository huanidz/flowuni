from typing import Optional
from loguru import logger
import sys

from .config import get_settings


def setup_logger(level: Optional[str] = None):
    """
    Set up the application logger with the specified logging level.

    Args:
        level: The logging level to use. If not provided, uses the level from settings.
    """
    settings = get_settings()

    # Use the setting's log level if none is provided
    log_level = level or settings.LOG_LEVEL

    # Remove default handlers
    logger.remove()

    # Add a new handler with colorized output
    logger.add(
        sys.stdout,
        level=log_level,
        backtrace=settings.LOG_BACKTRACE,
        diagnose=True,
        colorize=True,  # Enables color
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
            "<level>{message}</level>"
        ),
    )

    logger.info(
        f"Logging configured with level: {log_level}, backtrace: {settings.LOG_BACKTRACE}"
    )
