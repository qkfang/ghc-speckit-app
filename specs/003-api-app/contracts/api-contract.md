# API Contract: Sample App Backend API

**Feature**: `002-app-api` | **File**: `src/app-api/Program.cs` | **Date**: 2026-08-17

This document defines the public HTTP interface exposed by the API: every route, its parameters, response shape, and status codes. Full interactive documentation is also served at `/swagger` (Swashbuckle/OpenAPI) once the app is running.

---

## Cross-cutting behavior

- **Base URL (local dev)**: `https://localhost:<port>` (HTTPS redirection enabled)
- **CORS**: Allowed origins come from configuration key `AllowedOrigins` (string array), defaulting to `["http://localhost:5173"]`. All methods/headers are allowed for those origins.
- **Auth**: None — every endpoint below is publicly accessible (FR-014).
- **Content type**: `application/json` for all responses.

---

## `GET /api/status`

Runtime status for operators.

| | |
|---|---|
| **Query params** | none |
| **Success** | `200 OK` |

```json
{
  "status": "running",
  "environment": "Development",
  "timestamp": "2026-08-17T12:00:00.000Z"
}
```

---

## `GET /api/health`

Health check with uptime.

| | |
|---|---|
| **Query params** | none |
| **Success** | `200 OK` |

```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2026-08-17T12:00:00.000Z"
}
```

`uptime` is elapsed seconds since the process started.

---

## `GET /api/series`

Series/season summary.

| | |
|---|---|
| **Query params** | none |
| **Success** | `200 OK` |

```json
{
  "name": "Microsoft Sample App",
  "season": 4,
  "description": "...",
  "topics": [
    { "episode": 1, "title": "...", "presenter": "...", "status": "available" }
  ]
}
```

---

## `GET /api/episodes`

Full list of episodes for the season.

| | |
|---|---|
| **Query params** | none |
| **Success** | `200 OK` |

```json
{
  "season": 4,
  "name": "Microsoft Sample App — Season 4",
  "episodes": [ /* Episode objects, see data-model.md */ ]
}
```

---

## `GET /api/episodes/{id}`

Single episode by episode number.

| | |
|---|---|
| **Path params** | `id` (int, required) — episode number |
| **Success** | `200 OK` — the `Episode` object |
| **Not found** | `404 Not Found` — `{ "error": "Episode {id} not found" }` when `id` is a valid integer but no episode matches, **or** when `id` is not a valid integer (route constraint `{id:int}` means non-numeric values never match the route and ASP.NET Core returns 404) |

---

## `GET /api/episodes/search`

Keyword search across title and introduction.

| | |
|---|---|
| **Query params** | `q` (string, optional) — search term |
| **Success** | `200 OK` — same shape as `GET /api/episodes`, filtered to matches |

Behavior:

- `q` omitted or empty → identical response to `GET /api/episodes` (no filter applied).
- `q` provided → case-insensitive substring match against `title` OR `introduction`; matches returned in original order.
- No matches → `200 OK` with `"episodes": []` (never an error).

```json
{
  "season": 4,
  "name": "Microsoft Sample App — Season 4",
  "episodes": [ /* zero or more matching Episode objects */ ]
}
```

---

## Interactive documentation

- **Swagger UI**: `GET /swagger` — browsable, try-it-out docs for every route above (FR-013, SC-001).
- **OpenAPI document**: `GET /swagger/v1/swagger.json`.
