"""
Heuristic-based PR risk scoring.

Produces a 0–100 score (higher = riskier) from metadata already stored on the
PullRequest model.  No AI/LLM calls — that layer will be added later once
Bedrock is wired up.

Factors and max points (total cap = 100):
  Size (LOC)            – up to 35 pts
  Commit count          – up to 20 pts
  Files changed         – up to 15 pts
  Review engagement     – up to 15 pts
  Missing description   – up to 15 pts
"""

from __future__ import annotations

from typing import TypedDict


class RiskFactor(TypedDict):
    factor: str
    score: int
    description: str


class RiskResult(TypedDict):
    risk_score: int
    risk_level: str  # low | medium | high | critical
    risk_factors: list[RiskFactor]


# ── helpers ──────────────────────────────────────────────────────────────────


def _loc_score(additions: int, deletions: int) -> tuple[int, str]:
    loc = additions + deletions
    if loc <= 50:
        return 0, f"{loc} lines changed — small PR"
    if loc <= 200:
        return 10, f"{loc} lines changed — moderate size"
    if loc <= 500:
        return 20, f"{loc} lines changed — large PR"
    if loc <= 1000:
        return 30, f"{loc} lines changed — very large PR"
    return 35, f"{loc} lines changed — extremely large PR"


def _commit_score(commits: int) -> tuple[int, str]:
    if commits <= 3:
        return 0, f"{commits} commits — clean history"
    if commits <= 7:
        return 5, f"{commits} commits — moderate history"
    if commits <= 15:
        return 12, f"{commits} commits — busy history"
    return 20, f"{commits} commits — very noisy history, consider squashing"


def _files_score(changed_files: int) -> tuple[int, str]:
    if changed_files <= 5:
        return 0, f"{changed_files} files changed — focused change"
    if changed_files <= 10:
        return 5, f"{changed_files} files changed — broad change"
    if changed_files <= 20:
        return 10, f"{changed_files} files changed — wide-reaching change"
    return 15, f"{changed_files} files changed — very broad change"


def _review_score(review_comments: int, comments: int) -> tuple[int, str]:
    total = review_comments + comments
    if total >= 5:
        return 0, f"{total} comments — well-reviewed"
    if total >= 2:
        return 5, f"{total} comments — some review"
    if total >= 1:
        return 10, f"{total} comment — minimal review"
    return 15, "No comments — unreviewed"


def _description_score(body: str | None) -> tuple[int, str]:
    if body and len(body.strip()) >= 50:
        return 0, "Has detailed description"
    if body and len(body.strip()) > 0:
        return 8, "Description is brief"
    return 15, "No description provided"


def _level_from_score(score: int) -> str:
    if score <= 20:
        return "low"
    if score <= 45:
        return "medium"
    if score <= 70:
        return "high"
    return "critical"


# ── public API ───────────────────────────────────────────────────────────────


def compute_risk_score(
    additions: int = 0,
    deletions: int = 0,
    commits: int = 0,
    changed_files: int = 0,
    review_comments: int = 0,
    comments: int = 0,
    body: str | None = None,
) -> RiskResult:
    factors: list[RiskFactor] = []

    for factor_name, (pts, desc) in [
        ("Lines of code", _loc_score(additions, deletions)),
        ("Commit count", _commit_score(commits)),
        ("Files changed", _files_score(changed_files)),
        ("Review engagement", _review_score(review_comments, comments)),
        ("Description quality", _description_score(body)),
    ]:
        factors.append({"factor": factor_name, "score": pts, "description": desc})

    total = min(sum(f["score"] for f in factors), 100)

    return {
        "risk_score": total,
        "risk_level": _level_from_score(total),
        "risk_factors": factors,
    }
