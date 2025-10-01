FROM python:3.12-slim-bookworm

WORKDIR /app

# Copy uv binaries directly into /bin
COPY --from=docker.io/astral/uv:latest /uv /uvx /bin/

# Install dependencies
COPY backend/requirements.txt .
RUN uv pip install --system --no-cache-dir -r requirements.txt

# Copy application code
COPY backend .

ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 5001

CMD ["sh", "-c", "alembic upgrade head && uvicorn src.main:app --host 0.0.0.0 --port 5001"]
