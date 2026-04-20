from pydantic import BaseModel

from .branch import Branch
from .check_run import CheckRun
from .check_suite import CheckSuite
from .commit import Commit
from .commit_comment import CommitComment
from .commit_file import CommitFile
from .external_user import User
from .issue import Issue
from .issue_comment import IssueComment
from .organization import Organization, OrganizationMember
from .pull_request import PullRequest
from .pull_request_review import PullRequestReview
from .pull_request_review_comment import PullRequestReviewComment
from .push import Push
from .repository import Repository
from .tag import Tag
from .team import Team
from .team_member import TeamMember
from .user import InternalUser
from .wiki_page import WikiPage
from .workflow_job import WorkflowJob
from .workflow_run import WorkflowRun
from .workspace import Workspace, WorkspaceMember, WorkspaceToken


class HealthResponse(BaseModel):
    status: str


__all__ = [
    "HealthResponse",
    "Branch",
    "CheckRun",
    "CheckSuite",
    "Commit",
    "CommitComment",
    "CommitFile",
    "User",
    "InternalUser",
    "Workspace",
    "WorkspaceMember",
    "WorkspaceToken",
    "Organization",
    "OrganizationMember",
    "Issue",
    "IssueComment",
    "PullRequest",
    "PullRequestReview",
    "PullRequestReviewComment",
    "Push",
    "Repository",
    "Team",
    "TeamMember",
    "Tag",
    "WorkflowJob",
    "WorkflowRun",
    "WikiPage",
]
