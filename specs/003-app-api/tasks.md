---

description: "Task list for Sample App Backend API"
---

# Tasks: Sample App Backend API

**Input**: Design documents from `/specs/002-app-api/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/api-contract.md](./contracts/api-contract.md), [quickstart.md](./quickstart.md)

**Tests**: Included — the constitution's "Tested" gate (Principle 6) and plan.md require a `tests/app-api.Tests` xUnit project covering every endpoint.

**Organization**: Tasks are grouped by user story (US1 = Browse Episodes, US2 = Search, US3 = Series Info & Status) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single web-service project per plan.md:
- API: `src/app-api/`
- Tests: `tests/app-api.Tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the project skeletons referenced by `speckit-app.sln` and the shared data file

- [X] T001 Create `src/app-api/app-api.csproj` (Microsoft.NET.Sdk.Web, `TargetFramework=net10.0`, `Nullable=enable`, `ImplicitUsings=enable`) with `PackageReference Swashbuckle.AspNetCore` and a `Content` item for `episodes.json` with `CopyToOutputDirectory=PreserveNewest`
- [X] T002 [P] Create `src/app-api/appsettings.json` and `src/app-api/appsettings.Development.json` with an `AllowedOrigins` array section defaulting to `["http://localhost:5173"]`
- [X] T003 [P] Create `src/app-api/episodes.json` with Season 4 episode records (fields: `season`, `episode`, `title`, `presenter`, `introduction`, `youWillLearn`, `technologiesUsed`, `whoShouldAttend`, `status` per [data-model.md](./data-model.md)), adapted from `src-bk/app-api/episodes.json`
- [X] T004 Create `tests/app-api.Tests/app-api.Tests.csproj` (xUnit + `Microsoft.AspNetCore.Mvc.Testing`) with a project reference to `src/app-api/app-api.csproj`
- [X] T005 Add `src/app-api/app-api.csproj` (already referenced) and add `tests/app-api.Tests/app-api.Tests.csproj` to `speckit-app.sln`

**Checkpoint**: Both projects build (`dotnet build`) with no source files yet beyond scaffolding

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core `Program.cs` bootstrap that every endpoint and every test depends on

**⚠️ CRITICAL**: No user story endpoint can be implemented until this phase is complete

- [X] T006 In `src/app-api/Program.cs`, create `WebApplication.CreateBuilder(args)`, read `AllowedOrigins` from configuration (fallback `["http://localhost:5173"]`), and register a default CORS policy via `AddCors`/`WithOrigins(...).AllowAnyMethod().AllowAnyHeader()` (depends on T001, T002)
- [X] T007 In `src/app-api/Program.cs`, add `AddEndpointsApiExplorer()` + `AddSwaggerGen()` (title "Sample App API", v1) and, after `builder.Build()`, call `UseSwagger()`/`UseSwaggerUI(RoutePrefix = "swagger")` (depends on T006)
- [X] T008 In `src/app-api/Program.cs`, wire up the middleware pipeline in order: `app.UseCors()`, `app.UseHttpsRedirection()` (depends on T006, T007)
- [X] T009 In `src/app-api/Program.cs`, load `episodes.json` from `app.Environment.ContentRootPath` at startup into an in-memory `Episode[]` (deserialize with `System.Text.Json`); throw/fail startup if the file is missing or fails to deserialize (depends on T003, T008)
- [X] T010 In `src/app-api/Program.cs`, append `public partial class Program { }` after `app.Run()` so `WebApplicationFactory<Program>` can load the app from `tests/app-api.Tests` (depends on T009)

**Checkpoint**: App builds and runs (`dotnet run` serves `/swagger` with no content endpoints yet) — user story implementation can now begin

---

## Phase 3: User Story 1 - Browse Episodes for the Season (Priority: P1) 🎯 MVP

**Goal**: A visitor can list every episode and fetch a single episode's details by number, with a clear not-found response for unknown numbers

**Independent Test**: `GET /api/episodes` returns every season episode; `GET /api/episodes/{validId}` returns only that episode; `GET /api/episodes/{unknownId}` returns 404 (not a 500)

### Tests for User Story 1

- [X] T011 [P] [US1] Integration tests in `tests/app-api.Tests/EpisodesEndpointsTests.cs` using `WebApplicationFactory<Program>`: `GET /api/episodes` returns all episodes with `season`/`name`/`episodes` shape; `GET /api/episodes/{id}` with a valid id returns that episode's details; `GET /api/episodes/{id}` with an unknown id returns `404` with an `error` message (depends on T010)

### Implementation for User Story 1

- [X] T012 [US1] Implement `GET /api/episodes` in `src/app-api/Program.cs` returning `{ season, name, episodes }` from the in-memory episode array, tagged `.WithName("GetEpisodes").WithTags("Content")` (depends on T010)
- [X] T013 [US1] Implement `GET /api/episodes/{id:int}` in `src/app-api/Program.cs` returning the matching episode or `Results.NotFound(new { error = $"Episode {id} not found" })`, tagged `.WithName("GetEpisodeById").WithTags("Content")` (depends on T012)

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP

