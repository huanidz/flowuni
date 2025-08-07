# --- Builder Stage ---
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder

WORKDIR /app

# Copy requirements
COPY ./backend/requirements.txt .

# Install production dependencies using uv
RUN uv pip install --system --no-cache-dir -r requirements.txt


# --- Final Stage ---
FROM python:3.11-slim

WORKDIR /app

# Copy installed dependencies from builder
COPY --from=builder /usr/local /usr/local

# Copy application code
COPY ./backend .

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 5001

# Command: Run alembic migrations + Uvicorn with watchfiles (restarts on crash & file changes)
CMD ["sh", "-c", "alembic upgrade head && watchfiles  --sigint-timeout 1 --sigkill-timeout 1 --filter python 'uvicorn src.main:app --host 0.0.0.0 --port 5001' /app"]