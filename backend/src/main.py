from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from loguru import logger
from rich.traceback import install
from src.configs.config import get_settings
from src.configs.LoggingConfig import setup_logger
from src.dependencies.redis_dependency import get_redis_client
from src.routes.api_key_routes import api_key_router
from src.routes.auth_routes import auth_router
from src.routes.common_routes import common_router
from src.routes.flow_playground_session_routes import playground_router
from src.routes.flow_routes import flow_router
from src.routes.flow_runner_routes import flow_execution_router
from src.routes.flow_snapshot_routes import flow_snapshot_router
from src.routes.flow_test_routes import flow_test_router
from src.routes.node_routes import node_router
from src.utils.launch_utils import check_db_connection, check_redis_connection

install(show_locals=True)

# Get application settings and set up logging
app_settings = get_settings()
setup_logger(app_settings.LOG_LEVEL)

app = FastAPI(title="AI Service", description="AI Service API", version="0.0.1")

origins = [
    "http://localhost:5173",  # Your frontend's origin
]


@app.on_event("startup")
async def startup_event():
    """Clear cached node catalog on app startup to ensure fresh data."""
    try:
        redis_client = get_redis_client()
        redis_client.delete("node_catalog")
        logger.info("Cleared node catalog cache on startup")
    except Exception as e:
        logger.error(f"Failed to clear node catalog cache on startup: {str(e)}")


# Check external service connections
if not check_db_connection():
    raise ValueError("Database connection failed.")

if not check_redis_connection():
    raise ValueError("Redis connection failed.")

# Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Routes
app.include_router(common_router)

app.include_router(auth_router)
app.include_router(api_key_router)
app.include_router(node_router)
app.include_router(flow_router)
app.include_router(flow_execution_router)
app.include_router(flow_snapshot_router)
app.include_router(flow_test_router)
app.include_router(playground_router)
