from typing import List, Any, Dict


def truncate_text(text: str, max_length: int = 200) -> str:
    """Truncate text to specified length and add ellipsis if necessary."""
    if text and len(text) > max_length:
        return text[: max_length - 3] + "..."
    return text if text else ""


def colored(r, g, b, string):
    """
    Apply RGB color to a string using ANSI escape codes.

    Parameters:
        r (int): Red component (0-255).
        g (int): Green component (0-255).
        b (int): Blue component (0-255).
        string (str): The text to colorize.

    Returns:
        str: The colorized string.
    """

    return f"\033[38;2;{r};{g};{b}m{string}\033[0m"


def clean_spaces(string: str) -> str:
    return string.replace("  ", " ")


def remove_keys_from_json(
    json_obj: Dict[str, Any], keys_to_remove: List[str]
) -> Dict[str, Any]:
    """
    Recursively remove specified keys from a nested JSON object.

    :param json_obj: The JSON object (dictionary) to process.
    :param keys_to_remove: A list of keys to remove from the JSON object.
    :return: The modified JSON object with specified keys removed.
    """
    # Create a copy of the dictionary to avoid modifying the original object
    json_obj_copy = json_obj.copy()

    for key, value in json_obj.items():
        if key in keys_to_remove:
            del json_obj_copy[key]
        elif isinstance(value, dict):
            # Recursively call the function for nested dictionaries
            json_obj_copy[key] = remove_keys_from_json(value, keys_to_remove)
        elif isinstance(value, list):
            # Handle lists by iterating through each element
            json_obj_copy[key] = [
                remove_keys_from_json(item, keys_to_remove)
                if isinstance(item, dict)
                else item
                for item in value
            ]

    return json_obj_copy
