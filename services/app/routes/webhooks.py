"""
GitHub Webhook routes.
Receives and acknowledges incoming GitHub webhook events.
"""

import asyncio
import hashlib
import hmac
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Callable, Optional

from cachetools import TTLCache, cached
from fastapi import APIRouter, Header, HTTPException, Request
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db import get_session, merge_partial
from app.mappers import branch as branch_mapper
from app.mappers import check_run as check_run_mapper
from app.mappers import check_suite as check_suite_mapper
from app.mappers import commit as commit_mapper
from app.mappers import commit_comment as commit_comment_mapper
from app.mappers import commit_file as commit_file_mapper
from app.mappers import issue as issue_mapper
from app.mappers import issue_comment as issue_comment_mapper
from app.mappers import organization as org_mapper
from app.mappers import pull_request as pr_mapper
from app.mappers import pull_request_review as pr_review_mapper
from app.mappers import pull_request_review_comment as pr_review_comment_mapper
from app.mappers import push as push_mapper
from app.mappers import repository as repo_mapper
from app.mappers import tag as tag_mapper
from app.mappers import team as team_mapper
from app.mappers import team_member as team_member_mapper
from app.mappers import user as user_mapper
from app.mappers import wiki_page as wiki_page_mapper
from app.mappers import workflow_job as workflow_job_mapper
from app.mappers import workflow_run as workflow_run_mapper
from app.models.branch import Branch
from app.models.commit_file import CommitFile
from app.models.push import Push
from app.models.tag import Tag
from app.models.team_member import TeamMember
from app.models.wiki_page import WikiPage
from app.utils.github_utils import get_commit_details
from app.utils.organization import get_organization_token
from app.utils.workspace import get_workspace_id_by_external_id, get_workspace_secrets

router = APIRouter(tags=["webhook"])

logger = logging.getLogger(__name__)

_commit_detail_executor = ThreadPoolExecutor(
    max_workers=4, thread_name_prefix="commit-sync"
)


_token_cache = TTLCache(maxsize=1000, ttl=300)
_org_token_cache = TTLCache(maxsize=1000, ttl=300)


@cached(cache=_org_token_cache)
def get_organization_github_token(workspace_id: int, organization_login: str) -> str:
    return get_organization_token(workspace_id, organization_login)


@cached(cache=_token_cache)
def get_valid_workspace_tokens(workspace_id: int):
    if not workspace_id:
        return []
    return get_workspace_secrets(workspace_id)


def verify_signature(payload_body, secret_tokens, signature_header):
    if not signature_header:
        return False

    # Try each token in the list
    for secret_token in secret_tokens:
        # GitHub signatures always start with 'sha256='
        hash_object = hmac.new(
            secret_token.encode("utf-8"), msg=payload_body, digestmod=hashlib.sha256
        )

        expected_signature = "sha256=" + hash_object.hexdigest()

        # Use constant-time comparison to prevent timing attacks
        if hmac.compare_digest(expected_signature, signature_header):
            return True

    return False


def sync_commit_details(commit_sha, repo_full_name, token):
    """Synchronize commit details to database"""
    logger.info(f"Syncing commit details for {repo_full_name} {commit_sha}")
    commit_data = get_commit_details(
        token=token, sha=commit_sha, repo_full_name=repo_full_name
    )
    if not commit_data:
        return

    commit_record = commit_mapper.from_api(commit_data, repo_full_name)
    file_records = [
        commit_file_mapper.from_api(f, commit_sha) for f in commit_data.get("files", [])
    ]

    with get_session() as session:
        merge_partial(session, commit_record)
        for file_record in file_records:
            values = {k: v for k, v in file_record.model_dump().items() if k != "id"}
            stmt = (
                pg_insert(CommitFile)
                .values(**values)
                .on_conflict_do_update(
                    constraint="unique_commit_filename",
                    set_={
                        k: v
                        for k, v in values.items()
                        if k not in ("commit_sha", "filename")
                    },
                )
            )
            session.execute(stmt)
        session.commit()


def _ci_emoji(status: Optional[str], conclusion: Optional[str]) -> str:
    if status == "completed":
        return {
            "success": "✅",
            "failure": "❌",
            "cancelled": "🚫",
            "skipped": "⏭️",
        }.get(conclusion, "⚠️")
    if status == "in_progress":
        return "🔄"
    if status == "queued":
        return "⏳"
    return "🕒"


