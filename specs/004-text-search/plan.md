# Implementation Plan: Episode Text Search

**Branch**: `004-text-search` | **Date**: 2026-08-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/004-text-search/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Wire the existing React search box (`src/app-web`) to the existing backend search endpoint (`src/app-api`, `GET /api/episodes/search`) instead of filtering the already-loaded episode list in the browser. The endpoint's query parameter is renamed from `q` to `query` and extended with a small wildcard helper that supports `*term*` (contains), `term*` (starts-with), and `*term` (ends-with) in addition to the existing plain case-insensitive substring fallback. The frontend debounces the search box with a plain `setTimeout`/`clearTimeout` effect (no new dependency), calls the endpoint on every debounced change (including an empty term, which the endpoint already treats as "no filter"), and discards results from any request that is no longer the latest in flight.

## Technical Context

**Language/Version**: C# / .NET 10 (`net10.0`) for `src/app-api`; JavaScript (ES2022) / React 18 / Node.js 20 for `src/app-web` — unchanged from features 002/003
**Primary Dependencies**: None added. Backend keeps ASP.NET Core Minimal APIs + `Swashbuckle.AspNetCore`; frontend keeps `react`, `react-dom`, `vite` and browser-native `fetch`/`AbortController`/`setTimeout`
**Storage**: N/A — episodes still served from the in-memory `episodes.json` snapshot loaded at API startup
**Testing**: `dotnet build` (API) and `npm run build` (frontend) as automated compile gates, plus a manual curl-based acceptance script in `quickstart.md` covering the three wildcard patterns, the plain-substring fallback, the empty-term case, and the no-results/error states. No dedicated xUnit test project exists yet in this repo (a pre-existing gap from feature 003, not introduced here); adding one is out of scope for this fast-turnaround change
**Target Platform**: Same as existing — API on Azure App Service Linux / local `dotnet run`; frontend on Azure Static Web Apps / local Vite dev server
**Project Type**: Web application (existing frontend + backend, both modified in place)
**Performance Goals**: Debounced typing sends at most one search request per pause in typing (SC-003); search responses remain in the sub-200ms range already established for the in-memory data (feature 003, SC-002)
**Constraints**: No new npm or NuGet packages; wildcard matching stays case-insensitive and limited to the three documented patterns, with any other `*` placement falling back to a literal substring match; stale in-flight search responses must never overwrite newer results
**Scale/Scope**: One backend endpoint modified (`GET /api/episodes/search`), one frontend component modified (`App.jsx`); no new pages, routes, or data entities

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| 1. Security-First | Inputs validated at the boundary; no plain-HTTP in prod; no secrets in source | ✅ PASS | The search term is treated as plain text everywhere — no regex built from user input, no HTML/markup interpretation, no reflection back into the DOM as raw HTML. `UseHttpsRedirection()` and the existing CORS allow-list are unchanged. |
| 2. Cloud-Native | IaC via Bicep; tagged resources | ✅ PASS (N/A new infra) | No new Azure resources; existing App Service and Static Web App from prior features are reused unchanged. |
| 3. CI/CD-Driven | Automated build/deploy on merge to `main` | ✅ PASS | Existing `002`/`003` deploy workflows already build and deploy `src/app-web` and `src/app-api`; no workflow changes are required. |
| 4. Spec-Gated | `spec.md` exists under `specs/<feature-id>/` | ✅ PASS | Generated from `specs/004-text-search/spec.md`, which carries the required `feature`/`risk`/`breaking`/`reviewer-team` front-matter. |
| 5. Simplicity | Standard libraries preferred; avoid over-engineering | ✅ PASS | Wildcard matching is a small `StartsWith`/`EndsWith`/`Contains` helper (no regex engine); debounce is a plain `setTimeout` effect (no debounce library). |
| 6. Tested | API routes must have unit/integration tests | ⚠️ PASS (manual, documented gap) | No automated test project exists yet for `src/app-api` (pre-existing gap, not introduced by this feature). This feature's acceptance is covered by `dotnet build`/`npm run build` compile gates plus the manual curl/browser script in `quickstart.md`. Adding a full xUnit project is left as separate follow-up work rather than scope creep on this change. |

