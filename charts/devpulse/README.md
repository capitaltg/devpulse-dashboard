# DevPulse Helm Chart

Open-source GitHub telemetry dashboard for Kubernetes.

Source: https://github.com/capitaltg/devpulse-dashboard
Images: `ghcr.io/capitaltg/devpulse-dashboard-{frontend,backend}`

## Quick install

```bash
helm install devpulse oci://ghcr.io/capitaltg/charts/devpulse \
  --version 0.1.0 \
  --namespace devpulse --create-namespace \
  -f values.yaml
```

Minimum `values.yaml` for a GitHub OAuth deploy:

```yaml
auth:
  provider: github
  github:
    clientId: <OAuth App client id>
  frontendBaseUrl: https://devpulse.example.com

secret:
  values:
    encryptionKey: "<fernet key>"
    authJwtSecret: "<random 32+ byte string>"
    githubClientSecret: "<OAuth App client secret>"

database:
  url: postgresql://user:pass@your-postgres:5432/devpulse

ingress:
  enabled: true
  className: nginx
  host: devpulse.example.com
  tls:
    enabled: true
    secretName: devpulse-tls
```

See [`docs/getting-started.md`](https://github.com/capitaltg/devpulse-dashboard/blob/main/docs/getting-started.md)
for the full walkthrough: OAuth App setup, OIDC alternative, external-secrets
patterns, and post-install configuration.

## What it deploys

The chart is **stateless** — you bring your own Postgres. Out of the box it
creates:

- Frontend Deployment + Service (React + nginx, port 80)
- Backend Deployment + Service (FastAPI, port 8000)
- ConfigMap + Secret for backend env
- ServiceAccount
- Ingress (optional, off by default) routing `/v1/*`, `/auth/*`, `/webhook`, `/health` to the backend and `/` to the frontend on a single hostname — keeps cookies same-origin for the OAuth CSRF flow

## Values reference

Pulled from [`values.yaml`](./values.yaml) — that file has inline comments for each knob.

| Key | Default | Purpose |
| --- | --- | --- |
| `image.registry` | `ghcr.io/capitaltg` | Image registry namespace |
| `image.tag` | `latest` | Pin `sha-<git-sha>` for reproducibility |
| `image.pullPolicy` | `Always` | Always-pull by default because `latest` is mutable; safe to switch to `IfNotPresent` when `image.tag` is a SHA |
| `frontend.replicaCount` | `1` | |
| `frontend.service.annotations` | `{}` | Per-service annotations (e.g. ALB target-group overrides) |
| `backend.replicaCount` | `1` | Scale once your Postgres can handle it |
| `backend.service.annotations` | `{}` | Per-service annotations — on AWS ALB set `alb.ingress.kubernetes.io/healthcheck-path: /health` here |
| `auth.provider` | `""` | `github` or `oidc` — required |
| `auth.frontendBaseUrl` | `""` | Explicit override; derived from `ingress.host` when empty |
| `auth.github.clientId` | `""` | Required when `auth.provider=github` |
| `auth.oidc.issuer` | `""` | Required when `auth.provider=oidc` |
| `auth.oidc.clientId` | `""` | Required when `auth.provider=oidc` |
| `auth.oidc.scope` | `openid email profile` | |
| `secret.existingSecret` | `""` | Name of a pre-created Secret; skip `secret.values` if set |
| `secret.values.encryptionKey` | `""` | Fernet key — required unless using `existingSecret` |
| `secret.values.authJwtSecret` | `""` | Required when `auth.provider=github` |
| `secret.values.githubClientSecret` | `""` | Required when `auth.provider=github` |
| `database.url` | `""` | `postgresql://user:pass@host:5432/db` — required unless supplied via `existingSecret` |
| `ingress.enabled` | `false` | |
| `ingress.className` | `""` | e.g. `nginx`, `alb`, `eks-auto-alb` |
| `ingress.host` | `""` | Required when ingress enabled |
| `ingress.tls.enabled` | `false` | Set true for in-cluster TLS; leave false if TLS terminates at a cloud LB |
| `ingress.tls.secretName` | `""` | Omit when cert-manager manages the cert |
| `ingress.annotations` | `{}` | e.g. `cert-manager.io/cluster-issuer`, `alb.ingress.kubernetes.io/*` |
| `service.type` | `ClusterIP` | |
| `serviceAccount.create` | `true` | |
| `postgresql`, `externalDatabase` | — | **Removed in 0.1.0** — use `database.url` |

## Using an external secret store

The `secret.existingSecret` value lets you point the chart at any pre-created
Secret — typically one managed by the [External Secrets
Operator](https://external-secrets.io/), SealedSecrets, or Terraform. The
Secret must contain these keys:

- `ENCRYPTION_KEY`
- `AUTH_JWT_SECRET` (when `auth.provider=github`)
- `GITHUB_OAUTH_CLIENT_SECRET` (when `auth.provider=github`)
- `DATABASE_URL`

See the external-secrets section of the main docs for an AWS SSM ↔ ESO example.

## License

Apache-2.0 — see [LICENSE](https://github.com/capitaltg/devpulse-dashboard/blob/main/LICENSE).