def handle_workflow_run(payload: dict) -> str:
    """Handle workflow run events (requested, in_progress, completed)"""
    action = payload.get("action", "unknown")
    workspace_id = payload["workspace_id"]
    sender = payload.get("sender", {}).get("login")

    raw_repo = payload.get("repository", {})
    org_raw = payload.get("organization") or raw_repo.get("owner", {})
    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, action)
    repo_record = repo_mapper.from_webhook(raw_repo, workspace_id, sender, action)
    run_record = workflow_run_mapper.from_webhook(
        payload.get("workflow_run", {}), raw_repo, workspace_id, sender, action
    )

    emoji = _ci_emoji(run_record.status, run_record.conclusion)

    with get_session() as session:
        session.merge(org_record)
        session.merge(repo_record)
        session.merge(run_record)
        session.commit()

    conclusion = f" ({run_record.conclusion})" if run_record.conclusion else ""
    return f"{emoji} Workflow run {action}: {run_record.name!r} #{run_record.run_number}{conclusion} in {repo_record.full_name}"


def handle_workflow_job(payload: dict) -> str:
    """Handle workflow job events (queued, in_progress, completed, waiting)"""
    action = payload.get("action", "unknown")
    workspace_id = payload["workspace_id"]
    sender = payload.get("sender", {}).get("login")

    raw_repo = payload.get("repository", {})
    org_raw = payload.get("organization") or raw_repo.get("owner", {})
    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, action)
    repo_record = repo_mapper.from_webhook(raw_repo, workspace_id, sender, action)
    job_record = workflow_job_mapper.from_webhook(
        payload.get("workflow_job", {}), raw_repo, workspace_id, sender, action
    )

    emoji = _ci_emoji(job_record.status, job_record.conclusion)

    with get_session() as session:
        session.merge(org_record)
        session.merge(repo_record)
        session.merge(job_record)
        session.commit()

    conclusion = f" ({job_record.conclusion})" if job_record.conclusion else ""
    return f"{emoji} Workflow job {action}: {job_record.name!r}{conclusion} (run {job_record.run_id}) in {repo_record.full_name}"


def handle_create(payload: dict) -> str:
    """Handle create events (branch or tag creation)"""
    ref_type = payload.get("ref_type", "")
    workspace_id = payload["workspace_id"]
    raw_sender = payload.get("sender", {})
    sender = raw_sender.get("login")
    sender_id = raw_sender.get("id")

    raw_repo = payload.get("repository", {})
    org_raw = payload.get("organization") or raw_repo.get("owner", {})
    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, "create")
    repo_record = repo_mapper.from_webhook(raw_repo, workspace_id, sender, "create")

    with get_session() as session:
        session.merge(org_record)
        session.merge(repo_record)

        if ref_type == "branch":
            record = branch_mapper.from_webhook(
                payload, raw_repo, workspace_id, sender, sender_id
            )
            values = {k: v for k, v in record.model_dump().items() if k != "id"}
            stmt = (
                pg_insert(Branch)
                .values(**values)
                .on_conflict_do_update(
                    constraint="unique_branch",
                    set_={
                        k: v
                        for k, v in values.items()
                        if k not in ("workspace_id", "repository_id", "name")
                    },
                )
            )
            session.execute(stmt)
        elif ref_type == "tag":
            record = tag_mapper.from_webhook(
                payload, raw_repo, workspace_id, sender, sender_id
            )
            values = {k: v for k, v in record.model_dump().items() if k != "id"}
            stmt = (
                pg_insert(Tag)
                .values(**values)
                .on_conflict_do_update(
                    constraint="unique_tag",
                    set_={
                        k: v
                        for k, v in values.items()
                        if k not in ("workspace_id", "repository_id", "name")
                    },
                )
            )
            session.execute(stmt)

        session.commit()

    ref_name = payload.get("ref", "")
    return (
        f"🌿 {ref_type.capitalize()} created: {ref_name!r} in {repo_record.full_name}"
    )


