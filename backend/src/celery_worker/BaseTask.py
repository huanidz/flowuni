import traceback

from celery import Task
from loguru import logger
from src.configs.config import get_app_settings

app_settings = get_app_settings()


class BaseTask(Task):
    # Auto-retry on specified exceptions
    autoretry_for = (Exception,)
    retry_kwargs = {
        "max_retries": app_settings.CELERY_MAX_RETRIES,
        "countdown": app_settings.CELERY_RETRY_DELAY,  # initial retry delay in seconds
    }
    retry_backoff = (
        app_settings.CELERY_RETRY_BACKOFF
    )  # exponential backoff (2s, 4s, 8s, ...)
    retry_backoff_max = app_settings.CELERY_RETRY_BACKOFF_MAX  # cap backoff to 60s
    retry_jitter = app_settings.CELERY_RETRY_JITTER  # adds randomness to retry timing

    def on_success(self, retval, task_id, args, kwargs):
        logger.info(f"[TASK SUCCESS] {self.name} (id={task_id}) returned: {retval}")

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(
            f"[TASK FAILURE] {self.name} (id={task_id}) raised: {exc}\n"
            f"Args: {args}\nKwargs: {kwargs}\n"
            # f"Traceback: {traceback.format_exc()}" # TODO: Handle traceback better
        )
        # Optional: report to Sentry, Prometheus, etc.
        # sentry_sdk.capture_exception(exc)

    def on_retry(self, exc, task_id, args, kwargs, einfo):
        logger.warning(
            f"[TASK RETRY] {self.name} (id={task_id}) retrying due to: {exc}"
        )

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        logger.debug(
            f"[TASK RETURN] {self.name} (id={task_id}) status: {status}, retval: {retval}"
        )
