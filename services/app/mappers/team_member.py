from datetime import datetime, timezone

from app.models.team_member import TeamMember


def from_webhook(member: dict, team: dict, workspace_id: int) -> TeamMember:
    """Map a GitHub membership payload to a TeamMember model instance."""
    return TeamMember(
        workspace_id=workspace_id,
        team_id=team["id"],
        user_id=member["id"],
        role="member",
        synced_at=datetime.now(timezone.utc),
    )
