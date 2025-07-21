from typing import List
from src.models.alchemy.general.ChatThreadContentModel import ChatThreadContentModel


class MessageConstructor:
    def __init__(self):
        pass

    @staticmethod
    def construct_text_message(text: str) -> str:
        return f"USER: {text}"

    @staticmethod
    def construct_image_message(image_url: str) -> str:
        return f"USER: Image URL: {image_url}"

    @staticmethod
    def construct_completion_inputs(
        chat_history, new_content=None, multimodal_contents: List = []
    ) -> List:
        completion_inputs = []
        chat_content: ChatThreadContentModel
        for chat_content in chat_history:
            if not chat_content.content:
                continue

            completion_inputs.append(
                {"role": chat_content.role, "content": chat_content.content}
            )

        # Always reverse the list so the most recent message is first
        completion_inputs.reverse()

        if not new_content and multimodal_contents:
            completion_inputs.append(
                {"role": "user", "content": [" "] + multimodal_contents}
            )

        if new_content:
            completion_inputs.append(
                {"role": "user", "content": [new_content] + multimodal_contents}
            )

        return completion_inputs