def handle_delete(payload: dict) -> str:
    """Handle delete events (branch or tag deletion)"""
    ref_type = payload.get("ref_type", "")
    workspace_id = payload["workspace_id"]
    raw_sender = payload.get("sender", {})
    sender = raw_sender.get("login")
    sender_id = raw_sender.get("id")

    raw_repo = payload.get("repository", {})
    org_raw = payload.get("organization") or raw_repo.get("owner", {})
    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, "delete")
    repo_record = repo_mapper.from_webhook(raw_repo, workspace_id, sender, "delete")

    deletion_keys = {
        "status",
        "deleted_at",
        "deleted_by",
        "deleted_by_email",
        "deleted_by_id",
        "updated_at",
        "processed_at",
    }

    with get_session() as session:
        session.merge(org_record)
        session.merge(repo_record)

        if ref_type == "branch":
            record = branch_mapper.from_delete_webhook(
                payload, raw_repo, workspace_id, sender, sender_id
            )
            values = {k: v for k, v in record.model_dump().items() if k != "id"}
            stmt = (
                pg_insert(Branch)
                .values(**values)
                .on_conflict_do_update(
                    constraint="unique_branch",
                    set_={k: v for k, v in values.items() if k in deletion_keys},
                )
            )
            session.execute(stmt)
        elif ref_type == "tag":
            record = tag_mapper.from_delete_webhook(
                payload, raw_repo, workspace_id, sender, sender_id
            )
            values = {k: v for k, v in record.model_dump().items() if k != "id"}
            stmt = (
                pg_insert(Tag)
                .values(**values)
                .on_conflict_do_update(
                    constraint="unique_tag",
                    set_={k: v for k, v in values.items() if k in deletion_keys},
                )
            )
            session.execute(stmt)

        session.commit()

    ref_name = payload.get("ref", "")
    return (
        f"🗑️ {ref_type.capitalize()} deleted: {ref_name!r} in {repo_record.full_name}"
    )


def handle_check_run(payload: dict) -> str:
    """Handle check run events (created, completed, rerequested, requested_action)"""
    action = payload.get("action", "unknown")
    workspace_id = payload["workspace_id"]
    sender = payload.get("sender", {}).get("login")

    raw_repo = payload.get("repository", {})
    org_raw = payload.get("organization") or raw_repo.get("owner", {})
    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, action)
    repo_record = repo_mapper.from_webhook(raw_repo, workspace_id, sender, action)
    check_run_record = check_run_mapper.from_webhook(
        payload.get("check_run", {}), raw_repo, workspace_id, sender, action
    )

    emoji = _ci_emoji(check_run_record.status, check_run_record.conclusion)

    with get_session() as session:
        session.merge(org_record)
        session.merge(repo_record)
        session.merge(check_run_record)
        session.commit()

    conclusion = (
        f" ({check_run_record.conclusion})" if check_run_record.conclusion else ""
    )
    return f"{emoji} Check run {action}: {check_run_record.name!r}{conclusion} on {check_run_record.head_sha[:7]} in {repo_record.full_name}"


def handle_check_suite(payload: dict) -> str:
    """Handle check suite events (completed, requested, rerequested)"""
    action = payload.get("action", "unknown")
    workspace_id = payload["workspace_id"]
    sender = payload.get("sender", {}).get("login")

    raw_repo = payload.get("repository", {})
    org_raw = payload.get("organization") or raw_repo.get("owner", {})
    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, action)
    repo_record = repo_mapper.from_webhook(raw_repo, workspace_id, sender, action)
    suite_record = check_suite_mapper.from_webhook(
        payload.get("check_suite", {}), raw_repo, workspace_id, sender, action
    )

    emoji = _ci_emoji(suite_record.status, suite_record.conclusion)

    with get_session() as session:
        session.merge(org_record)
        session.merge(repo_record)
        session.merge(suite_record)
        session.commit()

    conclusion_str = f" ({suite_record.conclusion})" if suite_record.conclusion else ""
    return f"{emoji} Check suite {action}: {suite_record.app_name!r}{conclusion_str} on {suite_record.head_sha[:7]} in {repo_record.full_name}"


def handle_commit_comment(payload: dict) -> str:
    """Handle commit comment events (created, edited)"""
    action = payload.get("action", "unknown")
    workspace_id = payload["workspace_id"]
    sender = payload.get("sender", {}).get("login")

    raw_repo = payload.get("repository", {})
    org_raw = payload.get("organization") or raw_repo.get("owner", {})
    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, action)
    repo_record = repo_mapper.from_webhook(raw_repo, workspace_id, sender, action)
    comment_record = commit_comment_mapper.from_webhook(
        payload.get("comment", {}), raw_repo, workspace_id, sender, action
    )

    with get_session() as session:
        session.merge(org_record)
        session.merge(repo_record)
        session.merge(comment_record)
        session.commit()

    return f"💬 Commit comment {action}: {comment_record.commit_id[:7]} in {repo_record.full_name}"


