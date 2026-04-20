# Getting Started

This guide walks you through getting DevPulse up and running and connecting your
first GitHub organization. If you're just trying the hosted version, skip to
[First-time setup](#first-time-setup).

## What you'll end up with

- A **workspace** that groups the GitHub orgs you want to track.
- A **GitHub webhook** that streams activity into the dashboard. This is how
  DevPulse ingests data — orgs, repos, PRs, commits, and reviews all flow in
  from webhook events.
- (Optional) A **personal access token** attached to each org, which unlocks
  richer data that webhooks alone don't provide (e.g. commit file diffs).

## Architecture

Two containers plus a database:

```
                        ┌─────────────┐
  Browser ──────────────▶│   Ingress   │
                        └──┬─────┬────┘
                           │     │
                 (/, SPA)  │     │ (/v1/*, /auth/*, /webhook, /health)
                           ▼     ▼
                   ┌──────────┐ ┌──────────────┐
                   │ frontend │ │   backend    │
                   │  nginx   │ │   FastAPI    │
                   └──────────┘ └──────┬───────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │   Postgres   │
                                │  (you bring) │
                                └──────────────┘

  GitHub ───webhooks──▶ Ingress ─▶ backend ─▶ Postgres
```

- **frontend** — static React app served by nginx. Fetches `/v1/config`
  from the backend at startup to learn the auth provider and settings.
  Stateless.
- **backend** — FastAPI. Handles the OAuth/OIDC flow, validates session
  tokens, ingests GitHub webhooks, and serves the REST API. Stateless
  except for the database connection.
- **Postgres** — holds workspaces, orgs, repos, PRs, commits, reviews,
  webhook security tokens (Fernet-encrypted), and OIDC-mode user records.
  Not bundled by the chart — bring your own (RDS, Cloud SQL, CloudNativePG,
  or the dev-only snippet below for eval).

Sign-in and webhook ingestion both go through the Ingress under the **same
hostname** as the frontend, which keeps cookies same-origin (required for
the GitHub OAuth CSRF state cookie).

## Prerequisites

- A GitHub account with admin rights on the organization or repository you want
  to monitor (webhooks can be configured at either level).
- (Optional) A GitHub personal access token — classic or fine-grained — with
  `read:org` scope, if you want the optional per-org enrichment.

## Running DevPulse

DevPulse has two services:

- **frontend** — Vite + React app. See [`frontend/README.md`](../frontend/README.md).
- **services** — FastAPI backend + Postgres migrations. See
  [`services/README.md`](../services/README.md) for the required environment
  variables (`DATABASE_URL`, `ENCRYPTION_KEY`).

### Configure authentication

DevPulse supports two authentication backends. Pick one with `AUTH_PROVIDER`.

- `AUTH_PROVIDER=github` — sign in with a GitHub account via a standard OAuth
  App. Fastest to stand up.
- `AUTH_PROVIDER=oidc` — any OIDC-compliant IdP (Keycloak, Auth0, Authentik,
  Okta, etc.). Use this for SSO / enterprise setups.

The frontend fetches which provider is active and its settings from the
backend at startup (`GET /v1/config`), so you configure everything in one
place — the backend — via env vars. When any of these change, restart the
backend and refresh the browser; the frontend doesn't need a rebuild.

If the required vars for the active provider aren't set, `GET /v1/config`
returns 503 and the frontend shows a config-error page.

#### Quick start: GitHub OAuth

1. Create a GitHub OAuth App: **GitHub → Settings → Developer settings →
   OAuth Apps → New OAuth App**. (This is *not* a GitHub App — different
   thing.)
   - **Homepage URL:** `http://localhost:3000` (or your frontend URL)
   - **Authorization callback URL:**
     `http://localhost:3000/auth/github/callback` — **use the frontend
     origin**, not the backend. The frontend proxies `/auth/*` to the
     backend, which keeps the CSRF state cookie same-origin. In production,
     whatever hostname the browser sees is the one that goes here.
2. Copy the **Client ID** and generate a **Client secret**.
3. Generate a session-signing secret:
   `python -c "import secrets; print(secrets.token_urlsafe(48))"`
4. Set these in `.env`:

   ```
   AUTH_PROVIDER=github
   GITHUB_OAUTH_CLIENT_ID=<from step 2>
   GITHUB_OAUTH_CLIENT_SECRET=<from step 2>
   AUTH_JWT_SECRET=<from step 3>
   ```

After sign-in, the backend creates/updates an `InternalUser` keyed to the
primary verified email on your GitHub account and issues a 7-day HS256 session
JWT. `AUTH_JWT_SECRET` signs that JWT — rotating it invalidates every active
session.

**Scopes used:** `read:user user:email`. DevPulse does **not** use this token
to access your repos — org access is separate, per-workspace, via the webhook
secret (and optionally a PAT) you set up after signing in.

#### Enterprise: OIDC

| Variable         | Required? | Example                                        |
| ---------------- | --------- | ---------------------------------------------- |
| `OIDC_ISSUER`    | yes       | `https://your-idp.example.com/realms/devpulse` |
| `OIDC_CLIENT_ID` | yes       | `abcd-1234-...`                                |
| `OIDC_SCOPE`     | no        | `openid email profile` (default)               |

Register DevPulse as a client in your IdP with redirect URI
`<frontend-url>/callback`. The frontend validates tokens against the IdP's
JWKS directly — no session JWT is issued by DevPulse in this mode.

### Using GitHub Enterprise

DevPulse talks to GitHub's REST API only for optional PAT-based enrichment
(e.g. commit file diffs); the main ingestion path is inbound webhooks, which
work identically on GitHub.com, GitHub Enterprise Cloud, and GitHub Enterprise
Server (GHES).

- **GitHub.com / Enterprise Cloud** — no extra config. The default API
  endpoint `https://api.github.com` is used for both. For Enterprise Cloud
  orgs with SAML SSO, any PAT you attach must be SSO-authorized for the org.
- **GitHub Enterprise Server** — set `GITHUB_URL` on the backend to your
  instance's REST API root, then restart the backend.

| Variable     | Required?             | Example                              |
| ------------ | --------------------- | ------------------------------------ |
| `GITHUB_URL` | only for GHES         | `https://ghe.example.com/api/v3`     |

Webhooks on GHES are configured the same way as on GitHub.com — point the
**Payload URL** at your DevPulse backend (see step 2 below). PATs are created
under your GHES user's **Settings → Developer settings** with the same
`read:org` scope.

Caveats:

- DevPulse must be able to reach `GITHUB_URL` over the network (firewall /
  VPN) for PAT enrichment. If it can't, webhook ingestion still works — you
  just lose the extra detail.
- A couple of frontend fallback links (e.g. a repo without `html_url` in the
  payload) hard-code `https://github.com/...`. In practice webhook events
  include the correct GHES `html_url`, so these fallbacks are rarely hit.

### Local dev with Docker Compose

The repo ships a `docker-compose.yml` that runs the whole stack — Postgres,
backend, and the Vite dev server — with source mounted from your host so edits
hot-reload in place.

```bash
cp .env.example .env        # then edit .env: fill in AUTH_PROVIDER + the
                            # provider-specific vars (see "Configure
                            # authentication" above), and tweak
                            # POSTGRES_PORT / API_PORT / FRONTEND_PORT
                            # if taken
docker compose up           # Ctrl+C to stop; add -d to detach
```

- Frontend on `http://localhost:${FRONTEND_PORT:-3000}` with Vite HMR.
- Backend on `http://localhost:${API_PORT:-8000}`; migrations run on startup.
- `services/app/` is bind-mounted with uvicorn `--reload` for live Python
  reloads.
- `frontend/` is bind-mounted and Vite watches it for HMR.

If you'd rather run the frontend directly on your host (faster startup, native
tooling), bring up only the backend pieces and run Vite yourself:

