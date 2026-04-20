from app.models.commit_file import CommitFile


def from_api(raw: dict, commit_sha: str) -> CommitFile:
    """Map a single file entry from a GitHub API commit response to a CommitFile model instance."""
    return CommitFile(
        commit_sha=commit_sha,
        filename=raw["filename"],
        previous_filename=raw.get("previous_filename"),
        status=raw.get("status", ""),
        additions=raw.get("additions", 0),
        deletions=raw.get("deletions", 0),
        changes=raw.get("changes", 0),
        sha=raw.get("sha"),
        patch=raw.get("patch"),
    )
