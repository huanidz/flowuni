from sqlalchemy.orm import Session
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Cấu hình kết nối database (thay thế bằng URL thực tế của bạn)
DATABASE_URL = os.getenv("DATABASE_URL")

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
