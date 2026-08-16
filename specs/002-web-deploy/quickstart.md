# Quickstart — Web Frontend Deployment

This is the operator-facing quickstart for the `002-deploy-web.yml` workflow.

## 1. One-time setup

### 1.1 Repository secrets (Settings → Secrets and variables → Actions → Secrets)

| Secret | Value |
|---|---|
| `AZURE_CREDENTIALS` | JSON output of `az ad sp create-for-rbac --sdk-auth ...` (see `AGENTS.md`) |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token from the Static Web App in the Azure Portal |

### 1.2 GitHub Environments

Create three environments — `dev`, `qa`, `prod` — under **Settings → Environments**.

For each environment, define these variables (Settings → Environments → `<env>` → Variables):

| Variable | Example (`dev`) | Example (`qa`) | Example (`prod`) |
|---|---|---|---|
| `ENVIRONMENT` | `dev` | `qa` | `prod` |
| `APP_NAME` | `aigenius4` | `aigenius4` | `aigenius4` |
| `VITE_API_URL` | `https://aigenius4-api-dev.azurewebsites.net` | `https://aigenius4-api-qa.azurewebsites.net` | `https://aigenius4-api-prod.azurewebsites.net` |

Optionally add **required reviewers** on the `prod` environment for approval gates.

### 1.3 Confirm infra exists

The Static Web App must already be provisioned by workflow `001-deploy-infra.yml`. Run that workflow once per environment before the first web deployment.

## 2. Trigger a deployment

### 2.1 Automatic (push to `main`)

```bash
git push origin main
```

The workflow runs against the `dev` environment by default.

### 2.2 Manual

1. Open **Actions → Deploy Web** in GitHub.
2. Click **Run workflow**.
3. Choose the target `environment` (`dev` / `qa` / `prod`).
4. Click **Run workflow**.

## 3. Verify the deployment

1. Open the workflow run summary in GitHub Actions.
2. The deployed Static Web App URL is listed in the run summary (and on the deploy step output).
3. Open the URL in a browser; the latest UI changes should be visible.
4. Confirm the SPA can reach the API at the `VITE_API_URL` value configured for that environment (open browser DevTools → Network → look for calls to that host).

## 4. Local dev sanity check

Before pushing, verify the build still succeeds locally:

```bash
cd src/ai-genius-web
npm ci
npm run build
```

A clean exit (no errors) means the workflow's build step will also pass.

## 5. Troubleshooting (happy-path-only)

| Symptom | Likely cause | Fix |
|---|---|---|
| Workflow fails on `npm run build` | Local build is broken | Fix build errors locally, push again |
| `azure/login` step fails | `AZURE_CREDENTIALS` missing/invalid | Re-issue SP and update secret |
| Deploy step succeeds but UI is stale | Browser cache | Hard refresh (Ctrl+F5) |
| SPA loads but API calls 404/CORS | `VITE_API_URL` wrong or API not deployed | Fix env var; ensure `003-deploy-api.yml` ran |