def handle_issue_comment(payload: dict) -> str:
    """Handle issue comment events (created, edited, deleted)"""
    action = payload.get("action", "unknown")
    workspace_id = payload["workspace_id"]
    sender = payload.get("sender", {}).get("login")

    raw_repo = payload.get("repository", {})
    org_raw = payload.get("organization") or raw_repo.get("owner", {})
    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, action)
    repo_record = repo_mapper.from_webhook(raw_repo, workspace_id, sender, action)
    comment_record = issue_comment_mapper.from_webhook(
        payload.get("comment", {}),
        payload.get("issue", {}),
        raw_repo,
        workspace_id,
        sender,
        action,
    )

    with get_session() as session:
        session.merge(org_record)
        session.merge(repo_record)
        session.merge(comment_record)
        session.commit()

    return f"💬 Issue comment {action}: #{comment_record.issue_number} in {repo_record.full_name}"


def handle_issues(payload: dict) -> str:
    """Handle issue events (opened, edited, closed, reopened, etc.)"""
    action = payload.get("action", "unknown")
    workspace_id = payload["workspace_id"]
    sender = payload.get("sender", {}).get("login")

    raw_repo = payload.get("repository", {})
    org_raw = payload.get("organization") or raw_repo.get("owner", {})
    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, action)
    repo_record = repo_mapper.from_webhook(raw_repo, workspace_id, sender, action)

    # GitHub doesn't populate `closed_by` in the issue object within webhook payloads —
    # the closer is only available as the top-level `sender`. Inject it before mapping.
    raw_issue = dict(payload.get("issue", {}))
    if action == "closed" and not raw_issue.get("closed_by"):
        raw_issue["closed_by"] = payload.get("sender", {})

    issue_record = issue_mapper.from_webhook(
        raw_issue, raw_repo, workspace_id, sender, action
    )

    with get_session() as session:
        session.merge(org_record)
        session.merge(repo_record)
        session.merge(issue_record)
        session.commit()

    state_emoji = "🔴" if action == "closed" else "🟢"
    return f"{state_emoji} Issue {action}: #{issue_record.number} {issue_record.title!r} in {repo_record.full_name}"


def handle_pull_request_review(payload: dict) -> str:
    """Handle pull request review events (submitted, edited, dismissed)"""
    action = payload.get("action", "unknown")
    workspace_id = payload["workspace_id"]
    sender = payload.get("sender", {}).get("login")

    raw_repo = payload.get("repository", {})
    org_raw = payload.get("organization") or raw_repo.get("owner", {})
    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, action)
    repo_record = repo_mapper.from_webhook(raw_repo, workspace_id, sender, action)
    raw_pr = payload.get("pull_request", {})
    pr_record = pr_mapper.from_webhook(raw_pr, raw_repo, workspace_id, sender, action)
    review_record = pr_review_mapper.from_webhook(
        payload.get("review", {}), raw_pr, raw_repo, workspace_id, sender, action
    )

    with get_session() as session:
        session.merge(org_record)
        session.merge(repo_record)
        session.merge(pr_record)
        session.merge(review_record)
        session.commit()

    state = review_record.state.lower()
    state_emoji = {"approved": "✅", "changes_requested": "🔁", "dismissed": "🚫"}.get(
        state, "💬"
    )
    return f"{state_emoji} PR review {action} ({state}): #{pr_record.number} {pr_record.title!r} by {review_record.reviewer} in {repo_record.full_name}"


def handle_pr_comment(payload: dict) -> str:
    """Handle pull request review comment events (created, edited, deleted)"""
    action = payload.get("action", "unknown")
    workspace_id = payload["workspace_id"]
    sender = payload.get("sender", {}).get("login")

    raw_repo = payload.get("repository", {})
    org_raw = payload.get("organization") or raw_repo.get("owner", {})
    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, action)
    repo_record = repo_mapper.from_webhook(raw_repo, workspace_id, sender, action)
    raw_pr = payload.get("pull_request", {})
    pr_record = pr_mapper.from_webhook(raw_pr, raw_repo, workspace_id, sender, action)
    comment_record = pr_review_comment_mapper.from_webhook(
        payload.get("comment", {}), raw_pr, raw_repo, workspace_id, sender, action
    )

    with get_session() as session:
        session.merge(org_record)
        session.merge(repo_record)
        session.merge(pr_record)
        session.merge(comment_record)
        session.commit()

    return f"💬 PR review comment {action}: #{pr_record.number} {pr_record.title!r} in {repo_record.full_name}"