```bash
docker compose up -d postgres services
cd frontend && npm ci && npm run dev
```

### Deploying

Published container images on GHCR:

- `ghcr.io/capitaltg/devpulse-dashboard-frontend`
- `ghcr.io/capitaltg/devpulse-dashboard-backend`

Both are Apache-2.0 licensed and tagged from the
[capitaltg/devpulse-dashboard](https://github.com/capitaltg/devpulse-dashboard)
repo. You can also build them yourself from the `Dockerfile` in each
directory.

#### Deploy to Kubernetes with the Helm chart

The chart is published to GHCR as an OCI artifact, right alongside the
container images. Install directly — no `helm repo add`, no clone.

```bash
helm install devpulse oci://ghcr.io/capitaltg/charts/devpulse \
  --version 0.1.0 \
  --namespace devpulse --create-namespace \
  -f values.yaml
```

The chart is intentionally **stateless — you bring your own Postgres.** This
avoids shipping a database with the chart that would pretend to be durable
but isn't. Use RDS, Cloud SQL, CloudNativePG, or the dev-only snippet at the
bottom of this section if you just want something running.

It also includes an optional Ingress that routes `/v1/*` and `/auth/*` to the
backend and `/` to the frontend on a single hostname — which keeps cookies
same-origin and GitHub OAuth happy.

Minimum `values.yaml` for a first deploy using OIDC:

```yaml
auth:
  provider: oidc
  oidc:
    issuer: https://your-idp.example.com/realms/devpulse
    clientId: your-client-id

secret:
  values:
    encryptionKey: "<generate: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'>"

database:
  url: postgresql://user:pass@your-postgres.internal:5432/devpulse

ingress:
  enabled: true
  className: nginx
  host: devpulse.example.com
  tls:
    enabled: true
    secretName: devpulse-tls   # omit when cert-manager manages the cert
```

For GitHub mode, swap the `auth` and `secret` blocks:

```yaml
auth:
  provider: github
  github:
    clientId: <OAuth App client id>

secret:
  values:
    encryptionKey: "<fernet key>"
    authJwtSecret: "<python -c 'import secrets; print(secrets.token_urlsafe(48))'>"
    githubClientSecret: <OAuth App client secret>
```

Common value overrides:

| Value                     | Purpose                                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `image.tag`               | Pin a specific build (`sha-<git-sha>`) instead of `latest`                                |
| `database.url`            | `postgresql://user:pass@host:5432/db`, required                                           |
| `secret.existingSecret`   | Name of a pre-created Secret with `DATABASE_URL`, `ENCRYPTION_KEY`, etc. — skip `secret.values` |
| `backend.replicaCount`    | Defaults to 1 — scale up once you're on a Postgres that can handle it                     |
| `auth.frontendBaseUrl`    | Explicit override; derived from `ingress.host` when left empty                            |

When changing auth settings, restart the backend (`kubectl rollout restart deployment/devpulse-backend`) and refresh the browser — no frontend rebuild needed.

##### External secrets (keep secrets out of `values.yaml`)

For real deployments you don't want `encryptionKey`, `authJwtSecret`,
`githubClientSecret`, or `database.url` committed to a repo. The chart
supports two patterns.

**1. `secret.existingSecret` — point the chart at a pre-created Secret.**
You (or a controller) create a Kubernetes Secret out of band; the chart
references it by name and wires it into the backend via `envFrom`.

```yaml
# values.yaml
secret:
  existingSecret: devpulse-secrets
# secret.values is ignored when existingSecret is set
```

The Secret must contain, as string data:

| Key | Required when |
| --- | --- |
| `ENCRYPTION_KEY` | always |
| `DATABASE_URL` | always |
| `AUTH_JWT_SECRET` | `auth.provider=github` |
| `GITHUB_OAUTH_CLIENT_SECRET` | `auth.provider=github` |

**2. Pull secrets from AWS SSM via External Secrets Operator (ESO).** This
is the common production pattern on EKS. [Install
ESO](https://external-secrets.io/latest/introduction/getting-started/) once
per cluster, then add this alongside your values:

```yaml
# eso-devpulse.yaml — apply before `helm install`
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-ssm
  namespace: devpulse
spec:
  provider:
    aws:
      service: ParameterStore
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: devpulse     # chart's ServiceAccount, annotated for IRSA
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: devpulse-secrets
  namespace: devpulse
spec:
  refreshInterval: 5m
  secretStoreRef:
    name: aws-ssm
    kind: SecretStore
  target:
    name: devpulse-secrets      # matches secret.existingSecret in values.yaml
  data:
    - secretKey: ENCRYPTION_KEY
      remoteRef: { key: /devpulse/prod/encryption-key }
    - secretKey: AUTH_JWT_SECRET
      remoteRef: { key: /devpulse/prod/auth-jwt-secret }
    - secretKey: GITHUB_OAUTH_CLIENT_SECRET
      remoteRef: { key: /devpulse/prod/github-oauth-client-secret }
    - secretKey: DATABASE_URL
      remoteRef: { key: /devpulse/prod/database-url }
```

ESO polls SSM every 5 minutes and keeps the k8s Secret in sync. Rotate a
parameter in SSM, wait for the sync, restart the backend, done. ESO also
supports AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager, Azure
Key Vault, and a dozen other backends with the same `SecretStore` /
`ExternalSecret` pattern — just swap the `provider:` block.

To annotate the ServiceAccount for IRSA so ESO can read SSM:

```yaml
# values.yaml
serviceAccount:
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::<account-id>:role/devpulse-eso
```

The IAM role needs `ssm:GetParameter` (and `ssm:GetParametersByPath`) on the
`/devpulse/prod/*` prefix.

**3. Helmfile with inline SSM refs (no ESO needed).** If you're already on
helmfile and would rather not add ESO, helmfile has native support for
`ref+awsssm://`:

```yaml
# helmfile.yaml
releases:
  - name: devpulse
    namespace: devpulse
    chart: oci://ghcr.io/capitaltg/charts/devpulse
    version: 0.1.0
    values:
      - secret:
          values:
            encryptionKey: ref+awsssm:///devpulse/prod/encryption-key
            authJwtSecret: ref+awsssm:///devpulse/prod/auth-jwt-secret
            githubClientSecret: ref+awsssm:///devpulse/prod/github-oauth-client-secret
        database:
          url: ref+awsssm:///devpulse/prod/database-url
```

Helmfile resolves those refs at apply time using whatever AWS credentials
are in your shell; the chart still creates a Secret from them, but your
`helmfile.yaml` has no secret material in it. Rotation requires a re-sync
(manual `helmfile apply`), not the 5-minute ESO poll — trade-off is
simpler infra.

##### Need a throwaway Postgres for eval?

If you just want to kick the tires and don't want to provision an RDS or
similar, paste this into a file and apply it *before* the Helm install.
**This is ephemeral — pod restart loses your data. Do not use in
production.**

```yaml
# dev-postgres.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: devpulse
---
apiVersion: v1
kind: Secret
metadata:
  name: dev-postgres
  namespace: devpulse
type: Opaque
stringData:
  POSTGRES_PASSWORD: devpulse
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dev-postgres
  namespace: devpulse
spec:
  replicas: 1
  selector: { matchLabels: { app: dev-postgres } }
  template:
    metadata: { labels: { app: dev-postgres } }
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          env:
            - name: POSTGRES_USER
              value: devpulse
            - name: POSTGRES_DB
              value: devpulse
            - name: POSTGRES_PASSWORD
              valueFrom: { secretKeyRef: { name: dev-postgres, key: POSTGRES_PASSWORD } }
          ports:
            - containerPort: 5432
          readinessProbe:
            exec: { command: ["pg_isready", "-U", "devpulse"] }
---
apiVersion: v1
kind: Service
metadata:
  name: dev-postgres
  namespace: devpulse
spec:
  selector: { app: dev-postgres }
  ports:
    - port: 5432
```

```bash
kubectl apply -f dev-postgres.yaml
```

Then set in your values:

```yaml
database:
  url: postgresql://devpulse:devpulse@dev-postgres.devpulse.svc.cluster.local:5432/devpulse
```

**Using helmfile** — it understands OCI charts natively, no `repositories:`
entry required:

```yaml
releases:
  - name: devpulse
    namespace: devpulse
    createNamespace: true
    chart: oci://ghcr.io/capitaltg/charts/devpulse
    version: 0.1.0
    values:
      - values/devpulse.yaml
```

**Installing from a local clone** (when hacking on the chart itself):

```bash
git clone https://github.com/capitaltg/devpulse-dashboard.git
cd devpulse-dashboard
helm install devpulse ./charts/devpulse -f values.yaml \
  --namespace devpulse --create-namespace
```

#### Other orchestrators

If you'd rather not use Helm, pull the two images above and point them at a
Postgres. The only routing requirement is that the frontend's `/v1/*` and
`/auth/*` requests reach the backend under the *same hostname* as the
frontend itself (for the OAuth CSRF state cookie to survive the round-trip).

## First-time setup

Once the app is running and you've signed in, you'll land on the **Workspaces**
page with nothing in it. Here's the setup path.

### 1. Create a workspace

Click **New Workspace** and give it a name (for example, your company name).
A workspace is the top-level container for orgs, members, and webhook tokens.

### 2. Add a GitHub webhook

Webhook events are DevPulse's primary ingestion path. Once GitHub starts sending
events, orgs, repos, and activity will appear in the dashboard automatically.

1. In **Workspace Settings → Security Tokens**, click **New Token**. Copy it —
   this is the webhook secret, and you won't see it again.
2. In GitHub, open **Settings → Webhooks → Add webhook** on either:
   - an **organization** (recommended — covers every repo in the org), or
   - an individual **repository**.

   Configure:
   - **Payload URL:** `https://<your-backend>/webhook?workspace_id=<workspace-id>`
   - **Content type:** `application/json`
   - **Secret:** the token you copied in step 1.
   - **SSL verification:** enabled.
   - **Events:** *Send me everything* (DevPulse filters to what it cares about).
3. Save. GitHub will send a ping event; subsequent events stream into the
   dashboard live.

Your workspace ID is shown on **Workspace Settings** under "Workspace ID".

### 3. (Optional) Attach a personal access token

A PAT isn't required — webhooks alone cover most of what the dashboard shows —
but attaching one per org lets DevPulse fetch richer detail that webhooks don't
include, like commit file diffs.

Go to **Organizations → [your org] → Settings → Set Token** and paste a
personal access token with `read:org` scope.

## Operations

### Rotating secrets

- **`ENCRYPTION_KEY` (Fernet).** This encrypts GitHub PATs stored in the
  database. Rotating it **breaks decryption of any token that was
  encrypted with the old key** — the UI will show "No valid tokens" until
  affected orgs re-attach their PATs. For planned rotations, do it during a
  maintenance window and expect to re-add org PATs from the Organization
  Settings page. There is no built-in re-encryption migration.
- **`AUTH_JWT_SECRET` (GitHub mode).** Rotating this invalidates every
  active session JWT — users get signed out and have to sign in again. No
  DB impact. Safe to rotate on any schedule you want.
- **GitHub OAuth client secret.** Regenerate in the OAuth App page, update
  `secret.values.githubClientSecret` (or your SSM parameter), `helm
  upgrade`. Existing sessions stay valid until their JWT expires; only new
  sign-ins use the new secret.
- **Workspace webhook tokens.** Created per-workspace in the UI (Workspace
  Settings → Security Tokens). To rotate: create a new token, update the
  GitHub webhook's secret field to match, then revoke the old token.
  Multiple tokens can be active at once, so there's no downtime if you
  overlap briefly.
- **OIDC client id / issuer.** Cosmetic — update values, `helm upgrade`,
  users re-authenticate on next page load.

### Backups

DevPulse persists everything to Postgres. Use whatever backup strategy
your Postgres deployment already provides — RDS automated snapshots,
`pg_dump` on a schedule, CloudNativePG backup CRs, etc. The application
itself holds no persistent state on disk.

### Uninstalling

```bash
helm uninstall devpulse -n devpulse
kubectl delete namespace devpulse
```

If you used the throwaway Postgres snippet, the namespace delete cleans it
up. If you pointed at an external Postgres, the database itself is
untouched — drop it manually (`DROP DATABASE devpulse;`) when you're ready.

### Upgrading

```bash
helm upgrade --install devpulse oci://ghcr.io/capitaltg/charts/devpulse \
  --version <new-version> -f values.yaml -n devpulse
```

Backend migrations run at pod startup via Alembic; rolling a new backend
pod applies any new schema changes before the pod reports ready. No manual
migration step needed.

## Next steps

- **Repos** — see activity, PR cycle time, and workflow run health per repo.
- **Pull Requests** — cross-repo PR list with AI-assisted risk scoring.
- **Contributors** — per-person activity and review participation.
- **Teams** — if your GitHub org has teams, browse them and their repos.

## Troubleshooting

- **"No valid tokens for workspace"** from the webhook — you haven't created a
  security token in Workspace Settings, or the token you used on the GitHub
  webhook doesn't match the one stored here.
- **Data isn't appearing** — send a test payload from GitHub's webhook
  **Recent Deliveries** tab and confirm it returns `200`. A red delivery means
  either the signature didn't verify or the `workspace_id` query string is
  wrong.
- **Commit file diffs are missing** — that data needs an attached PAT. See
  step 3.
- **Signature verification fails** — confirm the GitHub webhook secret matches
  the workspace token exactly (no trailing whitespace on paste).
