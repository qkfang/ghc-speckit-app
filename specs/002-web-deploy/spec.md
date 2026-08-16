# Feature Specification: Web Frontend Deployment via GitHub Actions

**Feature Branch**: `web-deploy`  
**Created**: 2026-05-20  
**Status**: Draft  
**Input**: User description: "Deploy the AI Genius React frontend web app via GitHub Actions to Azure Static Web Apps using workflow `002-deploy-web.yml`."

## Clarifications

### Session 2026-05-20

- Q: Frontend stack and build output? → A: React 18 + Vite in `src/ai-genius-web`; build output `dist/`.
- Q: Static Web Apps deploy action version? → A: `Azure/static-web-apps-deploy@v1`.
- Q: Required GitHub secrets? → A: `AZURE_CREDENTIALS`, `AZURE_STATIC_WEB_APPS_API_TOKEN`.
- Q: GitHub environment-scoped variables consumed by the workflow? → A: `ENVIRONMENT`, `APP_NAME`.
- Q: How does the API base URL reach the build? → A: Repository/environment variable `VITE_API_URL` is exported as an env var before `npm run build` so Vite inlines it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic deployment on push to main (Priority: P1)

Whenever a developer merges or pushes changes to the `main` branch, the React frontend in `src/ai-genius-web` is automatically built and deployed to Azure Static Web Apps so the latest version is live without manual steps.

**Why this priority**: This is the core value of the feature — continuous delivery of the web app removes manual deployment toil and keeps production current with `main`.

**Independent Test**: Push a commit to `main` that changes a file under `src/ai-genius-web/` and confirm that the workflow runs end-to-end and that the live Static Web App reflects the change.

**Acceptance Scenarios**:

1. **Given** a commit is pushed to `main`, **When** the `002-deploy-web.yml` workflow runs, **Then** it installs dependencies, builds the app, and deploys `dist/` to Azure Static Web Apps successfully.
2. **Given** the deployment succeeds, **When** a user opens the Static Web App URL, **Then** the latest built version of the frontend is served.

---

### User Story 2 - Manual deployment to a chosen environment (Priority: P2)

A maintainer can manually trigger the workflow from the GitHub Actions UI and choose which environment (`dev`, `qa`, `prod`) to deploy to, enabling ad-hoc deployments and promotions.

**Why this priority**: Manual dispatch supports hotfixes, promotion to QA/prod, and re-runs without requiring a new commit.

**Independent Test**: From the Actions tab, run `002-deploy-web.yml` via `workflow_dispatch`, select an environment, and verify the deployment completes against that environment.

**Acceptance Scenarios**:

1. **Given** the maintainer triggers `workflow_dispatch`, **When** they select an environment, **Then** the workflow runs against that environment's configuration and deploys successfully.
2. **Given** no environment is selected on a push event, **When** the workflow runs, **Then** it defaults to `dev`.

---

### Edge Cases

- If `npm ci` or `npm run build` fails, the workflow MUST fail fast and skip deployment.
- If multiple pushes happen in quick succession, only the latest run for the same branch should complete (older in-progress runs are cancelled via concurrency control).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST contain a GitHub Actions workflow file at `.github/workflows/002-deploy-web.yml`.
- **FR-002**: The workflow MUST trigger on `push` to the `main` branch and on `workflow_dispatch`.
- **FR-003**: The `workflow_dispatch` trigger MUST accept an `environment` input (choice of `dev`, `qa`, `prod`) defaulting to `dev`, matching the pattern in `001-deploy-infra.yml`.
- **FR-004**: The workflow MUST use the same `concurrency` group pattern as `001-deploy-infra.yml` (`group: ${{ github.workflow }}-${{ github.ref }}`, `cancel-in-progress: true`).
- **FR-005**: The workflow MUST run on `ubuntu-latest` and target the GitHub environment selected by the input (defaulting to `dev` for push events).
- **FR-006**: The job MUST check out the repo using `actions/checkout@v4`.
- **FR-007**: The job MUST set up Node.js 20 using `actions/setup-node@v4` with npm caching scoped to `src/ai-genius-web/package-lock.json`.
- **FR-008**: The job MUST run `npm ci` and `npm run build` inside `src/ai-genius-web`, producing the `dist/` output.
- **FR-008a**: The build step MUST receive `VITE_API_URL` from `${{ vars.VITE_API_URL }}` as an environment variable so Vite inlines the API base URL at build time.
- **FR-008b**: The job MUST consume `ENVIRONMENT` and `APP_NAME` GitHub environment-scoped variables (e.g., `${{ vars.ENVIRONMENT }}`, `${{ vars.APP_NAME }}`) for logging/output identification of the target deployment.
- **FR-009**: The job MUST authenticate to Azure using `azure/login@v1` with `creds: ${{ secrets.AZURE_CREDENTIALS }}`.
- **FR-010**: The job MUST deploy the built output to Azure Static Web Apps using `Azure/static-web-apps-deploy@v1` with `azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}`, `repo_token: ${{ secrets.GITHUB_TOKEN }}`, `action: upload`, `app_location: src/ai-genius-web/dist`, `output_location: ""`, and `skip_app_build: true`.
- **FR-011**: The workflow MUST expose the deployed Static Web App URL in the run summary/output for easy verification.
- **FR-012**: The workflow MUST fail the run if the build step fails, without attempting deployment.

### Key Entities

- **GitHub Actions Workflow (`002-deploy-web.yml`)**: The pipeline definition that builds and deploys the frontend.
- **Frontend App (`src/ai-genius-web`)**: React + Vite source whose `dist/` build output is the deployment artifact.
- **Azure Static Web App**: The hosting target receiving the built assets.
- **GitHub Environment**: Logical environment (`dev`/`qa`/`prod`) supplying scoped variables and approval rules.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A push to `main` results in the updated frontend being live on the Static Web App without manual intervention.
- **SC-002**: The end-to-end workflow (install → build → deploy) completes in under 5 minutes for the typical change.
- **SC-003**: Maintainers can deploy to any of `dev`, `qa`, or `prod` from the Actions UI in a single click.
- **SC-004**: Concurrent pushes to the same branch never produce overlapping deployments; only the latest run completes.
- **SC-005**: 100% of failed builds skip the deploy step and surface the failing step clearly in the run log.

## Assumptions

- Azure Static Web Apps resource is already provisioned by workflow `001-deploy-infra.yml`.
- Required secrets (`AZURE_CREDENTIALS`, `AZURE_STATIC_WEB_APPS_API_TOKEN`) are configured at the repository level.
- GitHub environment variables `ENVIRONMENT`, `APP_NAME`, and `VITE_API_URL` are configured per environment (`dev`, `qa`, `prod`).
- The frontend (React 18 + Vite) builds successfully with `npm run build` and outputs to `src/ai-genius-web/dist`.
- Node.js 20 is the supported runtime for the Vite build.
