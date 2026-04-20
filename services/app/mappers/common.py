from datetime import datetime, timezone
from typing import Optional, Union


def parse_dt(value: Optional[Union[str, int]]) -> Optional[datetime]:
    """Parse a GitHub timestamp into a naive UTC datetime.

    GitHub payloads use ISO 8601 strings in most events but Unix timestamps
    (integers) in push event repository objects.
    """
    if not value:
        return None
    if isinstance(value, int):
        return datetime.fromtimestamp(value, tz=timezone.utc).replace(tzinfo=None)
    return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
