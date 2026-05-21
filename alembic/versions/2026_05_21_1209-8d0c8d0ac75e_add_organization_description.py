"""add organization description

Revision ID: 8d0c8d0ac75e
Revises: 74a5d00fcb3d
Create Date: 2026-05-21 12:09:15.339837

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import fastapi_users_db_sqlalchemy

# revision identifiers, used by Alembic.
revision: str = "8d0c8d0ac75e"
down_revision: Union[str, Sequence[str], None] = "74a5d00fcb3d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "organizations",
        sa.Column("description", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("organizations", "description")
