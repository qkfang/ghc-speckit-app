---

description: "Task list for Episode Text Search"
---

# Tasks: Episode Text Search

**Input**: Design documents from `specs/004-text-search/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/search-contract.md](./contracts/search-contract.md), [quickstart.md](./quickstart.md)

**Tests**: Not included as separate automated test tasks — per `plan.md`, no xUnit test project exists yet for `src/app-api` (a pre-existing gap from feature 003, not introduced here) and the frontend has no test framework beyond `npm run build`. Validation instead uses the compile gates and the manual acceptance script in `quickstart.md`.

**Organization**: Tasks are grouped by user story (US1 = Find Episodes by Keyword, US2 = Narrow Results with Wildcard Patterns, US3 = Smooth, Responsive Typing Experience) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Existing single-API/single-SPA project per plan.md — no new projects:
- API: `src/app-api/Program.cs`
- Frontend: `src/app-web/src/App.jsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm a clean starting point before touching the shared search endpoint and search box

- [X] T001 Confirm baseline builds pass: `dotnet build` in `src/app-api` and `npm run build` in `src/app-web`, establishing a clean starting point before modifying `Program.cs` and `App.jsx`

**Checkpoint**: Both projects build cleanly before any change is made

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Rename the shared query parameter and extract the matching logic that every user story depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 In `src/app-api/Program.cs`, rename the `GET /api/episodes/search` query parameter from `q` to `query`, updating the handler signature and every internal reference (depends on T001)
- [X] T003 In `src/app-api/Program.cs`, extract the existing inline match check into a private `MatchesSearchTerm(string text, string term)` helper: treat a null/empty/whitespace `term` (or a lone `*`) as "matches everything", otherwise perform the existing case-insensitive `Contains` check; call this helper against `title` OR `introduction` for each episode in the search endpoint (depends on T002)

**Checkpoint**: `GET /api/episodes/search?query=...` responds with the renamed parameter and preserves existing plain-substring semantics — ready for user story work

---

## Phase 3: User Story 1 - Find Episodes by Keyword (Priority: P1) 🎯 MVP

**Goal**: Replace the frontend's client-side title/presenter filter with calls to the backend search endpoint, so typed keywords are matched against episode title or description by the server

**Independent Test**: Type a plain keyword (no `*`) known to appear in an episode's title or description and confirm only matching episodes are shown; confirm case-insensitivity; confirm clearing the box shows the full catalog again

### Implementation for User Story 1

- [X] T004 [US1] In `src/app-web/src/App.jsx`, remove the local `visibleEpisodes` derived-filter logic and add a `searchState` state populated by a new effect that fetches `` `/api/episodes/search?query=${encodeURIComponent(debouncedSearchTerm)}` `` whenever the debounced term changes, using one `AbortController` per request and ignoring `AbortError` in the catch handler (depends on T003)
- [X] T005 [US1] In `src/app-web/src/App.jsx`, keep the original `/api/episodes` response from the initial `Promise.all` load only to determine whether the catalog itself is empty (`catalogIsEmpty`), and render the episode grid and "No episodes match your search" state from the new `searchState` instead of the removed local filter (depends on T004)
- [X] T006 [US1] In `src/app-web/src/App.jsx`, update the search input's `label` and `placeholder` text from "Title or presenter" to reflect the new match fields ("Title or description"), matching the backend's title/introduction matching (depends on T004)
- [X] T012 [US1] In `src/app-web/src/App.jsx` and `src/app-web/src/App.css`, add a scoped `search-error-state` (role="alert") shown only in the results area when a search request fails (non-abort error), keeping the header/series panel visible and hiding the stale grid — closes the FR-009/SC-006 coverage gap flagged by `/speckit.analyze` (depends on T004, T005)

**Checkpoint**: Plain-keyword search now round-trips through the backend end to end — User Story 1 is independently testable and functional as the MVP

---

## Phase 4: User Story 2 - Narrow Results with Wildcard Patterns (Priority: P2)

**Goal**: Extend the backend matching helper to support `*term*` (contains), `term*` (starts-with), and `*term` (ends-with) wildcard patterns

**Independent Test**: Search `*dan*`, `dan*`, and `*dan` against known episode data and confirm each returns the expected contains/starts-with/ends-with subset; confirm a term with a `*` in another position (e.g. `da*n`) falls back to the same literal-substring behavior as a plain keyword