---

## Phase 4: User Story 2 - Search Episodes by Keyword (Priority: P2)

**Goal**: A visitor can search episodes by a keyword matched against title or description, case-insensitively, with an optional query term and empty-list-not-error semantics

**Independent Test**: Searching a term present in a title/introduction returns matching episodes; searching in a different case still matches; searching a term with no matches returns an empty `episodes` array; omitting `q` returns the same result as `GET /api/episodes`

### Tests for User Story 2

- [X] T014 [P] [US2] Integration tests in `tests/app-api.Tests/SearchEndpointTests.cs`: match by title, match by introduction, case-insensitive match, no-match returns empty `episodes` array (not an error), omitted/empty `q` returns the same result as `GET /api/episodes`, and response shape matches the episode-list shape (depends on T010)

### Implementation for User Story 2

- [X] T015 [US2] Implement `GET /api/episodes/search` in `src/app-api/Program.cs` with optional `string? q` query param: when `q` is null/empty return the full episode list; otherwise filter using `title.Contains(q, StringComparison.OrdinalIgnoreCase) || introduction.Contains(q, StringComparison.OrdinalIgnoreCase)`; return the same `{ season, name, episodes }` shape, tagged `.WithName("SearchEpisodes").WithTags("Content")` (depends on T012)

**Checkpoint**: User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 - View Series Info and System Status (Priority: P3)

**Goal**: A visitor or operator can retrieve series/season summary info, and confirm the API is running via status/health endpoints

**Independent Test**: `GET /api/series` includes name, season, description, and topics; `GET /api/status` includes environment and timestamp; `GET /api/health` includes healthy status and uptime

### Tests for User Story 3

- [X] T016 [P] [US3] Integration tests in `tests/app-api.Tests/SeriesStatusHealthTests.cs`: `GET /api/series` includes `name`, `season`, `description`, `topics`; `GET /api/status` includes `status`, `environment`, `timestamp`; `GET /api/health` includes `status`, `uptime`, `timestamp` (depends on T010)

### Implementation for User Story 3

- [X] T017 [US3] Implement `GET /api/status` in `src/app-api/Program.cs` returning `{ status = "running", environment = app.Environment.EnvironmentName, timestamp }`, tagged `.WithName("GetStatus").WithTags("System")` (depends on T010)
- [X] T018 [US3] Implement `GET /api/health` in `src/app-api/Program.cs` returning `{ status = "healthy", uptime = Environment.TickCount64 / 1000.0, timestamp }`, tagged `.WithName("GetHealth").WithTags("System")` (depends on T017)
- [X] T019 [US3] Implement `GET /api/series` in `src/app-api/Program.cs` returning `{ name, season, description, topics }`, projecting `topics` (`episode`, `title`, `presenter`, `status`) from the in-memory episode array, tagged `.WithName("GetSeries").WithTags("Content")` (depends on T012, T018)

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all endpoints

- [X] T020 Run `dotnet test` in `tests/app-api.Tests` and confirm all tests from T011, T014, T016 pass
- [X] T021 Execute [quickstart.md](./quickstart.md) end-to-end: `dotnet run` the API, browse `/swagger`, curl every endpoint (status, health, series, episodes, episode by id, search, unknown episode 404), then start the frontend on `http://localhost:5173` and confirm zero CORS errors in devtools

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001–T005) — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational (T006–T010) completion
  - US1 (T011–T013) has no dependency on US2/US3
  - US2 (T014–T015) reuses the episode array/shape from US1 (T012) but is independently testable
  - US3 (T016–T019) reuses the episode array from US1 (T012) but is independently testable
- **Polish (Phase 6)**: Depends on all three user stories being complete

### Within Each User Story

- Tests are written first (and should fail before implementation exists)
- `GET /api/episodes` (T012) precedes `GET /api/episodes/{id}` (T013), search (T015), and series (T019) since they all read the same in-memory array populated once in Foundational

### Parallel Opportunities

- T002 and T003 (Setup) can run in parallel — different files
- T011, T014, T016 (test files for each story) can be authored in parallel — different files, once T010 is done
- Once Foundational (T006–T010) completes, US1, US2, and US3 test-writing can start in parallel; implementation tasks touch the shared `Program.cs` so should be applied sequentially in priority order (US1 → US2 → US3) to avoid merge conflicts

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006–T010)
3. Complete Phase 3: User Story 1 (T011–T013)
4. **STOP and VALIDATE**: `dotnet test`, then `dotnet run` + curl `/api/episodes` and `/api/episodes/{id}`
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → test independently → MVP demo
3. Add User Story 2 (search) → test independently → demo
4. Add User Story 3 (series/status/health) → test independently → demo
5. Phase 6 Polish → full quickstart validation
