# Container Usage Guide

## Quick Setup Pattern

### 1. Initialize Database Session
```python
from sqlalchemy.orm import Session
from src.containers.RepositoriesContainer import RepositoriesContainer
from src.containers.ServicesContainer import ServicesContainer

# Your DB session
db_session: Session = get_db_session()
```

### 2. Create Repositories Container
```python
# Initialize repositories with DB session
from src.repositories.UserRepository import UserRepository
from src.repositories.FlowRepositories import FlowRepository
from src.repositories.ApiKeyRepository import ApiKeyRepository

repos = RepositoriesContainer(
    user_repository=UserRepository(db_session),
    flow_repository=FlowRepository(db_session),
    api_key_repository=ApiKeyRepository(db_session)
)
```

### 3. Create Services Container (depends on repositories)
```python
from src.services.UserService import UserService
from src.services.FlowService import FlowService
from src.services.AuthService import AuthService

services = ServicesContainer(
    user_service=UserService(repos.user_repository),
    flow_service=FlowService(repos.flow_repository),
    auth_service=AuthService(secret_key, redis_client=redis_client)
)
```

## Usage in Application

### FastAPI Dependency Pattern
```python
from fastapi import Depends

# Global containers (or use dependency injection)
app_repos = RepositoriesContainer(...)
app_services = ServicesContainer(...)

def get_services() -> ServicesContainer:
    return app_services

def get_repos() -> RepositoriesContainer:
    return app_repos

# In your routes
@app.post("/auth/login")
async def login(
    request: LoginRequest,
    services: ServicesContainer = Depends(get_services)
):
    user = services.user_service.login(request.username, request.password)
    tokens = services.auth_service.generate_tokens(user.id)
    return {"access_token": tokens[0], "refresh_token": tokens[1]}
```

### Business Logic Usage
```python
def create_user_workflow(services: ServicesContainer, username: str, password: str):
    # Register user
    user = services.user_service.register(username, password)
    
    # Create initial flow
    flow_id = services.flow_service.create_empty_flow(user.id)
    
    # Generate API key
    api_key, key_model = services.api_key_service.issue_new_key(
        user.id, "Default Key", "Auto-generated key"
    )
    
    return {
        "user_id": user.id,
        "flow_id": flow_id,
        "api_key": api_key  # Only shown once!
    }
```

### Safe Access Pattern
```python
def safe_operation(services: ServicesContainer, user_id: int):
    # Always check availability for optional services
    if not services.is_service_available('flow_run_service'):
        raise ServiceUnavailableError("Flow execution service not available")
    
    # Safe to use
    result = services.flow_run_service.run_sync(flow_id, request, user_id)
    return result
```

## Container Management

### Application Startup
```python
class App:
    def __init__(self):
        self.repos = None
        self.services = None
    
    def initialize(self, db_session: Session, redis_client, secret_key: str):
        # 1. Setup repositories
        self.repos = RepositoriesContainer(
            user_repository=UserRepository(db_session),
            flow_repository=FlowRepository(db_session),
            api_key_repository=ApiKeyRepository(db_session),
            session_repository=SessionRepository(db_session)
        )
        
        # 2. Setup services (that depend on repos)
        self.services = ServicesContainer(
            user_service=UserService(self.repos.user_repository),
            flow_service=FlowService(self.repos.flow_repository),
            auth_service=AuthService(secret_key, redis_client=redis_client),
            api_key_service=ApiKeyService(self.repos.api_key_repository)
        )
        
        # 3. Add complex services that need multiple dependencies
        self.services.set_service(
            'flow_run_service',
            FlowRunService(self.repos.flow_repository, graph_executor)
        )

# Usage
app = App()
app.initialize(db_session, redis_client, "your-secret-key")

# Now use throughout your application
user = app.services.user_service.login(username, password)
```

### Modular Setup (Recommended)
```python
def setup_repositories(db_session: Session) -> RepositoriesContainer:
    return RepositoriesContainer(
        user_repository=UserRepository(db_session),
        flow_repository=FlowRepository(db_session),
        api_key_repository=ApiKeyRepository(db_session),
        session_repository=SessionRepository(db_session)
    )

def setup_services(repos: RepositoriesContainer, config: dict) -> ServicesContainer:
    services = ServicesContainer(
        user_service=UserService(repos.user_repository),
        flow_service=FlowService(repos.flow_repository),
        api_key_service=ApiKeyService(repos.api_key_repository),
        auth_service=AuthService(
            config['secret_key'], 
            redis_client=config['redis_client']
        )
    )
    
    # Add complex services
    if 'graph_executor' in config:
        services.set_service(
            'flow_run_service',
            FlowRunService(repos.flow_repository, config['graph_executor'])
        )
    
    return services

# Clean initialization
repos = setup_repositories(db_session)
services = setup_services(repos, app_config)
```

## Key Benefits

✅ **Clean dot notation**: `services.user_service.login()`  
✅ **None-safe**: No crashes if service isn't initialized  
✅ **Type hints**: Full IDE support and autocomplete  
✅ **Flexible**: Add/remove services at runtime  
✅ **Testable**: Easy to mock individual services  
✅ **Clear dependencies**: Services depend on repos, not vice versa

## Best Practices

1. **Initialize repos first**, then services (dependency order)
2. **Check availability** for optional services
3. **Use in FastAPI dependencies** for clean injection
4. **Keep containers at app level** - pass down as needed
5. **Don't mix concerns** - repos handle data, services handle business logic