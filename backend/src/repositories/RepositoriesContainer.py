from typing import Optional

from src.repositories.ApiKeyRepository import ApiKeyRepository
from src.repositories.BaseRepository import BaseRepository
from src.repositories.FlowRepositories import FlowRepository
from src.repositories.SessionRepository import SessionRepository
from src.repositories.UserRepository import UserRepository


class RepositoriesContainer:
    """
    Container for holding repository instances with dot notation access.
    All repositories can be None and are safely accessible.
    """

    def __init__(self, **repositories):
        """
        Initialize the repositories container with optional repository instances.

        Args:
            **repositories: Repository instances as keyword arguments

        Example:
            container = RepositoriesContainer(
                user_repository=user_repo_instance,
                flow_repository=flow_repo_instance
            )
        """
        # Initialize all known repositories to None
        self.api_key_repository: Optional[ApiKeyRepository] = None
        self.flow_repository: Optional[FlowRepository] = None
        self.session_repository: Optional[SessionRepository] = None
        self.user_repository: Optional[UserRepository] = None

        # Set provided repositories
        for repo_name, repo_instance in repositories.items():
            if hasattr(self, repo_name):
                setattr(self, repo_name, repo_instance)
            else:
                raise AttributeError(f"Unknown repository: {repo_name}")

    def set_repository(self, repository_name: str, repository_instance) -> None:
        """
        Set a repository instance by name.

        Args:
            repository_name: Name of the repository attribute
            repository_instance: Repository instance to set
        """
        if hasattr(self, repository_name):
            setattr(self, repository_name, repository_instance)
        else:
            raise AttributeError(f"Unknown repository: {repository_name}")

    def get_repository(self, repository_name: str):
        """
        Get a repository instance by name.

        Args:
            repository_name: Name of the repository attribute

        Returns:
            Repository instance or None if not set
        """
        return getattr(self, repository_name, None)

    def is_repository_available(self, repository_name: str) -> bool:
        """
        Check if a repository is available (not None).

        Args:
            repository_name: Name of the repository attribute

        Returns:
            True if repository exists and is not None
        """
        return (
            hasattr(self, repository_name)
            and getattr(self, repository_name) is not None
        )

    def get_available_repositories(self) -> list[str]:
        """
        Get list of repository names that are currently available (not None).

        Returns:
            List of available repository names
        """
        return [
            name
            for name in self.__dict__.keys()
            if self.__dict__[name] is not None and name.endswith("_repository")
        ]

    def __repr__(self) -> str:
        """String representation showing available repositories."""
        available = self.get_available_repositories()
        return f"RepositoriesContainer(available_repositories={available})"

    def __str__(self) -> str:
        """Human readable string representation."""
        available = self.get_available_repositories()
        return f"RepositoriesContainer with {len(available)} available repositories: {', '.join(available)}"  # noqa
