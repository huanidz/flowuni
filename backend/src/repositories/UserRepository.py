from src.models.alchemy.users.UserModel import UserModel
from src.repositories.BaseRepository import BaseRepository


class UserRepository(BaseRepository):
    def __init__(self, db_session):
        super().__init__(db_session)
        self.model = UserModel

    def get_by_username(self, username: str):
        """Get user by username"""
        return (
            self.db_session.query(UserModel)
            .filter(UserModel.username == username)
            .first()
        )
