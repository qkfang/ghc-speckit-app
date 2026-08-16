# Phase 1 Data Model — Web Frontend Deployment

This feature is a CI/CD pipeline; "entities" are workflow configuration objects rather than persisted records.

## Entities

### 1. Workflow file: `.github/workflows/002-deploy-web.yml`

| Field | Type | Source | Notes |
|---|---|---|---|
| `name` | string | literal | `Deploy Web` |
| `on.push.branches` | list | literal | `[main]` |
| `on.workflow_dispatch.inputs.environment` | choice | user | `dev` \| `qa` \| `prod`; default `dev` |
| `concurrency.group` | expression | literal | `${{ github.workflow }}-${{ github.ref }}` |
| `concurrency.cancel-in-progress` | bool | literal | `true` |

### 2. Job: `build-and-deploy`

| Field | Type | Source | Notes |
|---|---|---|---|
| `runs-on` | string | literal | `ubuntu-latest` |
| `environment` | string | expression | `${{ github.event.inputs.environment \|\| 'dev' }}` — binds GitHub environment scope |
| `outputs.static_web_app_url` | string | step output | Surfaces deployed URL (FR-011) |

### 3. Inputs consumed (per-environment GitHub vars)

| Name | Scope | Required | Used For |
|---|---|---|---|
| `ENVIRONMENT` | environment var | yes | Log / summary identification (FR-008b) |
| `APP_NAME` | environment var | yes | Log / summary identification (FR-008b) |
| `VITE_API_URL` | environment var | yes | Inlined into SPA build via `npm run build` env (FR-008a) |

### 4. Secrets consumed

| Name | Scope | Required | Used For |
|---|---|---|---|
| `AZURE_CREDENTIALS` | repository | yes | `azure/login@v1` SP-JSON (FR-009) |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | repository | yes | `Azure/static-web-apps-deploy@v1` (FR-010) |
| `GITHUB_TOKEN` | repository (auto) | yes | `repo_token` for SWA deploy action (FR-010) |

### 5. Build artifact

| Field | Value |
|---|---|
| Source path | `src/ai-genius-web` |
| Build command | `npm ci && npm run build` |
| Output path | `src/ai-genius-web/dist` |
| Action `app_location` | `src/ai-genius-web/dist` |
| Action `output_location` | `""` (already built) |
| Action `skip_app_build` | `true` |

## State transitions

```text
push to main / workflow_dispatch
        │
        ▼
   checkout (actions/checkout@v4)
        │
        ▼
   setup-node@v4 (node 20, npm cache)
        │
        ▼
   npm ci  ── fail ──▶ workflow fails (no deploy)  ✅ FR-012
        │
        ▼
   npm run build (VITE_API_URL injected)
        │
        ▼
   azure/login@v1
        │
        ▼
   Azure/static-web-apps-deploy@v1 (upload dist/)
        │
        ▼
   write static_web_app_url to step summary
```

## Validation rules

- All required secrets and vars listed above MUST be present in the resolved environment scope; absence causes the workflow to fail at the consuming step (no extra preflight needed — keep simple).
- `npm run build` exit code != 0 ⇒ job fails before deploy (FR-012).
