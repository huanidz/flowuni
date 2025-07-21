# --- Builder Stage ---
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder

WORKDIR /app

# Install uv temporarily and uninstall after dependencies are installed
COPY ./backend/requirements.txt .
RUN uv pip install --system --no-cache-dir -r requirements.txt

# --- Final Stage ---
FROM python:3.11-slim

WORKDIR /app


# Copy only necessary dependencies from builder
COPY --from=builder /usr/local /usr/local

# Copy application code (ensure .dockerignore excludes non-essential files)
COPY ./backend .

ENV PYTHONPATH=/app

EXPOSE 5001

CMD ["sh", "-c", "alembic upgrade head && uvicorn src.main:app --host 0.0.0.0 --port 5001 --reload"]