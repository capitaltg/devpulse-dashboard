"""create initial tables

Revision ID: 001
Revises:
Create Date: 2026-02-19

"""

from typing import Sequence, Union
import logging

from alembic import op
import sqlalchemy as sa
from pathlib import Path

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    sql = (Path(__file__).parent / "sql" / "001_create_initial_tables.sql").read_text()
    op.execute(sql)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP TABLE IF EXISTS public.commit_comments CASCADE")
