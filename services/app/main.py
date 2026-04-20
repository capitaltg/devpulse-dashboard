import logging

from fastapi import FastAPI

from app.routes.auth_github import router as auth_github_router
from app.routes.config import router as config_router
from app.routes.health import router as health_router
from app.routes.organizations import router as organization_router
from app.routes.pull_requests import router as pull_request_router
from app.routes.repositories import router as repository_router
from app.routes.stats import router as stats_router
from app.routes.users import router as user_router
from app.routes.users import workspace_router as user_workspace_router
from app.routes.webhooks import router as webhook_router
from app.routes.workflow_runs import router as workflow_run_router
from app.routes.workspaces import router as workspace_router
from app.utils import run_migrations

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)-5s] %(name)s - %(message)s"
)

logger = logging.getLogger(__name__)

app = FastAPI(title="services", version="0.1.0")

app.include_router(auth_github_router)
app.include_router(config_router)
app.include_router(health_router)
app.include_router(organization_router)
app.include_router(pull_request_router)
app.include_router(repository_router)
app.include_router(stats_router)
app.include_router(user_router)
app.include_router(user_workspace_router)
app.include_router(workspace_router)
app.include_router(webhook_router)
app.include_router(workflow_run_router)


@app.on_event("startup")
def startup_event():
    run_migrations()
