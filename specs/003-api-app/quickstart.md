# Quickstart: Sample App Backend API

**Feature**: `002-app-api` | **Date**: 2026-08-17

Get the API running locally and exercise every endpoint in a few minutes.

---

## Prerequisites

- .NET SDK `10.0.x` installed (`dotnet --version`)
- Repository cloned, working directory at repo root

---

## Step 1 — Run the API

```powershell
cd src/app-api
dotnet run
```

The console output prints the listening URL, e.g. `http://localhost:5151` and `https://localhost:7xxx`.

---

## Step 2 — Open interactive docs

Navigate to `https://localhost:<port>/swagger` in a browser. Every endpoint from
[contracts/api-contract.md](./contracts/api-contract.md) is listed and can be tried directly from the page (SC-001).

---

## Step 3 — Try the endpoints with curl

```powershell
# Status & health
curl https://localhost:<port>/api/status
curl https://localhost:<port>/api/health

# Series info
curl https://localhost:<port>/api/series

# All episodes
curl https://localhost:<port>/api/episodes

# Single episode
curl https://localhost:<port>/api/episodes/1

# Unknown episode -> 404 not-found
curl -i https://localhost:<port>/api/episodes/999

# Search (case-insensitive substring on title/introduction)
curl "https://localhost:<port>/api/episodes/search?q=copilot"

# Empty/omitted search term -> same as GET /api/episodes
curl "https://localhost:<port>/api/episodes/search"
```

---

## Step 4 — Confirm the frontend can call it (CORS)

With the API running, start the Vite dev server in another terminal:

```powershell
cd src-bk/app-web
npm ci
npm run dev   # http://localhost:5173
```

Open the app in the browser and confirm requests to the API succeed with no cross-origin errors in the devtools console (SC-005). The API's default `AllowedOrigins` already includes `http://localhost:5173`; override it via `appsettings.Development.json` or an environment variable if the frontend runs on a different port.

---

## Step 5 — Run the tests

```powershell
cd tests/app-api.Tests
dotnet test
```

All tests should pass, covering: episode list, episode by id (found + not-found), search (match, case-insensitivity, no-match), series info, status, and health.
