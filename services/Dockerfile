FROM python:3.13-alpine

LABEL org.opencontainers.image.source=https://github.com/capitaltg/devpulse-dashboard
LABEL org.opencontainers.image.description="DevPulse backend (FastAPI services)"
LABEL org.opencontainers.image.licenses=Apache-2.0

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appgroup app/ ./app/
COPY --chown=appuser:appgroup alembic/ ./alembic/
COPY --chown=appuser:appgroup alembic.ini .

USER appuser

# Run with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
