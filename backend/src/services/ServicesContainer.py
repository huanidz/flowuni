from typing import TYPE_CHECKING, Optional

from src.decorators.common_decorators import futureuse

if TYPE_CHECKING:
    from src.services.ApiKeyService import ApiKeyService, ApiKeyServiceInterface
    from src.services.AuthService import AuthService, AuthServiceInterface
    from src.services.FlowService import FlowService, FlowServiceInterface
    from src.services.NodeService import NodeService, NodeServiceInterface
    from src.services.UserService import UserService, UserServiceInterface


class ServicesContainer:
    """
    Container for holding service instances with dot notation access.
    All services can be None and are safely accessible.
    """

    def __init__(self, **services):
        """
        Initialize the services container with optional service instances.

        Args:
            **services: Service instances as keyword arguments

        Example:
            container = ServicesContainer(
                user_service=user_service_instance,
                auth_service=auth_service_instance
            )
        """
        # Initialize all known services to None
        self.api_key_service: Optional[ApiKeyServiceInterface] = None
        self.auth_service: Optional[AuthServiceInterface] = None
        self.flow_service: Optional[FlowServiceInterface] = None
        self.node_service: Optional[NodeServiceInterface] = None
        self.user_service: Optional[UserServiceInterface] = None

        # Set provided services
        for service_name, service_instance in services.items():
            if hasattr(self, service_name):
                setattr(self, service_name, service_instance)
            else:
                raise AttributeError(f"Unknown service: {service_name}")

    def set_service(self, service_name: str, service_instance) -> None:
        """
        Set a service instance by name.

        Args:
            service_name: Name of the service attribute
            service_instance: Service instance to set
        """
        if hasattr(self, service_name):
            setattr(self, service_name, service_instance)
        else:
            raise AttributeError(f"Unknown service: {service_name}")

    def get_service(self, service_name: str):
        """
        Get a service instance by name.

        Args:
            service_name: Name of the service attribute

        Returns:
            Service instance or None if not set
        """
        return getattr(self, service_name, None)

    def is_service_available(self, service_name: str) -> bool:
        """
        Check if a service is available (not None).

        Args:
            service_name: Name of the service attribute

        Returns:
            True if service exists and is not None
        """
        return hasattr(self, service_name) and getattr(self, service_name) is not None

    def get_available_services(self) -> list[str]:
        """
        Get list of service names that are currently available (not None).

        Returns:
            List of available service names
        """
        return [
            name
            for name in self.__dict__.keys()
            if self.__dict__[name] is not None and name.endswith("_service")
        ]

    def __repr__(self) -> str:
        """String representation showing available services."""
        available = self.get_available_services()
        return f"ServicesContainer(available_services={available})"

    def __str__(self) -> str:
        """Human readable string representation."""
        available = self.get_available_services()
        return f"ServicesContainer with {len(available)} available services: {', '.join(available)}"  # noqa
