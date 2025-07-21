from celery import Celery
from src.configs.config import get_settings

app_settings = get_settings()

BROKER_URL = app_settings.CELERY_BROKER_URL
RESULT_BACKEND = app_settings.CELERY_RESULT_BACKEND

celery_app = Celery(
    "worker",
    broker=BROKER_URL,
    backend=RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

celery_app.autodiscover_tasks(["src.celery_worker.tasks"])


@celery_app.task
def ping():
    return "pong"
