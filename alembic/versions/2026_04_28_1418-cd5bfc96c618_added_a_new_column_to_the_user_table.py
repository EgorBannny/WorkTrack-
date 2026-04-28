"""added a new column to the user table

Revision ID: cd5bfc96c618
Revises: 816f900b796b
Create Date: 2026-04-28 14:18:35.468815

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "cd5bfc96c618"
down_revision: Union[str, Sequence[str], None] = "816f900b796b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("token_version", sa.Integer(), nullable=False))


def downgrade() -> None:
    op.drop_column("users", "token_version")