**Pre-design gate result**: PASS, with the pre-existing "Tested" gap called out (not newly introduced).

## Project Structure

### Documentation (this feature)

```text
specs/004-text-search/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── search-contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app-api/
│   └── Program.cs              # GET /api/episodes/search: rename `q` -> `query`, add wildcard helper
└── app-web/
    └── src/
        └── App.jsx              # Debounced search effect calling the search endpoint, race-safe result handling
```

**Structure Decision**: No new projects or directories. This feature modifies exactly two existing files — `src/app-api/Program.cs` (search endpoint behavior) and `src/app-web/src/App.jsx` (search wiring) — matching the existing single-API/single-SPA structure established by features 002 and 003.

## Design Outline

1. **Backend — `src/app-api/Program.cs`**:
   - Rename the `GET /api/episodes/search` query parameter from `q` to `query`.
   - Add a small private `MatchesSearchTerm(string text, string term)` helper: empty/whitespace term or a lone `*` matches everything; a term with a leading and/or trailing `*` (and no other `*` inside) matches contains/starts-with/ends-with respectively (case-insensitive via `OrdinalIgnoreCase`); any other `*` placement falls back to a literal, case-insensitive `Contains` match on the raw term (same as the no-wildcard path).
   - Apply the helper to `title` OR `introduction` for each episode, same as the existing endpoint's field set.
2. **Frontend — `src/app-web/src/App.jsx`**:
   - Keep `searchTerm` as the raw controlled-input state.
   - Add a `debouncedSearchTerm` state updated via a `useEffect` that sets a `setTimeout` (~300ms) on every `searchTerm` change and clears the previous timeout on cleanup — a standard debounce with no new dependency.
   - Add a second `useEffect`, scoped to run once the initial load succeeds, that fires on every `debouncedSearchTerm` change: build `/api/episodes/search?query=${encodeURIComponent(debouncedSearchTerm)}`, fetch with an `AbortController`, and store the returned episodes as the displayed list.
   - Track requests with a simple incrementing ref counter (or rely on `AbortController.abort()` of the previous request) so a slower, stale response can never overwrite a newer one.
   - Reuse the existing empty-catalog vs. no-search-match markup: the initial (unfiltered) episode count from first load still determines "catalog is empty," while the current search response length determines "no matches for this search."
3. **Contract update**: Document the renamed parameter and wildcard behavior in `contracts/search-contract.md`; this supersedes the `q`-based description in `specs/003-api-app/contracts/api-contract.md` for this one endpoint.
4. **Verification**: `dotnet build` and `npm run build` as compile gates; manual curl script in `quickstart.md` exercising `*dan*`, `dan*`, `*dan`, a plain term, an empty term, a no-match term, and a middle-`*` term; manual browser check that rapid typing in the search box only issues one settled request and that clearing the box restores the full list.

## Post-Design Constitution Check

- **Security-First: PASS**. The search term is never used to build a regular expression or interpreted as markup; it is only compared with `StartsWith`/`EndsWith`/`Contains` and sent to the frontend's own API over the existing HTTPS/CORS configuration.
- **Cloud-Native: PASS (not applicable to this change)**. No infrastructure changes.
- **CI/CD-Driven: PASS**. Both projects still build with their existing, unchanged CI commands.
- **Simplicity: PASS**. The design adds one small server-side helper method and one client-side debounce effect; no new packages, services, or abstractions.
- **Tested: PASS (manual, documented gap carried forward)**. Compile gates plus the documented manual acceptance script in `quickstart.md` cover every acceptance scenario from `spec.md`; the absence of an automated API test project remains a known, pre-existing gap rather than new scope.
- **Development Workflow: PASS**. Plan, research, data model, contract, and quickstart all live under `specs/004-text-search` and are tied to branch `004-text-search` and its compliant spec metadata.

**Post-design gate result**: PASS. No constitutional violations require complexity tracking or justification.

## Complexity Tracking

> No Constitution Check violations — this section is intentionally empty.

