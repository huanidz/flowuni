import json
from typing import Any, Union


class Parser:
    @staticmethod
    def parse_structured_json(json_text: str) -> Union[Any, None]:
        """
        Parses structured JSON data from the input json_text.

        Args:
            json_text (str): The input json_text containing JSON data.

        Returns:
            Union[Any, None]: The parsed JSON object, or None if there was an error during parsing.
        """
        try:
            return json.loads(json_text)
        except (json.JSONDecodeError, TypeError):
            return None
