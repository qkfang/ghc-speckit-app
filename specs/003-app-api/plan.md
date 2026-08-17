# Implementation Plan: Sample App Backend API

**Branch**: `002-sample-app-api` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-sample-app-api/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a single-file ASP.NET Core minimal API (`src/app-api/Program.cs`, net10.0) that serves status, health, series info, episode list, single-episode, and keyword-search endpoints. All series/episode data is loaded once at startup from a bundled `episodes.json` file (no database). Interactive docs are exposed via Swashbuckle (Swagger UI), and the frontend at `http://localhost:5173` can call every endpoint via configurable CORS. This mirrors the existing reference implementation in `src-bk/app-api`, adding only the search endpoint required by this spec.

## Technical Context

**Language/Version**: C# / .NET 10 (`net10.0`) — matches `src-bk/app-api/app-api.csproj` and the `dotnet-version: 10.0.x` used by `AGENTS.md` / the API deploy workflow  
**Primary Dependencies**: ASP.NET Core Minimal APIs (`Microsoft.NET.Sdk.Web`), `Swashbuckle.AspNetCore` (Swagger/OpenAPI), `System.Text.Json`  
**Storage**: N/A — local `episodes.json` file bundled as content and loaded into memory once at startup; no database  
**Testing**: xUnit + `Microsoft.AspNetCore.Mvc.Testing` (`WebApplicationFactory<Program>`) for lightweight integration tests against the running minimal API  
**Target Platform**: Linux (Azure App Service Linux via `bicep/modules/webapp.bicep`); runs identically on local dev via `dotnet run`
**Project Type**: web-service (single ASP.NET Core minimal API project)  
**Performance Goals**: All endpoints respond in <200ms under normal local use (SC-002) — trivial to meet since all data is in-memory  
**Constraints**: No authentication/authorization (FR-014); no database (FR-011); CORS restricted to a configurable allowed-origins list defaulting to `http://localhost:5173` (FR-012); HTTPS redirection enabled  
**Scale/Scope**: 6 endpoints (status, health, series, episode list, episode by id, episode search); one season's worth of episode records (single-digit count)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| 1. Security-First | Inputs validated at the boundary; no plain-HTTP in prod; no secrets in source | ✅ PASS | Episode id uses the `{id:int}` route constraint so non-numeric input never reaches the handler; `UseHttpsRedirection()` stays enabled; CORS uses an explicit allow-list (`WithOrigins`), never `AllowAnyOrigin` |
| 2. Cloud-Native | IaC via Bicep; tagged resources | ✅ PASS (N/A new infra) | Deploys into the existing App Service (Linux) from feature `001-bicep-deploy`; this feature adds no new Azure resources |
| 3. CI/CD-Driven | Automated build/deploy on merge to `main` | ✅ PASS | Built and deployed by the existing/forthcoming API deploy workflow referenced in `AGENTS.md`; no manual steps |
| 4. Spec-Gated | `spec.md` exists under `specs/<feature-id>/` | ✅ PASS | This plan is generated from `specs/002-sample-app-api/spec.md` |
| 5. Simplicity | Standard libraries preferred; avoid over-engineering | ✅ PASS | Single `Program.cs`, minimal APIs, no repository/service layers, no DB, one extra NuGet package (`Swashbuckle.AspNetCore`) |
| 6. Tested | API routes must have unit/integration tests | ✅ PASS (planned) | `tests/app-api.Tests` covers each acceptance scenario (episode list, episode by id incl. not-found, search incl. case-insensitivity/no-match, series/status/health) via `WebApplicationFactory` |

No violations — Complexity Tracking table intentionally left empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-sample-app-api/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api-contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
└── app-api/                     # ASP.NET Core minimal API (net10.0)
    ├── app-api.csproj           # Microsoft.NET.Sdk.Web + Swashbuckle.AspNetCore
    ├── Program.cs                # single-file: startup, CORS, Swagger, all endpoints
    ├── episodes.json             # local data file (series + episode records)
    ├── appsettings.json           # AllowedOrigins config section (default localhost:5173)
    └── appsettings.Development.json

tests/
└── app-api.Tests/                # xUnit + Microsoft.AspNetCore.Mvc.Testing
    ├── app-api.Tests.csproj
    └── ApiEndpointTests.cs        # integration tests via WebApplicationFactory<Program>
```

**Structure Decision**: Single web-service project. `src/app-api` is the only project this feature needs (the existing reference frontend lives separately in `src-bk/app-web` and is out of scope here). A companion `tests/app-api.Tests` project is added to satisfy Constitution Principle 6 (Tested) without introducing any extra layers inside the API itself.

## Complexity Tracking

> No Constitution Check violations — this section is intentionally empty.
