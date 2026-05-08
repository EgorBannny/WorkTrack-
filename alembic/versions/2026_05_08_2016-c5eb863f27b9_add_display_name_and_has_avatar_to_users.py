"""add display_name and has_avatar to users

Revision ID: c5eb863f27b9
Revises: 7bc6db23331f
Create Date: 2026-05-08 20:16:17.209859

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "c5eb863f27b9"
down_revision: Union[str, Sequence[str], None] = "7bc6db23331f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("display_name", sa.String(length=100), nullable=False),
    )
    op.add_column("users", sa.Column("has_avatar", sa.Boolean(), nullable=False))


def downgrade() -> None:
    op.drop_column("users", "has_avatar")
    op.drop_column("users", "display_name")
