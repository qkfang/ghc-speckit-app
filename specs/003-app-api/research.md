# Research: Sample App Backend API

**Branch**: `002-sample-app-api` | **Date**: 2026-08-17

All open questions from the spec were already resolved during `/speckit.clarify` (see `spec.md` → Clarifications). This document records the rationale for those decisions plus the remaining implementation-level choices needed to start building. No `NEEDS CLARIFICATION` markers remain.

---

## 1. Framework & file structure

- **Decision**: ASP.NET Core minimal APIs, single `Program.cs`, targeting `net10.0`.
- **Rationale**: Matches the spec clarification and the existing reference implementation in `src-bk/app-api`, which already targets `net10.0` and is referenced by `AGENTS.md` (`dotnet-version: 10.0.x`). Six simple endpoints don't justify controller/MVC ceremony.
- **Alternatives considered**: Controller-based MVC API — rejected, adds attribute-routing/DI ceremony with no benefit at this scale (violates Simplicity principle).

## 2. Data source

- **Decision**: Bundle `episodes.json` as `Content` with `CopyToOutputDirectory=PreserveNewest`; deserialize once at startup into an in-memory array held for the process lifetime.
- **Rationale**: FR-011 forbids a database; the dataset is static per season and small enough to hold entirely in memory.
- **Alternatives considered**: SQLite/embedded DB — rejected as unnecessary overhead for read-only seasonal content.

## 3. Search implementation

- **Decision**: Case-insensitive substring match — `title.Contains(term, StringComparison.OrdinalIgnoreCase) || introduction.Contains(term, StringComparison.OrdinalIgnoreCase)`. Missing/empty `q` returns the unfiltered list.
- **Rationale**: FR-007/FR-008 explicitly call for a simple `Contains()` match with no external search library.
- **Alternatives considered**: Lucene.NET / full-text search — rejected, massive over-engineering for a single-digit record count.

## 4. CORS configuration

- **Decision**: `AddCors` with a default policy built from `builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()`, falling back to `["http://localhost:5173"]` when unset.
- **Rationale**: FR-012 requires a configurable allow-list defaulting to the Vite dev server origin.
- **Alternatives considered**: `AllowAnyOrigin()` — rejected, weakens the Security-First principle and cannot be combined with credentialed requests if ever needed.

## 5. Interactive API docs

- **Decision**: `Swashbuckle.AspNetCore`, `AddSwaggerGen` + `UseSwagger`/`UseSwaggerUI`, mounted at `/swagger`.
- **Rationale**: FR-013; already proven in `src-bk/app-api` and is the standard, lowest-effort choice for minimal APIs.
- **Alternatives considered**: Hand-written OpenAPI YAML — rejected, more manual upkeep for identical outcome.

## 6. Not-found handling for episodes

- **Decision**: Route uses `{id:int}` so non-numeric ids never reach the handler (framework returns 404 automatically). When the id is numeric but unknown, the handler returns `Results.NotFound(new { error = $"Episode {id} not found" })`.
- **Rationale**: Satisfies FR-006 and the edge case for invalid episode-number formats using one consistent mechanism.
- **Alternatives considered**: Manually parsing `string` id and returning a custom 400 — rejected, adds a second error path for no real benefit; spec says invalid format should get the *same* not-found response as an unknown number.

## 7. Testing approach

- **Decision**: `tests/app-api.Tests` (xUnit) using `Microsoft.AspNetCore.Mvc.Testing`'s `WebApplicationFactory<Program>` to spin up the app in-memory and assert on HTTP responses for each endpoint/scenario.
- **Rationale**: Constitution Principle 6 requires unit/integration tests on API routes. `WebApplicationFactory` needs the `Program` class to be accessible from the test assembly, so `Program.cs` ends with `public partial class Program { }` (the standard minimal-API testing pattern) — this is the only structural change required to keep `Program.cs` testable.
- **Alternatives considered**: No automated tests — rejected, violates the constitution gate.

## 8. JSON casing

- **Decision**: Use ASP.NET Core's default `System.Text.Json` camelCase serialization (no custom `JsonSerializerOptions`).
- **Rationale**: Matches the field names already used in the spec's Key Entities section and in `episodes.json` (`youWillLearn`, `technologiesUsed`, `whoShouldAttend`, etc.).
- **Alternatives considered**: None needed — default behavior already matches requirements.