### Implementation for User Story 2

- [X] T007 [US2] In `src/app-api/Program.cs`, extend `MatchesSearchTerm` to detect a leading and/or trailing `*` with no other `*` inside the trimmed core: both present → `Contains` on the inner text; trailing only → `StartsWith` on the text before it; leading only → `EndsWith` on the text after it; any other `*` placement → fall back to the existing literal `Contains` on the raw term (depends on T003)

**Checkpoint**: The backend supports all three wildcard shapes plus the literal fallback — User Story 1 and User Story 2 both work independently (T007 only touches `Program.cs` and can be built in parallel with Phase 3's frontend tasks)

---

## Phase 5: User Story 3 - Smooth, Responsive Typing Experience (Priority: P3)

**Goal**: Debounce the search box so continuous typing does not send a request per keystroke, and guarantee that only the most recently typed term's results are ever shown

**Independent Test**: Type several characters in quick succession and confirm only one search request is sent after typing pauses; change the term again before an earlier request resolves and confirm only the latest term's results are displayed

### Implementation for User Story 3

- [X] T008 [US3] In `src/app-web/src/App.jsx`, add a `debouncedSearchTerm` state and a `useEffect` that sets a ~300ms `setTimeout` on every `searchTerm` change, clearing the previous timeout on cleanup so only a single update fires after typing pauses (depends on T004)
- [X] T009 [US3] In `src/app-web/src/App.jsx`, the search-request effect from T004 depends on `debouncedSearchTerm` (not the raw `searchTerm`) and aborts the previous request's `AbortController` before starting a new one so a slower, stale response can never overwrite a newer one (depends on T008)

**Checkpoint**: All three user stories are independently functional — typing feels responsive and displayed results never go stale

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across both modified files

- [X] T010 Run `dotnet build` in `src/app-api` and `npm run build` in `src/app-web` to confirm both projects compile cleanly with all changes applied
- [X] T011 Execute the manual acceptance script in [quickstart.md](./quickstart.md) end to end — backend curl script (plain, `*term*`, `term*`, `*term`, empty, no-match, middle-`*`) and frontend browser steps (debounce, wildcard patterns, clearing, no-results, error state) — and confirm every scenario from `spec.md` passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001) — BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational (T002-T003) completion
  - US1 (T004-T006) touches only `App.jsx` and has no dependency on US2
  - US2 (T007) touches only `Program.cs` and is independently testable and implementable in parallel with US1
  - US3 (T008-T009) touches only `App.jsx` and depends on US1's T004 (the search-request effect it modifies)
- **Polish (Phase 6)**: Depends on all three user stories being complete

### Within Each User Story

- US1: T004 (fetch effect) before T005 (render wiring) and T006 (copy update), since both build on the state T004 introduces
- US3: T008 (debounce state) before T009 (rewire the fetch effect to use it)

### Parallel Opportunities

- T007 (US2, `Program.cs`) can be implemented in parallel with T004-T006 (US1, `App.jsx`) once Foundational is complete, since they touch different files
- T004, T005, and T006 all touch `App.jsx` and should be applied sequentially to avoid merge conflicts
- T008 and T009 both touch `App.jsx` and depend on T004, so they follow US1 sequentially

---

## Parallel Example: Foundational Complete

```bash
# After T001-T003, these two streams can proceed in parallel:
Stream A (US2, backend): T007 in src/app-api/Program.cs
Stream B (US1, frontend): T004 -> T005 -> T006 in src/app-web/src/App.jsx
# US3 (T008 -> T009) follows Stream B once T004 lands
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002-T003)
3. Complete Phase 3: User Story 1 (T004-T006)
4. **STOP and VALIDATE**: Manually search a plain keyword against the running app and confirm results and clearing behavior
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → shared endpoint renamed and ready
2. Add User Story 1 → plain-keyword search round-trips through the backend (MVP)
3. Add User Story 2 → wildcard patterns narrow/broaden results
4. Add User Story 3 → typing feels responsive and results never go stale
5. Polish → build gates plus full manual acceptance script

---

## Notes

- `[P]` tasks touch different files with no dependency on unfinished work
- `[US1]`/`[US2]`/`[US3]` map tasks directly to `spec.md` user stories for traceability
- No new dependencies, projects, or test frameworks are introduced (Constitution Principle 5, Simplicity)
- Commit after each task or logical group; stop at any checkpoint to validate a story independently
