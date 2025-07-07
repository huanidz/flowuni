from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from src.scripts.generate_node_catalog import generate_node_catalog_json

from src.configs.config import get_settings

from loguru import logger

app_settings = get_settings()

generate_node_catalog_json(output_path=app_settings.BACKEND_GENERATED_NODE_CATALOG_JSON_PATH)

app = FastAPI(title="AI Service", description="AI Service API", version="0.0.1")

# Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)