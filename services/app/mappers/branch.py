from datetime import datetime, timezone
from typing import Optional

from app.models.branch import Branch


def from_webhook(
    payload: dict,
    repository: dict,
    workspace_id: int,
    sender: Optional[str],
    sender_id: Optional[int],
) -> Branch:
    """Map a GitHub create (branch) event payload to a Branch model instance."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    return Branch(
        name=payload.get("ref", ""),
        repository_id=repository["id"],
        repository_full_name=repository.get("full_name", ""),
        status="active",
        commit_sha=None,
        created_at=now,
        created_by=sender,
        created_by_email=None,
        created_by_id=sender_id,
        deleted_at=None,
        deleted_by=None,
        deleted_by_email=None,
        deleted_by_id=None,
        updated_at=now,
        processed_at=now,
        workspace_id=workspace_id,
    )


def from_delete_webhook(
    payload: dict,
    repository: dict,
    workspace_id: int,
    sender: Optional[str],
    sender_id: Optional[int],
) -> Branch:
    """Map a GitHub delete (branch) event payload to a Branch model instance."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    return Branch(
        name=payload.get("ref", ""),
        repository_id=repository["id"],
        repository_full_name=repository.get("full_name", ""),
        status="deleted",
        commit_sha=None,
        created_at=None,
        created_by=None,
        created_by_email=None,
        created_by_id=None,
        deleted_at=now,
        deleted_by=sender,
        deleted_by_email=None,
        deleted_by_id=sender_id,
        updated_at=now,
        processed_at=now,
        workspace_id=workspace_id,
    )
