"""add missing workspace_id indexes

Revision ID: 002
Revises: 001
Create Date: 2026-03-30

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, Sequence[str], None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Tables that were missing a workspace_id index
TABLES = [
    "commit_comments",
    "issue_comments",
    "issues",
    "pull_request_review_comments",
    "pull_request_reviews",
    "pull_requests",
    "pushes",
    "repositories",
]


def upgrade() -> None:
    for table in TABLES:
        op.create_index(
            f"idx_{table}_workspace_id",
            table,
            ["workspace_id"],
            if_not_exists=True,
        )


def downgrade() -> None:
    for table in TABLES:
        op.drop_index(f"idx_{table}_workspace_id", table_name=table)
