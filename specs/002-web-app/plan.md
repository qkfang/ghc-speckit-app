# Implementation Plan: Sample App Episode Browser

**Branch**: `002-web-app` | **Date**: 2026-08-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/002-web-app/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a new React 18 single-page frontend in `src/app-web` during a one-week sprint. The app will use native `fetch` to load status, series, and episode data from the separately delivered .NET API, render friendly loading/error/empty states, and filter the loaded episode cards by a search term held in component state. Vite will provide local development and production builds without a React plugin or any dependency beyond `react`, `react-dom`, and `vite`.

## Technical Context

**Language/Version**: JavaScript (ES2022), React 18, Node.js 20 for tooling  
**Primary Dependencies**: `react`, `react-dom`, `vite`; browser-native `fetch` and `AbortController`  
**Storage**: N/A; API data and search input remain in browser memory  
**Testing**: `npm run build` as the automated gate, plus manual acceptance checks for loading, success, search, no-results, and service-error states  
**Target Platform**: Current evergreen desktop and mobile browsers; static production hosting on Azure Static Web Apps  
**Project Type**: Frontend-only single-page web application  
**Performance Goals**: Show loading feedback within 0.5 seconds; show available content within 2 seconds under normal conditions; update search results immediately without another network request  
**Constraints**: One-week sprint; brand-new scaffold in `src/app-web`; React 18; search term stored with `useState`; no dependencies beyond React, React DOM, and Vite; no API implementation; no full-page reload for state changes  
**Scale/Scope**: One page, one featured series, three initial GET requests, one in-memory episode collection, and five user-visible states (loading, loaded, filtered no-results, empty catalog, error)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Security-First: PASS**. No secrets or credentials are introduced. Production requests use the configured HTTPS service URL or same-origin relative paths. The only user input is a local search term and is never sent to the API or interpreted as markup.
- **Cloud-Native: PASS (not applicable to this change)**. This feature adds no Azure resources or manual provisioning; existing Bicep ownership remains unchanged.
- **CI/CD-Driven: PASS**. The frontend exposes a deterministic `npm run build` command suitable for the existing GitHub Actions frontend workflow; deployment remains workflow-only.
- **Simplicity: PASS**. The design uses one Vite project, React component state, derived filtering, and browser-native networking. It adds only the three explicitly allowed packages.
- **Tested: PASS**. The frontend production build is the required automated gate. No API route is added, so the API-route test mandate does not apply. Browser-state acceptance checks are documented without adding a test framework.
- **Development Workflow: PASS**. Work is on branch `002-web-app`; the spec exists and now includes the required `feature`, `risk`, `breaking`, and `reviewer-team` metadata.

**Pre-design gate result**: PASS. No constitutional violations require justification.

## Project Structure

### Documentation (this feature)

```text
specs/002-web-app/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- api-contract.yaml
`-- tasks.md             # Created later by /speckit.tasks, not this command
```

### Source Code (repository root)

```text
src/app-web/
|-- index.html
|-- package.json
|-- package-lock.json
|-- vite.config.js
`-- src/
    |-- App.css
    |-- App.jsx
    |-- index.css
    `-- main.jsx
```

**Structure Decision**: Use a single Vite frontend rooted at `src/app-web`. `main.jsx` owns only the React root bootstrap, while `App.jsx` owns initial data loading, UI state, search state, derived episode filtering, and rendering. Styling stays in the two local CSS files. No service abstraction or component directory is introduced until the single page becomes too large to understand.

## Design Outline

1. Scaffold the Vite package and browser entry points without `@vitejs/plugin-react`; Vite's built-in JSX transform handles `.jsx` files.
2. Read `VITE_API_URL` once as an optional API base and append `/api/status`, `/api/series`, and `/api/episodes`; proxy same-origin Vite development requests to the local API on port `5000`.
3. Start all three GET requests together on initial mount. Require successful HTTP responses and a healthy status response before publishing the combined page data.
4. Cancel in-flight requests when the app unmounts and convert network, HTTP, service-health, or response-shape failures into one friendly error state.
5. Keep the search term in `useState`. Derive visible episodes during render with a trimmed, case-insensitive title/presenter match; do not duplicate filtered results in state or send search requests.
6. Render the persistent app header plus exactly one content state: loading, error, loaded cards, empty catalog, or no search matches. Missing episode display values use `Unavailable`.
7. Validate the production build and manually exercise the state matrix against a compatible API or controlled browser responses.

## One-Week Delivery Plan

| Day | Outcome |
|-----|---------|
| 1 | Create the Vite/React scaffold, package scripts, root mount, baseline styling, and a clean production build. |
| 2 | Implement the three-request loading flow, API base configuration, response validation, and unmount cancellation. |
| 3 | Build the persistent header, series section, responsive episode-card grid, and loading/error/empty states. |
| 4 | Add controlled search with `useState`, derived title/presenter filtering, no-match messaging, accessibility labels, and responsive polish. |
| 5 | Run the production build, execute the acceptance-state checklist, fix defects, and update quickstart documentation. |

## Post-Design Constitution Check

- **Security-First: PASS**. The contract is read-only, the search term stays local, client-visible configuration is explicitly non-secret, and production API traffic requires HTTPS.
- **Cloud-Native: PASS (not applicable to this change)**. The design adds no infrastructure and preserves existing Bicep ownership.
- **CI/CD-Driven: PASS**. The quickstart defines reproducible `npm ci` and `npm run build` commands that fit the existing frontend workflow.
- **Simplicity: PASS**. The final model uses one remote-state discriminator, one `useState` search value, native browser APIs, one page component, and no additional package.
- **Tested: PASS**. The build gate and focused manual state matrix cover the frontend behavior available under the explicit dependency restriction; no API route is implemented.
- **Development Workflow: PASS**. Plan, research, data model, contract, and quickstart all reside under `specs/002-web-app` and are tied to the compliant feature branch and metadata.

**Post-design gate result**: PASS. No constitutional violations require complexity tracking or justification.