def handle_pull_request(payload: dict) -> str:
    """Handle pull request events (opened, closed, merged, reopened, synchronize, etc.)"""
    action = payload.get("action", "unknown")
    workspace_id = payload["workspace_id"]
    raw_sender = payload.get("sender", {})
    sender = raw_sender.get("login")

    raw_repo = payload.get("repository", {})
    org_raw = payload.get("organization") or raw_repo.get("owner", {})
    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, action)
    repo_record = repo_mapper.from_webhook(raw_repo, workspace_id, sender, action)
    sender_record = user_mapper.from_webhook(raw_sender, sender, action)
    pr_record = pr_mapper.from_webhook(
        payload.get("pull_request", {}), raw_repo, workspace_id, sender, action
    )

    with get_session() as session:
        session.merge(org_record)
        session.merge(repo_record)
        merge_partial(session, sender_record)
        session.merge(pr_record)
        session.commit()

    if pr_record.merged:
        emoji = "🔀"
    elif pr_record.state == "closed":
        emoji = "🔴"
    elif action == "opened":
        emoji = "🟢"
    else:
        emoji = "🔄"
    return f"{emoji} PR {action}: #{pr_record.number} {pr_record.title!r} in {repo_record.full_name}"


def handle_membership(payload: dict) -> str:
    """Handle membership events (added, removed from team)"""
    action = payload.get("action", "unknown")
    scope = payload.get("scope", "unknown")
    workspace_id = payload["workspace_id"]
    sender = payload.get("sender", {}).get("login")

    # Only process team-scoped membership events
    if scope != "team":
        return f"→ Skipping {scope} membership event (action: {action})"

    raw_member = payload.get("member", {})
    raw_team = payload.get("team", {})
    org_raw = payload.get("organization", {})

    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, action)
    team_record = team_mapper.from_webhook(
        raw_team, org_raw, workspace_id, sender, action
    )
    user_record = user_mapper.from_webhook(raw_member, sender, action)

    if action == "added":
        member_record = team_member_mapper.from_webhook(
            raw_member, raw_team, workspace_id
        )
        with get_session() as session:
            session.merge(org_record)
            session.merge(team_record)
            merge_partial(session, user_record)
            session.merge(member_record)
            session.commit()
        return f"➕ Member added: {user_record.login} to team {team_record.name} ({team_record.slug}) in {org_record.login}"
    elif action == "removed":
        with get_session() as session:
            session.merge(org_record)
            session.merge(team_record)
            merge_partial(session, user_record)
            existing = session.get(
                TeamMember, (workspace_id, raw_team["id"], raw_member["id"])
            )
            if existing:
                session.delete(existing)
            session.commit()
        return f"➖ Member removed: {user_record.login} from team {team_record.name} ({team_record.slug}) in {org_record.login}"
    else:
        return f"→ Unhandled team membership action: {action}"


def handle_team(payload: dict) -> str:
    """Handle team events (created, deleted, edited, added_to_repository, removed_from_repository)"""
    action = payload.get("action", "unknown")
    workspace_id = payload["workspace_id"]
    sender = payload.get("sender", {}).get("login")

    org_raw = payload.get("organization", {})
    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, action)
    team_record = team_mapper.from_webhook(
        payload.get("team", {}), org_raw, workspace_id, sender, action
    )

    with get_session() as session:
        session.merge(org_record)
        session.merge(team_record)
        session.commit()

    emoji_map = {
        "created": "👥",
        "deleted": "🗑️",
        "edited": "✏️",
        "added_to_repository": "➕",
        "removed_from_repository": "➖",
    }
    emoji = emoji_map.get(action, "👥")
    return f"{emoji} Team {action}: {team_record.name} ({team_record.slug}) in {org_record.login}"


def handle_repository(payload: dict) -> str:
    """Handle repository events (created, deleted, archived, renamed, transferred, etc.)"""
    action = payload.get("action", "unknown")
    workspace_id = payload["workspace_id"]
    sender = payload.get("sender", {}).get("login")

    raw_repo = payload.get("repository", {})
    repo_record = repo_mapper.from_webhook(raw_repo, workspace_id, sender, action)
    org_raw = payload.get("organization") or raw_repo.get("owner", {})
    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, action)

    with get_session() as session:
        session.merge(org_record)
        session.merge(repo_record)
        session.commit()

    return f"✅ Repository {action}: {repo_record.full_name}"


