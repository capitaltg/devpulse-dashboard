# FastAPI services

Minimal FastAPI starter with a small structure for growth.

> **Tip:** the quickest way to run this alongside Postgres is
> `docker compose up -d` from the repo root (see
> [`docs/getting-started.md`](../docs/getting-started.md)). The setup below is
> for running uvicorn directly on your host.

## Setup

```bash
python -m venv .venv
source .venv/Scripts/activate  # Windows (Git Bash)
pip install -r requirements.txt
```

## Run
"""
Python Services Documentation

This module requires two environment variables to be set before running:

1. **ENCRYPTION_KEY**: A secret key used for encrypting sensitive data.
  - Required for all encryption/decryption operations
  - Should be a strong, randomly generated string
  - Example: `export ENCRYPTION_KEY="your-secret-key-here"`

2. **DATABASE_URL**: The connection string for the database.
  - Required to establish database connections
  - Format currently supports only PostgreSQL
  - Example: `export DATABASE_URL="postgresql://user:password@localhost/dbname"`

**Setup Instructions:**

```bash
uvicorn app.main:app --reload
```

## Health endpoint

- GET `http://localhost:8000/health`

## Swagger endpoint

- GET `http://localhost:8000/docs`
