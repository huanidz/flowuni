from ..shared.AppBaseModel import AppBaseModel
from sqlalchemy import Column, BigInteger, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID


class ChatThreadContentModel(AppBaseModel):
    """
    Represents a message in a conversation thread.

    Attributes:
        id (int): Unique identifier for the message.
        thread_id (int): The thread this message belongs to.
        role (str): The role of the message sender - either "user" or "model".
        content (str): The content of the message.

    Relationships:
        thread (Thread): The thread this message belongs to.
    """

    __tablename__ = "contents"

    interaction_id = Column(UUID(as_uuid=True), nullable=True)
    thread_id = Column(BigInteger, ForeignKey("threads.id"), nullable=False)
    role = Column(String(32), nullable=False)
    content = Column(Text, nullable=True)

    # Relationship to Thread
    thread = relationship("ChatThreadModel", back_populates="contents", lazy=True)

    def __init__(self, thread_id: int, role: str, content: str, interaction_id: str):
        """
        Initialize a ThreadContent object.

        Args:
            thread_id (int): The thread this message belongs to.
            role (str): The role of the message sender - either "user" or "model".
            content (str): The content of the message.
        """
        self.interaction_id = interaction_id
        self.thread_id = thread_id
        self.role = role
        self.content = content

    def __repr__(self):
        return f"<ThreadContent - id: {self.id}, thread_id: {self.thread_id}, role: {self.role}, content: {self.content}>"

    def to_dict(self):
        """
        Convert the ThreadContent object to a dictionary.

        Returns:
            dict: A dictionary with the message's id, thread_id, role and content.
        """
        return {
            "id": self.id,
            "thread_id": self.thread_id,
            "role": self.role,
            "content": self.content,
        }
