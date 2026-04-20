import os
from functools import lru_cache
from typing import Optional, TypeVar

from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, create_engine

T = TypeVar("T", bound=SQLModel)


def get_database_url() -> Optional[str]:
    return os.getenv("DATABASE_URL")


@lru_cache(maxsize=1)
def get_db_engine() -> Optional[Engine]:
    database_url = get_database_url()
    if not database_url:
        return None
    return create_engine(database_url)


def get_session() -> Session:
    engine = get_db_engine()
    if engine is None:
        raise RuntimeError("DATABASE_URL is not set")
    return Session(engine)


def merge_partial(session: Session, record: T) -> None:
    """Upsert a record without overwriting existing non-null values with null.

    Use instead of session.merge() when incoming data may be sparse (e.g. a
    webhook user object) and the database may already hold richer values.
    """
    pk_cols = [col.key for col in type(record).__table__.primary_key.columns]
    pk = tuple(getattr(record, col) for col in pk_cols)
    pk = pk[0] if len(pk) == 1 else pk
    existing = session.get(type(record), pk)
    if existing is None:
        session.add(record)
    else:
        for field, value in record.model_dump(exclude_none=True).items():
            setattr(existing, field, value)
