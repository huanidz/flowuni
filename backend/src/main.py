from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from src.configs.config import get_settings
from src.configs.LoggingConfig import setup_logger
from src.routes.auth_routes import auth_router
from src.routes.common_routes import common_router
from src.routes.flow_routes import flow_router
from src.routes.flow_runner_routes import flow_execution_router
from src.routes.node_routes import node_router

# Get application settings and set up logging
app_settings = get_settings()
setup_logger(app_settings.LOG_LEVEL)

app = FastAPI(title="AI Service", description="AI Service API", version="0.0.1")

origins = [
    "http://localhost:5173",  # Your frontend's origin
]

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
app.include_router(node_router)
app.include_router(flow_router)
app.include_router(flow_execution_router)
