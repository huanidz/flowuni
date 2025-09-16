"""10 update chathistory to user_defined_session_id

Revision ID: fcf6be1f04d6
Revises: ced759984ca2
Create Date: 2025-09-16 09:00:40.347416

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "fcf6be1f04d6"
down_revision: Union[str, None] = "ced759984ca2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Drop the existing foreign key constraint first
    op.drop_constraint(
        "sessions_chat_histories_session_id_fkey",
        "sessions_chat_histories",
        type_="foreignkey",
    )

    # Step 2: Add unique constraint to user_defined_session_id (required for foreign key)
    op.create_unique_constraint(
        "uq_sessions_user_defined_session_id", "sessions", ["user_defined_session_id"]
    )

    # Step 3: Now alter the column type
    op.alter_column(
        "sessions_chat_histories",
        "session_id",
        existing_type=sa.BIGINT(),
        type_=sa.String(),
        existing_nullable=False,
    )

    # Step 4: Create the new foreign key constraint pointing to user_defined_session_id
    op.create_foreign_key(
        "sessions_chat_histories_session_id_fkey",  # Give it the same name for consistency
        "sessions_chat_histories",
        "sessions",
        ["session_id"],
        ["user_defined_session_id"],
    )


def downgrade() -> None:
    # Step 1: Drop the foreign key constraint
    op.drop_constraint(
        "sessions_chat_histories_session_id_fkey",
        "sessions_chat_histories",
        type_="foreignkey",
    )

    # Step 2: Change the column type back to BIGINT
    op.alter_column(
        "sessions_chat_histories",
        "session_id",
        existing_type=sa.String(),
        type_=sa.BIGINT(),
        existing_nullable=False,
    )

    # Step 3: Drop the unique constraint we added
    op.drop_constraint(
        "uq_sessions_user_defined_session_id", "sessions", type_="unique"
    )

    # Step 4: Recreate the original foreign key constraint
    op.create_foreign_key(
        "sessions_chat_histories_session_id_fkey",
        "sessions_chat_histories",
        "sessions",
        ["session_id"],
        ["id"],
    )
