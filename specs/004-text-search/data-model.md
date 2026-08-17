# Data Model: Episode Text Search

No new persisted entities are introduced. This feature adds one conceptual, transient value and reuses the existing `Episode` shape unchanged.

## Search Term (transient, request-scoped)

Not persisted — exists only as the current value of the search box and the corresponding `query` request parameter.

| Field | Type | Notes |
|-------|------|-------|
| `raw` | string | Exactly what the visitor typed, before any processing. |
| `pattern` | one of `empty`, `contains` (`*term*`), `starts-with` (`term*`), `ends-with` (`*term`), `literal` (no wildcard, or an unsupported `*` placement) | Derived by the backend from `raw` at request time; not stored or returned to the client. |

**Validation / derivation rules** (implemented as the `MatchesSearchTerm` helper, see [research.md](research.md)):

- Empty or whitespace-only `raw`, or `raw == "*"` → `pattern = empty` → matches every episode.
- `raw` starts and ends with `*` (length ≥ 2) and contains no other `*` in between → `pattern = contains`, using the text between the outer `*` characters.
- `raw` ends with `*` only (no leading `*`) → `pattern = starts-with`, using the text before the trailing `*`.
- `raw` starts with `*` only (no trailing `*`) → `pattern = ends-with`, using the text after the leading `*`.
- Any other placement of `*` (e.g., in the middle, or extra stars beyond the outer pair) → `pattern = literal`, matching the same as a term with no wildcard at all (raw text, case-insensitive substring).
- All comparisons are case-insensitive (`StringComparison.OrdinalIgnoreCase`).

## Episode (unchanged)

Reused as-is from feature 003 (`specs/003-api-app/data-model.md`): `season`, `episode`, `title`, `presenter`, `introduction`, `youWillLearn`, `technologiesUsed`, `whoShouldAttend`, `status`. This feature only changes *how* episodes are selected (matching `title` OR `introduction` against the derived Search Term pattern), not the shape of the entity itself.
