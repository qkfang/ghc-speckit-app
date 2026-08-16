# Implementation Plan: Web Frontend Deployment via GitHub Actions

**Branch**: `002-web-deploy` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-web-deploy/spec.md`

## Summary

Add a GitHub Actions workflow (`.github/workflows/002-deploy-web.yml`) that builds the React 18 + Vite frontend in `src/ai-genius-web` and deploys the resulting `dist/` to Azure Static Web Apps using `Azure/static-web-apps-deploy@v1`. The workflow runs on every push to `main` and on `workflow_dispatch` with a `dev`/`qa`/`prod` environment input. It consumes GitHub environment-scoped variables (`ENVIRONMENT`, `APP_NAME`, `VITE_API_URL`) and repository secrets (`AZURE_CREDENTIALS`, `AZURE_STATIC_WEB_APPS_API_TOKEN`). Scoped to a one-week sprint — happy path only, no edge-case hardening beyond fail-fast on build errors.

## Technical Context

**Language/Version**: YAML (GitHub Actions); JavaScript/JSX (React 18); Node.js 20 (build runtime)
**Primary Dependencies**: `actions/checkout@v4`, `actions/setup-node@v4`, `azure/login@v1`, `Azure/static-web-apps-deploy@v1`, Vite (frontend build)
**Storage**: N/A (static asset deployment)
**Testing**: `npm run build` must succeed; manual smoke test of deployed Static Web App URL
**Target Platform**: GitHub Actions `ubuntu-latest`; Azure Static Web Apps (Free tier)
**Project Type**: CI/CD pipeline (single workflow file deploying a Vite SPA)
**Performance Goals**: End-to-end workflow (install → build → deploy) under 5 minutes (SC-002)
**Constraints**: Happy-path scope only — one-week sprint. `VITE_API_URL` must be inlined at build time (Vite requirement); concurrency-cancel older runs on the same ref
**Scale/Scope**: 1 workflow file; 3 environments (dev/qa/prod); single SPA artifact (`src/ai-genius-web/dist`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **Security-First** — no secrets committed; HTTPS-only | ✅ PASS | Secrets injected via `${{ secrets.* }}`; Static Web Apps serves HTTPS by default |
| **Cloud-Native** — IaC, tagged resources, idempotent | ✅ PASS | Static Web App resource provisioned by `001-deploy-infra`; upload action is idempotent |
| **CI/CD-Driven** — every merge triggers automated deployment | ✅ PASS | `on: push: branches: [main]` is the primary trigger |
| **Spec-Gated** — spec artifact present before planning | ✅ PASS | `specs/002-web-deploy/spec.md` exists |
| **Simplicity** — prefer standard Actions, no over-engineering | ✅ PASS | Only official `actions/*` and `Azure/*` actions; no custom scripts |
| **Tested** — frontend builds cleanly | ✅ PASS | `npm run build` runs in workflow; failure blocks deploy (FR-012) |

**Post-Phase-1 re-check**: All gates still PASS — Phase 1 artifacts introduced no new dependencies or violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-web-deploy/
├── plan.md                       # This file
├── spec.md                       # Feature specification (existing)
├── research.md                   # Phase 0 output
├── data-model.md                 # Phase 1 output
├── quickstart.md                 # Phase 1 output
├── contracts/
│   └── workflow-interface.md     # Phase 1 output
├── checklists/
│   └── requirements.md           # Existing
└── tasks.md                      # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    └── 002-deploy-web.yml        # NEW — single-job workflow: build + deploy frontend

src/
└── ai-genius-web/                # Existing — React 18 + Vite SPA
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        └── main.jsx
```

**Structure Decision**: Single workflow file with one job (`build-and-deploy`); no new source directories. The feature is purely operational (YAML).

## Complexity Tracking

> No constitution violations — section not applicable.
