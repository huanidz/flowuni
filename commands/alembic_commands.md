# Done once
alembic init alembic

# Create a new revision
alembic revision --autogenerate -m "Change something"

# Upgrade to latest revision / Or apply all pending migrations
alembic upgrade head

# Downgrade to previous revision
alembic downgrade -1

# Show current revision
alembic current

# Show all revisions
alembic history