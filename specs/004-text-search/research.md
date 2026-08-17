# Phase 0 Research: Episode Text Search

## 1. Wildcard matching implementation

- **Decision**: Add a small private helper in `Program.cs`, e.g. `MatchesSearchTerm(string text, string term)`, using `string.StartsWith`/`EndsWith`/`Contains` with `StringComparison.OrdinalIgnoreCase`. No leading/trailing `*` → literal `Contains` (existing fallback behavior). Leading `*` only → `EndsWith` on the remainder. Trailing `*` only → `StartsWith` on the remainder. Both → `Contains` on the inner text. Any other `*` placement (middle, or extra stars beyond the outer trim) → literal `Contains` on the raw term, per the spec's edge case.
- **Rationale**: Matches Constitution Principle 5 (Simplicity) and Principle 1 (Security-First — no regex built from untrusted input, so no ReDoS or escaping concerns). Three patterns are simple string operations; no library needed.
- **Alternatives considered**:
  - `Regex.IsMatch` after converting `*` to `.*` — rejected: needs escaping of regex metacharacters in the rest of the term to avoid unintended regex behavior or performance issues (ReDoS surface), and adds complexity far beyond the three documented patterns.
  - A NuGet globbing/fuzzy-search library (e.g. `Microsoft.Extensions.FileSystemGlobbing`, fuzzy search packages) — rejected: over-engineering for three simple prefix/suffix/contains patterns; violates Simplicity principle and adds an unnecessary dependency.

## 2. Debounce mechanism

- **Decision**: Plain React `useEffect` + `setTimeout`/`clearTimeout` to derive a `debouncedSearchTerm` state from `searchTerm`, delay ~300ms (a conventional responsive-UI debounce value; no specific value was mandated by the spec).
- **Rationale**: Zero new dependencies, consistent with the existing `App.jsx` pattern of native browser APIs (`fetch`, `AbortController`) and Constitution Principle 5 (Simplicity) and the frontend's explicit "no dependencies beyond React, React DOM, and Vite" constraint carried over from feature 002.
- **Alternatives considered**:
  - `lodash.debounce` / `use-debounce` npm package — rejected: adds a dependency for something 5 lines of `useEffect` already solves.
  - Debouncing via a ref-based manual timer without state — rejected: less idiomatic in React function components; the `useEffect` + state approach is the standard, easily testable pattern.

## 3. Query parameter naming (`q` → `query`)

- **Decision**: Rename the existing `/api/episodes/search` query parameter from `q` to `query`, matching the name used throughout the feature's user description and this spec.
- **Rationale**: This is the only consumer of the endpoint (the app's own frontend); no external/third-party callers are documented. Renaming now, while the endpoint is already being extended, avoids carrying two parameter names or a confusing alias.
- **Alternatives considered**: Keep `q` and let the frontend send `q` — rejected: contradicts the explicit `query` naming in the approved spec; renaming has no meaningful compatibility cost since the endpoint has no known external consumers.

## 4. Handling stale/out-of-order search responses

- **Decision**: Use one `AbortController` per search effect run — abort the previous controller when a new debounced term triggers a fetch, and ignore `AbortError` in the catch handler (same pattern already used for the initial load). This naturally guarantees only the latest request's results are ever applied.
- **Rationale**: Reuses an existing, proven pattern in this codebase; no additional state (like a request-id counter) is needed since aborted fetches never resolve `.then()`.
- **Alternatives considered**: A monotonically increasing request-id ref compared on response — rejected as redundant given `AbortController` already provides the same guarantee with less code.

## 5. Empty search term behavior

- **Decision**: The frontend always calls the search endpoint with whatever `debouncedSearchTerm` currently is, including an empty string; the backend already treats an empty/whitespace `query` as "no filter, return all" (existing behavior, now also explicitly covered by FR-006).
- **Rationale**: One code path for every search-term state (empty or not) keeps the frontend simple and automatically satisfies SC-005 (clearing the box behaves like a normal search in terms of response time and code path).
- **Alternatives considered**: Special-case empty term client-side to reuse the already-loaded initial episode list without a network call — rejected: adds a branch/special case for a marginal request-count savings, contradicting Simplicity.

## 6. Testing approach

- **Decision**: No new automated test project. Use `dotnet build` and `npm run build` as compile gates, plus a manual curl/browser acceptance script documented in `quickstart.md` covering every acceptance scenario in `spec.md`.
- **Rationale**: `tests/app-api.Tests` exists as an empty directory with no project file — feature 003's plan intended to add xUnit tests but none were ever committed. Scaffolding a full test project is out of scope for this focused, fast-turnaround change per the repo's `copilot-instructions.md` guidance to keep iteration fast and not over-invest in process for a demo app; it's tracked as a pre-existing gap rather than new debt introduced by this feature.
- **Alternatives considered**: Add an xUnit project now — rejected for this feature's scope; would be better addressed as its own small feature/spec if desired later.
