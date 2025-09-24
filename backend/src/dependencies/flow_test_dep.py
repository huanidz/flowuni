from fastapi import Depends
from src.dependencies.db_dependency import get_db
from src.dependencies.redis_dependency import get_redis_client
from src.repositories.FlowTestRepository import FlowTestRepository
from src.services.FlowTestService import FlowTestService


def get_flow_test_repository(db_session=Depends(get_db)) -> FlowTestRepository:
    """
    Dependency that returns FlowTestRepository instance.
    """
    return FlowTestRepository(db_session=db_session)


def get_flow_test_service(
    test_repository: FlowTestRepository = Depends(get_flow_test_repository),
    redis_client=Depends(get_redis_client),
) -> FlowTestService:
    """
    Dependency that returns FlowTestService instance.
    """
    return FlowTestService(test_repository=test_repository, redis_client=redis_client)
