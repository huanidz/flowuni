from typing import AsyncGenerator, Generator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker
from src.configs.config import get_app_settings

app_settings = get_app_settings()

# Cấu hình kết nối database (thay thế bằng URL thực tế của bạn)
DATABASE_URL = app_settings.DATABASE_URL

# Tạo engine kết nối với database
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


# Hàm get_db() để lấy session từ database (sync version)
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db  # Trả về session để sử dụng
    finally:
        db.close()  # Đóng session sau khi sử dụng


# --- ASYNC ---

# Use create_async_engine for asynchronous connections
ASYNC_DB_URL = app_settings.ASYNC_DATABASE_URL
async_engine = create_async_engine(ASYNC_DB_URL, echo=False)

# Use async_sessionmaker for asynchronous sessions
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,  # Explicitly set the session class
    expire_on_commit=False,
    autobegin=True,
)


# Asynchronous function to get a database session
async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
