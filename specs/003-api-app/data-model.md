# Data Model: Sample App Backend API

**Branch**: `002-app-api` | **Date**: 2026-08-17

Both entities are sourced from a single bundled `episodes.json` file and held in memory for the lifetime of the process. There is no persistence layer and no write path — all data is read-only for this feature.

---

## 1. `Episode`

A single installment of the season, as stored in `episodes.json` and returned by the episode endpoints.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `season` | int | Yes | Season number (e.g. `4`); constant across all episodes in the current dataset |
| `episode` | int | Yes | Episode number; **unique** within the dataset — used as the lookup key for `GET /api/episodes/{id}` |
| `title` | string | Yes | Episode title; searched by `GET /api/episodes/search` |
| `presenter` | string | Yes | Presenter name |
| `introduction` | string | Yes | Long-form description; searched by `GET /api/episodes/search` |
| `youWillLearn` | string[] | Yes (may be empty) | Bullet list of learning outcomes |
| `technologiesUsed` | string[] | Yes (may be empty) | Bullet list of technologies covered |
| `whoShouldAttend` | string[] | Yes (may be empty) | Bullet list of target audiences |
| `status` | string | Yes | Free-text status, e.g. `"available"`, `"upcoming"` |

**Validation rules**:

- `episode` must be unique across the dataset. Duplicate or missing required fields cause the file to be considered malformed.
- If `episodes.json` is missing or fails to deserialize at startup, the API **must fail to start** rather than serve an empty/partial dataset (per spec edge case).
- List fields (`youWillLearn`, `technologiesUsed`, `whoShouldAttend`) default to an empty array if absent in the source file; they are never `null` in API responses.

**Relationships**: Implicitly grouped under a `Series` by matching `season` number; there is no separate join — the API derives the `Series.topics` summary by projecting over all loaded episodes.

**State transitions**: None. Data is static for the lifetime of the running process (reloaded only on process restart).

---

## 2. `Series`

A summary of the show/season being cataloged, returned by `GET /api/series`.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | Series name, e.g. `"Microsoft Sample App"` |
| `season` | int | Yes | Season number |
| `description` | string | Yes | Short description of the season |
| `topics` | `EpisodeTopic[]` | Yes | One entry per loaded episode |

### `EpisodeTopic` (projection, not a standalone stored entity)

| Field | Type | Source |
|-------|------|--------|
| `episode` | int | `Episode.episode` |
| `title` | string | `Episode.title` |
| `presenter` | string | `Episode.presenter` |
| `status` | string | `Episode.status` |

**Validation rules**: `topics` is derived at request time (or once at startup) from the in-memory `Episode` collection — never stored separately, so it can never drift from the episode data.

---

## 3. Query parameter: search term (`q`)

Not a stored entity — a request-time filter applied to the in-memory `Episode` collection.

| Aspect | Rule |
|--------|------|
| Presence | Optional |
| Empty/missing behavior | Treated as "no filter" → identical response to `GET /api/episodes` (FR-007) |
| Matching | Case-insensitive substring (`Contains`) against `title` OR `introduction` (FR-008) |
| No-match behavior | Returns an empty `episodes` array with `200 OK`, never an error (FR-010) |
