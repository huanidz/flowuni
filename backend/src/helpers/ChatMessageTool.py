from src.models.alchemy.general.ChatThreadContentModel import ChatThreadContentModel

from typing import List, Dict
from src.messaging.AgentMessage import AgentMessage, ContentType
from src.utils.chat_route_utils import create_text_message, construct_communi_message


class ChatMessageTool:
    def __init__(self):
        pass

    @staticmethod
    def construct_total_chat_history_messages(
        messages: List[ChatThreadContentModel],
    ) -> str:
        chat_history_messages = ""
        for message in messages:
            chat_history_messages += f"{message.role}: {message.content}\n"

        return chat_history_messages

    @staticmethod
    def construct_communi_message(message: AgentMessage, thread_id: str) -> Dict:
        """
        Constructs a conversation message.

        Args:
            message (AgentMessage): The message to construct the conversation message for.

        Returns:
            Dict: The constructed conversation message.
        """

        message_content = {}
        if message.content_type == ContentType.TEXT:
            message_content = create_text_message(text=message.content)

        return construct_communi_message(
            content=message_content,
            content_type=message.content_type,
            thread_id=thread_id,
        )