def handle_ping(payload: dict) -> str:
    """Handle ping events (webhook creation/testing) for both repository and organization webhooks."""
    hook = payload.get("hook", {})
    hook_type = hook.get("type", "unknown")  # "Repository" or "Organization"
    workspace_id = payload["workspace_id"]
    sender = payload.get("sender", {}).get("login")
    logger.debug(f"Handling ping event for {hook_type} webhook from sender: {sender}")

    repo_record = None

    if hook_type == "Organization":
        # Organization webhook: only upsert the org.
        org_record = org_mapper.from_webhook(
            payload.get("organization", {}), workspace_id, sender, "ping"
        )
    else:
        # Repository webhook: upsert the repo and its owning org.
        # Prefer the top-level `organization` block (full data); fall back to
        # `repository.owner` (minimal) when the payload doesn't include it.
        raw_repo = payload.get("repository", {})
        repo_record = repo_mapper.from_webhook(raw_repo, workspace_id, sender, "ping")
        org_raw = payload.get("organization") or raw_repo.get("owner", {})
        org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, "ping")

    with get_session() as session:
        session.merge(org_record)
        if repo_record is not None:
            session.merge(repo_record)
        session.commit()

    if repo_record is not None:
        return f"📡 Ping (repository webhook): {repo_record.full_name}"
    return f"📡 Ping (organization webhook): {org_record.login}"


def handle_push(payload: dict) -> str:
    """Handle push events (commits pushed to a branch)"""
    workspace_id = payload["workspace_id"]
    raw_sender = payload.get("sender", {})
    sender = raw_sender.get("login")
    sender_id = raw_sender.get("id")

    raw_repo = payload.get("repository", {})
    org_raw = payload.get("organization") or raw_repo.get("owner", {})
    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, "push")
    repo_record = repo_mapper.from_webhook(raw_repo, workspace_id, sender, "push")
    push_record = push_mapper.from_webhook(payload, workspace_id, sender, sender_id)

    commit_records = [
        commit_mapper.from_push(c, raw_repo) for c in payload.get("commits", [])
    ]

    with get_session() as session:
        session.merge(org_record)
        session.merge(repo_record)
        values = {k: v for k, v in push_record.model_dump().items() if k != "id"}
        stmt = (
            pg_insert(Push)
            .values(**values)
            .on_conflict_do_nothing(constraint="unique_workspace_push")
        )
        session.execute(stmt)
        commit_shas = [c.sha for c in commit_records]
        for commit_record in commit_records:
            merge_partial(session, commit_record)
        session.commit()

    flags = []
    if push_record.forced:
        flags.append("forced")
    if push_record.created:
        flags.append("created")
    if push_record.deleted:
        flags.append("deleted")
    flag_str = f" [{', '.join(flags)}]" if flags else ""
    commit_summary = f"{push_record.commit_count} commit(s)"

    if commit_records:
        github_token = get_organization_github_token(workspace_id, org_raw.get("login"))
        if github_token:
            for sha in commit_shas:
                _commit_detail_executor.submit(
                    sync_commit_details, sha, repo_record.full_name, github_token
                )
        else:
            logger.warning(
                f"No GitHub token available for organization {org_raw.get('login')} in workspace {workspace_id}, skipping commit details sync"
            )

    return f"✅ Push to {push_record.branch_name}: {commit_summary}{flag_str} ({repo_record.full_name})"


def handle_gollum(payload: dict) -> str:
    """Handle gollum (wiki) events"""
    workspace_id = payload["workspace_id"]
    raw_sender = payload.get("sender", {})
    sender = raw_sender.get("login")
    sender_id = raw_sender.get("id")

    raw_repo = payload.get("repository", {})
    org_raw = payload.get("organization") or raw_repo.get("owner", {})
    org_record = org_mapper.from_webhook(org_raw, workspace_id, sender, "gollum")
    repo_record = repo_mapper.from_webhook(raw_repo, workspace_id, sender, "gollum")
    page_records = [
        wiki_page_mapper.from_webhook(page, raw_repo, workspace_id, sender, sender_id)
        for page in payload.get("pages", [])
    ]

    with get_session() as session:
        session.merge(org_record)
        session.merge(repo_record)
        for page_record in page_records:
            values = {k: v for k, v in page_record.model_dump().items() if k != "id"}
            stmt = (
                pg_insert(WikiPage)
                .values(**values)
                .on_conflict_do_nothing(
                    constraint="wiki_pages_workspace_repo_page_sha_key"
                )
            )
            session.execute(stmt)
        session.commit()

    pages_summary = ", ".join(f"{p.action}: {p.page_name}" for p in page_records)
    return f"📖 Wiki updated in {repo_record.full_name}: {pages_summary}"


