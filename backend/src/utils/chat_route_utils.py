import json
import hmac
import hashlib
import requests
import time

from src.utils.format_utils import remove_keys_from_json, colored


def create_text_message(text):
    return {"text": text, "is_rtf": True}


def create_image_metadata(name, width, height, source_url, source_thumb_url, size):
    return {
        "name": name,
        "width": width,
        "height": height,
        "source_url": source_url,
        "source_thumb_url": source_thumb_url,
        "size": size,
        "type": "image",
    }


def create_button(label, action_type, payload):
    return {"label": label, "action": {"type": action_type, "payload": payload}}


def create_card(title, sub_title, image_url, buttons):
    return {
        "title": title,
        "sub_title": sub_title,
        "image_url": image_url,
        "buttons": buttons,
    }


def create_quick_reply_item(label, action_type, payload):
    return {"label": label, "action": {"type": action_type, "payload": payload}}


def create_quick_reply(items):
    return {"type": "quick_reply", "quick_reply": {"items": items}}


def construct_communi_message(
    content_type, content, thread_id="", ext_user_ids=None, user_ids=None
):
    if ext_user_ids is None:
        ext_user_ids = []
    if user_ids is None:
        user_ids = []

    message = {
        "thread_id": str(thread_id),
        "ext_user_ids": ext_user_ids,
        "user_ids": user_ids,
        "body": {},
    }

    if content_type == "text":
        message["body"] = content
    elif content_type == "image":
        message["body"] = {"text": "", "metadata": content}
    elif content_type == "card":
        message["body"] = {"text": "", "metadata": [{"type": "card", "cards": content}]}
    elif content_type == "quick_reply":
        message["body"] = {
            "text": content["text"],
            "is_rtf": True,
            "metadata": [content["quick_reply"]],
        }
    else:
        raise ValueError(f"Unsupported message type: {content_type}")

    return message


def make_headers(bot_token: str):
    default_headers = requests.utils.default_headers()
    custom_headers = {
        "Content-Type": "application/json",
    }
    headers = {**default_headers, **custom_headers}

    return headers


def make_default_headers():
    default_headers = requests.utils.default_headers()
    custom_headers = {
        "Content-Type": "application/json",
    }
    headers = {**default_headers, **custom_headers}
    return headers


def validate_signature(
    bot_token: str, signature: str, timestamp: str, body: str
) -> bool:
    """
    Validates the signature by comparing the computed HMAC-SHA256 hash
    of the concatenated timestamp and body with the provided signature.

    Args:
        bot_token (str): The bot's secret token.
        signature (str): The signature to validate.
        timestamp (str): The timestamp associated with the request.
        body (str): The request body.

    Returns:
        bool: True if the signature is valid, False otherwise.
    """
    # Create the HMAC-SHA256 hash object
    message = f"{timestamp}.{body}".encode("utf-8")
    hash_obj = hmac.new(bot_token.encode("utf-8"), message, hashlib.sha256)

    # Compute the hex digest of the hash
    computed_signature = hash_obj.hexdigest()

    # Use constant-time comparison to avoid timing attacks
    is_valid = hmac.compare_digest(computed_signature, signature)

    if not is_valid:
        return False

    return True


def get_curl_request(url, data=None, headers=None, method="POST", params=None) -> str:
    """
    Generate and print a cURL command equivalent to the given HTTP request.

    :param url: The URL for the request.
    :param data: The data payload to send in the request (as a dictionary or JSON string).
    :param headers: The headers to include in the request (as a dictionary).
    :param method: The HTTP method (default is POST).
    :param params: The query parameters to include in the URL (as a dictionary).
    """
    # Append params to URL if provided
    if params:
        from urllib.parse import urlencode

        url += "?" + urlencode(params)

    # Start building the curl command
    curl_command = [f'curl -X {method.upper()} "{url}"']

    # Add headers
    if headers:
        for key, value in headers.items():
            curl_command.append(f'-H "{key}: {value}"')

    # Add data
    if data:
        if isinstance(data, dict):
            import json

            data = json.dumps(data)  # Convert dictionary to JSON string
        curl_command.append(f"--data '{data}'")

    # Join the command with spaces and print it
    curl = (" \\n    ".join(curl_command))
    return curl


def log_incoming_message(data):
    """Log the incoming message in a readable format."""
    simplified_data = remove_keys_from_json(
        json_obj=data, keys_to_remove=["avatar_url"]
    )
    pretty_json = json.dumps(
        simplified_data, indent=4, sort_keys=True, ensure_ascii=False
    )
    current_time = time.ctime()
    print(colored(197, 29, 52, f"RECEIVED MESSAGE [START]: {current_time}"))
    print(pretty_json)
    print(colored(197, 29, 52, f"RECEIVED MESSAGE [END]: {current_time}"))


def is_valid_request(data):
    """Validate the request format."""
    return "text" in data.get("body", {})


def is_reset_command(text):
    """Check if the text is a reset command."""
    reset_commands = {
        "bắt đầu",
        "bắt đầu lại",
        "start",
        "bat dau lai",
        "bat dau",
        "bdl",
        "start again",
    }
    return text.lower() in reset_commands
