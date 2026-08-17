# API Contract: Episode Text Search (updated)

**Feature**: `004-text-search` | **File**: `src/app-api/Program.cs` | **Date**: 2026-08-17

This document supersedes the `GET /api/episodes/search` section of [specs/003-api-app/contracts/api-contract.md](../../003-api-app/contracts/api-contract.md) for this one endpoint. All other endpoints (`/api/status`, `/api/health`, `/api/series`, `/api/episodes`, `/api/episodes/{id}`) are unchanged — see that document for their contracts.

---

## `GET /api/episodes/search`

Keyword and wildcard search across episode `title` and `introduction`.

| | |
|---|---|
| **Query params** | `query` (string, optional) — search term; **replaces** the previous `q` parameter name |
| **Success** | `200 OK` — same shape as `GET /api/episodes`, filtered to matches |

### Matching behavior

| `query` value | Pattern | Matches when... |
|---|---|---|
| omitted, empty, whitespace-only, or exactly `*` | no filter | every episode is returned |
| `*term*` (leading **and** trailing `*`, no other `*` inside) | contains | `title` or `introduction` contains `term` anywhere (case-insensitive) |
| `term*` (trailing `*` only) | starts-with | `title` or `introduction` starts with `term` (case-insensitive) |
| `*term` (leading `*` only) | ends-with | `title` or `introduction` ends with `term` (case-insensitive) |
| any other text, or `*` in any other position (e.g. `te*rm`) | literal | `title` or `introduction` contains the raw `query` text as a plain substring (case-insensitive) — identical to the plain-keyword fallback |

- No matches → `200 OK` with `"episodes": []` (never an error).
- Matches are returned in original order, same as `GET /api/episodes`.

```json
{
  "season": 4,
  "name": "Microsoft Sample App — Season 4",
  "episodes": [ /* zero or more matching Episode objects */ ]
}
```

### Examples

- `GET /api/episodes/search?query=*dan*` → episodes with "dan" anywhere in title or introduction.
- `GET /api/episodes/search?query=dan*` → episodes whose title or introduction starts with "dan".
- `GET /api/episodes/search?query=*dan` → episodes whose title or introduction ends with "dan".
- `GET /api/episodes/search?query=dan` → episodes containing "dan" anywhere (plain substring fallback, same result shape as `*dan*`).
- `GET /api/episodes/search?query=` or `GET /api/episodes/search` → identical to `GET /api/episodes`.

---

## Frontend usage (`src/app-web`)

- The search box's raw value is debounced (~300ms of no typing) into `debouncedSearchTerm`.
- On every change to `debouncedSearchTerm` (including becoming empty), the frontend calls `GET /api/episodes/search?query=${encodeURIComponent(debouncedSearchTerm)}` and replaces the displayed episode list with the response, aborting any still-in-flight previous search request.
- The existing "catalog is empty" vs. "no results for this search" distinction (from feature 002) is preserved: catalog-empty is based on the initial, unfiltered episode count; no-results is based on the current search response being empty while the catalog itself is not.
