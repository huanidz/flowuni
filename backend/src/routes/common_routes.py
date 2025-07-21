from fastapi import APIRouter

common_router = APIRouter()


@common_router.get("/health")
def health():
    return {"status": "ok"}