def handle_other(event_type, payload):
    # TODO: Add handlers for other event types
    pass


WEBHOOK_EVENT_HANDLERS: dict[str, Callable[[dict], str]] = {
    "ping": handle_ping,
    "check_run": handle_check_run,
    "check_suite": handle_check_suite,
    "commit_comment": handle_commit_comment,
    "issue_comment": handle_issue_comment,
    "issues": handle_issues,
    "repository": handle_repository,
    "membership": handle_membership,
    "team": handle_team,
    "pull_request": handle_pull_request,
    "pull_request_review": handle_pull_request_review,
    "pull_request_review_comment": handle_pr_comment,
    "push": handle_push,
    "create": handle_create,
    "delete": handle_delete,
    "gollum": handle_gollum,
    "workflow_run": handle_workflow_run,
    "workflow_job": handle_workflow_job,
}


@router.post("/webhook")
async def github_webhook(
    request: Request,
    x_github_event: Optional[str] = Header(None),
    x_github_delivery: Optional[str] = Header(None),
    x_hub_signature_256: str = Header(None),
    workspace_id: Optional[str] = None,
):
    """Receive a GitHub webhook event."""
    payload = await request.json()
    logger.debug(f"Received GitHub webhook event: '{x_github_event}'")

    if workspace_id is None:
        raise HTTPException(status_code=401, detail="Missing workspace ID")
    # Convert external workspace_id (string) to internal workspace_id (int) using cache
    internal_workspace_id = get_workspace_id_by_external_id(workspace_id)
    logger.debug(
        f"Internal workspace ID: {internal_workspace_id} for external ID: {workspace_id}"
    )
    if not internal_workspace_id:
        raise HTTPException(status_code=401, detail="Workspace not found")

    valid_tokens = get_valid_workspace_tokens(internal_workspace_id)
    if valid_tokens is None or len(valid_tokens) == 0:
        raise HTTPException(status_code=401, detail="No valid tokens for workspace")

    result = verify_signature(await request.body(), valid_tokens, x_hub_signature_256)
    logger.debug(f"Signature {x_hub_signature_256} verification result: {result}")
    if not result:
        raise HTTPException(status_code=401, detail="Invalid workspace secret")

    event_type = x_github_event
    delivery_id = x_github_delivery
    payload["workspace_id"] = internal_workspace_id

    # Events to ignore (log without full JSON payload)
    # TODO: consider handling these events in the future
    ignored_events = {
        "label",
        "page_build",
        "dependabot_alert",
        "deployment",
        "deployment_status",
        "personal_access_token_request",
        "projects_v2_item",
        "release",
        "repository_vulnerability_alert",
        "star",
        "watch",
    }

    is_handled = event_type in WEBHOOK_EVENT_HANDLERS
    is_ignored = event_type in ignored_events

    # For create/delete, only handle branch and tag ref types
    if event_type in ("create", "delete"):
        is_handled = payload.get("ref_type") in ("branch", "tag")

    if is_ignored:
        logger.info(f"[{delivery_id}] Ignored {event_type} event")
    elif not is_handled:
        json_output = json.dumps(payload, indent=2)
        logger.info(f"[{delivery_id}] Unhandled {event_type} event:\n{json_output}")
    else:
        log_msg = None
        try:
            handler = WEBHOOK_EVENT_HANDLERS.get(event_type)
            if handler:
                log_msg = await asyncio.to_thread(handler, payload)
            else:
                await asyncio.to_thread(handle_other, event_type, payload)
                log_msg = f"→ OTHER: {event_type}"
        except Exception as e:
            logger.error(f"[{delivery_id}] Error processing {event_type}: {e}")
            raise

        if log_msg:
            logger.info(f"[{delivery_id}] {log_msg}")

    return {"received": True, "event": x_github_event}
