from loguru import logger
import sys

def setup_logger(level="INFO"):
    logger.remove()
    logger.add(sys.stdout, level=level, backtrace=True, diagnose=True)
    logger.info(f"Logging level set to {level}")