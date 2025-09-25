FROM python:3.12-slim-bookworm

WORKDIR /app

# Copy uv binaries directly into /bin
COPY --from=docker.io/astral/uv:latest /uv /uvx /bin/

# Copy requirements
COPY ./backend/requirements.txt .

# Install production dependencies using uv (Use china server for faster speed)
RUN uv pip install --system --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

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

# Use this to check the import time (Use for profiling and optimization of imports)
# CMD ["sh", "-c", "alembic upgrade head && \
#   watchfiles --sigint-timeout 0 --sigkill-timeout 0 --filter python \
#   'python -X importtime -m uvicorn src.main:app --host 0.0.0.0 --port 5001 2> /app/importtime.log' /app"]