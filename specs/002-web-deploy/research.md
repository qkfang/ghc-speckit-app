# Phase 0 Research — Web Frontend Deployment

All clarifications from `spec.md` are already resolved (Session 2026-05-20). This document records the standard-practice choices applied to a one-week-sprint Vite SPA deployment.

## Decisions

### D1: Build runtime — Node.js 20 via `actions/setup-node@v4`
- **Decision**: Use `actions/setup-node@v4` with `node-version: '20'` and `cache: 'npm'` scoped to `src/ai-genius-web/package-lock.json`.
- **Rationale**: Node 20 is the current LTS and the documented standard in `AGENTS.md`. Built-in npm caching cuts install time without third-party actions (Simplicity principle).
- **Alternatives considered**:
  - Node 18 — older LTS; no benefit and against repo convention.
  - `pnpm`/`yarn` setup actions — adds dependency not present in `package.json`.

### D2: Deploy action — `Azure/static-web-apps-deploy@v1` with `skip_app_build: true`
- **Decision**: Build the SPA in a dedicated step (`npm run build`), then call the action with `skip_app_build: true` and `app_location: src/ai-genius-web/dist`.
- **Rationale**: Building outside the action lets us control Node version, inject `VITE_API_URL` cleanly, and surface build errors before any deploy step runs (FR-012). The action's built-in Oryx build path does not work well with environment-specific build-time variables.
- **Alternatives considered**:
  - Let the action build via Oryx — opaque, slower, and harder to inject env-specific `VITE_API_URL`.
  - `azure/cli@v1` + `az staticwebapp` — no first-class deploy verb for SWA content.

### D3: `VITE_API_URL` injection at build time
- **Decision**: Export `VITE_API_URL: ${{ vars.VITE_API_URL }}` on the `npm run build` step's `env:` block so Vite inlines it into the bundle.
- **Rationale**: Vite inlines `import.meta.env.VITE_*` at build time; runtime injection is not possible for a static SPA. Sourcing from `vars.*` (environment-scoped) keeps the value per-environment without secrets.
- **Alternatives considered**:
  - Runtime config fetch — adds an extra round-trip and code path; over-engineered for a one-week sprint.
  - Hardcode per-environment in `vite.config.js` — violates Spec-Gated/Cloud-Native principles.

### D4: Authentication — `azure/login@v1` with `AZURE_CREDENTIALS`
- **Decision**: Use the SP-JSON credential (`creds: ${{ secrets.AZURE_CREDENTIALS }}`) as defined in `AGENTS.md`.
- **Rationale**: Required by spec (FR-009) and consistent with workflow 003. Although 001 uses OIDC, this feature spec explicitly mandates the SP secret.
- **Alternatives considered**:
  - OIDC federated credential — would require additional setup outside the one-week scope; the spec already locks in `AZURE_CREDENTIALS`.

### D5: Trigger + concurrency pattern
- **Decision**: `on: push: branches: [main]` + `workflow_dispatch` with an `environment` choice input (default `dev`). Concurrency group `${{ github.workflow }}-${{ github.ref }}`, `cancel-in-progress: true`.
- **Rationale**: Mirrors workflow `001-deploy-infra.yml` (FR-004) for consistency. Cancellation prevents overlapping deploys (SC-004).

### D6: Environment selection
- **Decision**: Job-level `environment: ${{ github.event.inputs.environment || 'dev' }}` so GitHub environment scoping (variables, approvals) applies automatically.
- **Rationale**: Single source of truth for `ENVIRONMENT`, `APP_NAME`, `VITE_API_URL` via `vars.*`; supports approval gates for `prod` later without workflow changes.

### D7: Output the deployed URL
- **Decision**: Capture `static_web_app_url` from the deploy action's output and append to `$GITHUB_STEP_SUMMARY`.
- **Rationale**: Satisfies FR-011 with built-in GitHub Actions plumbing; no extra tooling.

## Open questions

None. All NEEDS CLARIFICATION items from the spec are resolved.
