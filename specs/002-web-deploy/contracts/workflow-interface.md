# Workflow Interface Contract — `002-deploy-web.yml`

This contract documents the inputs, outputs, and external surfaces exposed by the workflow. It is the authoritative reference for repository/environment configuration consumed by the pipeline.

## Triggers

| Trigger | Configuration |
|---|---|
| `push` | `branches: [main]` |
| `workflow_dispatch` | input `environment` (choice: `dev` \| `qa` \| `prod`; default `dev`) |

## Concurrency

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

## Inputs

### Workflow dispatch input

| Name | Type | Required | Default | Allowed values |
|---|---|---|---|---|
| `environment` | choice | yes (manual) | `dev` | `dev`, `qa`, `prod` |

### Repository secrets

| Name | Required | Description |
|---|---|---|
| `AZURE_CREDENTIALS` | yes | Azure Service Principal JSON for `azure/login@v1`. |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | yes | Deployment token for `Azure/static-web-apps-deploy@v1`. |
| `GITHUB_TOKEN` | yes (auto) | PR-comment token for SWA deploy action. |

### GitHub Environment variables (per `dev` / `qa` / `prod`)

| Name | Required | Example | Purpose |
|---|---|---|---|
| `ENVIRONMENT` | yes | `dev` | Identifies target env in logs/summary. |
| `APP_NAME` | yes | `aigenius4` | Application identifier in logs/summary. |
| `VITE_API_URL` | yes | `https://aigenius4-api-dev.azurewebsites.net` | Inlined into SPA bundle at build time. |

## Outputs

| Name | Type | Source | Description |
|---|---|---|---|
| `static_web_app_url` | string | `Azure/static-web-apps-deploy@v1` step output | URL of the deployed SPA, written to `$GITHUB_STEP_SUMMARY`. |

## External actions (locked versions)

| Action | Version | Purpose |
|---|---|---|
| `actions/checkout` | `v4` | Source checkout |
| `actions/setup-node` | `v4` | Node 20 + npm cache |
| `azure/login` | `v1` | Azure auth via SP JSON |
| `Azure/static-web-apps-deploy` | `v1` | Upload `dist/` to Static Web App |

## Failure modes (happy-path scope)

| Failure | Effect |
|---|---|
| `npm ci` or `npm run build` non-zero exit | Job fails before any deploy step runs (FR-012). |
| `azure/login` fails | Deploy step is not reached; workflow fails. |
| SWA deploy action returns error | Workflow fails with the action's error message. |

## Non-goals (out of scope for this one-week sprint)

- Preview deployments per PR.
- Custom domain / certificate management.
- Rollback automation.
- Build artifact caching across workflows.
- Bundle-size or Lighthouse gates.
