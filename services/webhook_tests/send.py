"""
Send test GitHub webhook payloads to the local webhook endpoint.

Usage:
    python send.py [options] [file ...]

    If no files are given, every *.json in the payloads/ directory is sent.

Options:
    --url           Base URL of the webhook endpoint
                    (default: http://localhost:8000/webhook)
    --workspace-id  External workspace ID to pass as query param
                    (default: env var WEBHOOK_WORKSPACE_ID)
    --secret        HMAC secret used to sign the payload
                    (default: env var WEBHOOK_SECRET)

Event type detection (in order of priority):
    1. Filename stem first segment:  pull_request.opened.json  ->  pull_request
    2. Body key heuristics (see EVENT_HEURISTICS below)
    3. Falls back to "unknown"

Examples:
    python send.py --workspace-id my-workspace --secret abc123
    python send.py --workspace-id my-workspace --secret abc123 payloads/push.json
"""

import argparse
import hashlib
import hmac
import json
import os
import sys
import uuid
from pathlib import Path

import requests

PAYLOADS_DIR = Path(__file__).parent / "payloads"

# Ordered list of (required_keys, event_name).
# First match wins, so more-specific sets go first.
EVENT_HEURISTICS: list[tuple[set[str], str]] = [
    ({"zen", "hook_id"}, "ping"),
    ({"pull_request", "review"}, "pull_request_review"),
    ({"pull_request", "action"}, "pull_request"),
    ({"issue", "comment"}, "issue_comment"),
    ({"issue", "action"}, "issues"),
    ({"commits", "ref"}, "push"),
    ({"release", "action"}, "release"),
    ({"repository", "action"}, "repository"),
    ({"member", "action"}, "member"),
]


def deduce_event(path: Path, payload: dict) -> str:
    # 1. Filename: e.g. pull_request.opened.json -> "pull_request"
    first_segment = path.stem.split(".")[0]
    if first_segment and first_segment != path.stem:
        # Only trust it when there really was a dot (i.e. there's an action part)
        return first_segment

    # 2. Body heuristics
    keys = set(payload.keys())
    for required, event in EVENT_HEURISTICS:
        if required.issubset(keys):
            return event

    # 3. Single-segment filename as a last resort (e.g. ping.json -> "ping")
    return first_segment or "unknown"


def sign(body: bytes, secret: str) -> str:
    mac = hmac.new(secret.encode("utf-8"), body, hashlib.sha256)
    return f"sha256={mac.hexdigest()}"


def send_file(path: Path, url: str, workspace_id: str, secret: str) -> None:
    body = path.read_bytes()
    try:
        payload = json.loads(body)
    except json.JSONDecodeError as exc:
        print(f"  [SKIP] {path.name}: invalid JSON — {exc}")
        return

    event = deduce_event(path, payload)
    signature = sign(body, secret)
    delivery_id = str(uuid.uuid4())

    headers = {
        "Content-Type": "application/json",
        "X-GitHub-Event": event,
        "X-GitHub-Delivery": delivery_id,
        "X-Hub-Signature-256": signature,
    }

    target = f"{url}?workspace_id={workspace_id}"

    print(f"→ {path.name}")
    print(f"  X-GitHub-Event:      {event}")
    print(f"  X-GitHub-Delivery:   {delivery_id}")
    print(f"  X-Hub-Signature-256: {signature}")
    print(f"  Content-Type:        application/json")

    try:
        resp = requests.post(target, data=body, headers=headers, timeout=10)
        print(f"  status   : {resp.status_code}")
        print(f"  response : {resp.text}")
    except requests.exceptions.ConnectionError:
        print(f"  [ERROR] Could not connect to {target}")
    print()


def main() -> None:
    parser = argparse.ArgumentParser(description="Send test GitHub webhook payloads.")
    parser.add_argument(
        "--url",
        default="http://localhost:8000/webhook",
        help="Webhook endpoint URL (default: http://localhost:8000/webhook)",
    )
    parser.add_argument(
        "--workspace-id",
        default=os.environ.get("WEBHOOK_WORKSPACE_ID"),
        help="External workspace ID (or set WEBHOOK_WORKSPACE_ID env var)",
    )
    parser.add_argument(
        "--secret",
        default=os.environ.get("WEBHOOK_SECRET"),
        help="HMAC secret (or set WEBHOOK_SECRET env var)",
    )
    parser.add_argument(
        "files",
        nargs="*",
        help="Payload JSON files to send (default: all files in payloads/)",
    )
    args = parser.parse_args()

    if not args.workspace_id:
        parser.error("--workspace-id is required (or set WEBHOOK_WORKSPACE_ID)")
    if not args.secret:
        parser.error("--secret is required (or set WEBHOOK_SECRET)")

    if args.files:
        paths: list[Path] = []
        for f in args.files:
            p = Path(f)
            if p.is_dir():
                paths.extend(sorted(p.glob("*.json")))
            else:
                paths.append(p)
    else:
        paths = sorted(PAYLOADS_DIR.glob("*.json"))

    if not paths:
        print(f"No payload files found in {PAYLOADS_DIR}")
        sys.exit(1)

    for path in paths:
        send_file(path, args.url, args.workspace_id, args.secret)


if __name__ == "__main__":
    main()
