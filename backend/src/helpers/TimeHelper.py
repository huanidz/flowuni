from datetime import datetime, timedelta, timezone
from typing import Optional

from loguru import logger


class TimeHelper:
    @staticmethod
    def iso_to_unix_timestamp(iso_str: str, utc_offset: int = 0) -> Optional[int]:
        """
        Convert ISO 8601 datetime string to Unix timestamp with a fixed UTC offset.

        Args:
            iso_str (str): The ISO 8601 datetime string (e.g., "2025-04-09T14:30:00Z").
            utc_offset (int): Timezone offset from UTC in hours (e.g., +7, -5).

        Returns:
            int: Unix timestamp.
        """
        try:
            # Strip 'Z' if present
            iso_str = iso_str.replace("Z", "")
            # Parse the datetime string
            dt = datetime.strptime(iso_str, "%Y-%m-%dT%H:%M:%S")
            # Apply fixed UTC offset
            tz = timezone(timedelta(hours=utc_offset))
            dt = dt.replace(tzinfo=tz)
            # Convert to UTC-based Unix timestamp
            return int(dt.timestamp())
        except Exception:
            logger.error(
                "Unexpected error happen when converting iso to unix timestamp"
            )
            return None

    @staticmethod
    def get_current_time_str(utc_offset: int = 0) -> str:
        """
        Get the current time string with a fixed UTC offset.

        Args:
            utc_offset (int): Timezone offset from UTC in hours (e.g., +7, -5).

        Returns:
            str: Formatted current time string like "Current time (YYYY/MM/dd HH/mm/ss): 2025/10/01 12:32:14"
        """
        try:
            # Create timezone with the specified offset
            tz = timezone(timedelta(hours=utc_offset))
            # Get current time in the specified timezone
            current_time = datetime.now(tz)
            # Format as YYYY/MM/dd HH:mm:ss
            formatted_time = current_time.strftime("%Y/%m/%d %H:%M:%S")
            return f"Current time (UTC+{utc_offset}) (YYYY/MM/dd HH/mm/ss): {formatted_time}"
        except Exception:
            logger.error("Unexpected error happen when getting current time string")
            return "Current time (YYYY/MM/dd HH/mm/ss): Error getting time"
