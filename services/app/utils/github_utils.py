import logging
import os

import requests

GITHUB_URL = os.environ.get("GITHUB_URL") or "https://api.github.com"


def github_api_request(
    method, endpoint, params=None, data=None, headers=None, token=None
):
    url = GITHUB_URL.rstrip("/") + endpoint
    logging.debug("Making GitHub API request: %s %s | params: %s", method, url, params)
    default_headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        default_headers["Authorization"] = f"Bearer {token}"
    if headers:
        default_headers.update(headers)
    logging.info("GitHub API request: %s %s", method, url)
    response = requests.request(
        method=method, url=url, params=params, json=data, headers=default_headers
    )
    response.raise_for_status()
    if response.content:
        return response.json()
    return None


def get_commit_details(token, repo_full_name, sha):
    """
    Get detailed information for a specific commit including file changes.

    Args:
      owner: Repository owner (user or organization)
      repo: Repository name
      sha: Commit SHA

    Returns:
      dict: Commit details including file changes
    """
    endpoint = f"/repos/{repo_full_name}/commits/{sha}"
    commit_data = github_api_request("GET", endpoint, token=token)
    return commit_data


def fetch_github_user(login: str) -> dict | None:
    """
    Fetch a GitHub user's public profile by login without authentication.
    Subject to GitHub's unauthenticated rate limit (60 requests/hour).

    Returns the user dict on success, or None if the user doesn't exist or
    the request fails.
    """
    try:
        return github_api_request("GET", f"/users/{login}")
    except requests.HTTPError as exc:
        if exc.response is not None and exc.response.status_code == 404:
            return None
        logging.warning("GitHub API error fetching user '%s': %s", login, exc)
        return None
    except requests.RequestException as exc:
        logging.warning("GitHub API request failed fetching user '%s': %s", login, exc)
        return None
