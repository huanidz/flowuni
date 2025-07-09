from ..shared.AppBaseModel import AppBaseModel
from sqlalchemy import Column, String
from sqlalchemy.orm import relationship


class ChatThreadModel(AppBaseModel):
    """
    The Threads table represents a unique conversation between a user and a seller.

    Attributes:
        id (int): Unique identifier for the thread.
        user_id (str): The user's id.
        display_name (str): The user's display name.
    """

    __tablename__ = "threads"

    user_id = Column(String(50), nullable=False)

    # Relationship to ChatThreadContent
    contents = relationship(
        "ChatThreadContentModel", back_populates="thread", lazy=True
    )

    def __init__(self, user_id: str):
        """
        Initialize a Thread object.

        Args:
            user_id (str): The user's id.
        """
        self.user_id = user_id

    def __repr__(self):
        return f"<Thread - id: {self.id}, user_id: {self.user_id}"

    def to_dict(self):
        """
        Convert the Thread object to a dictionary.

        Returns:
            dict: A dictionary with the thread's id, user_id and display_name.
        """
        return {
            "thread_id": self.id,
            "user_id": self.user_id,
        }
