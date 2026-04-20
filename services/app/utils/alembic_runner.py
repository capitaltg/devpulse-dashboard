# migrations.py
import logging
import os

from sqlalchemy import text

from alembic import command
from alembic.config import Config
from app.db import get_database_url, get_db_engine

logger = logging.getLogger(__name__)

ALEMBIC_CFG = os.getenv("ALEMBIC_CFG", "alembic.ini")
ADVISORY_LOCK_ID = int(os.getenv("ADVISORY_LOCK_ID", "1234567890"))


def run_migrations():
    database_url = get_database_url()
    if not database_url:
        logger.error("DATABASE_URL is not set. Skipping migrations.")
        return

    engine = get_db_engine()
    if engine is None:
        logger.error("DATABASE_URL is not set. Skipping migrations.")
        return
    logger.info("Acquiring advisory lock for migrations...")
    with engine.connect() as conn:
        conn.execute(text(f"SELECT pg_advisory_lock({ADVISORY_LOCK_ID})"))
        try:
            alembic_cfg = Config(ALEMBIC_CFG)
            alembic_cfg.set_main_option("sqlalchemy.url", database_url)
            logger.info("Upgrading database schema with Alembic")
            command.upgrade(alembic_cfg, "head")
            logger.info("Migrations applied successfully.")
        except Exception as e:
            logger.error(f"Error running migrations: {e}")
        finally:
            conn.execute(text(f"SELECT pg_advisory_unlock({ADVISORY_LOCK_ID})"))
            logger.info("Released advisory lock for migrations.")
