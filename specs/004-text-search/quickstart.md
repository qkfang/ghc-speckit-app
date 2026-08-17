# Quickstart: Episode Text Search

## Run locally

```bash
# API
cd src/app-api
dotnet run                 # http://localhost:5151

# Frontend (separate terminal)
cd src/app-web
npm ci && npm run dev      # http://localhost:5173
```

## Build gates (automated)

```bash
cd src/app-api && dotnet build
cd src/app-web && npm run build
```

## Manual acceptance script (backend)

Run these against the local API (adjust the port to match `dotnet run` output) and confirm the described outcome. Replace `dan` with a substring you know appears in your local `episodes.json` title or introduction text.

```bash
# Plain substring fallback (no wildcard) - case-insensitive
curl "http://localhost:5151/api/episodes/search?query=dan"

# Contains: *term*
curl "http://localhost:5151/api/episodes/search?query=*dan*"

# Starts-with: term*
curl "http://localhost:5151/api/episodes/search?query=dan*"

# Ends-with: *term
curl "http://localhost:5151/api/episodes/search?query=*dan"

# Empty term -> all episodes
curl "http://localhost:5151/api/episodes/search?query="

# No matches -> empty array, not an error
curl "http://localhost:5151/api/episodes/search?query=zzzznomatch"

# Middle asterisk -> treated as literal substring (expected: no matches, same as searching for the raw text)
curl "http://localhost:5151/api/episodes/search?query=da*n"
```

Confirm:
- `*dan*`, `dan*`, and `*dan` each return the expected subset (contains / starts-with / ends-with) relative to the plain `dan` result.
- The empty-query response matches `GET /api/episodes` exactly.
- The no-match query returns `"episodes": []` with a `200 OK`.

## Manual acceptance script (frontend)

1. Open `http://localhost:5173` with the API running.
2. Type a known keyword slowly, character by character — confirm the network tab shows only one `/api/episodes/search` request after you pause, not one per keystroke.
3. Type `*term*`, `term*`, and `*term` (using a substring from your data) — confirm the visible episode cards match the corresponding curl result above.
4. Clear the search box — confirm the full episode grid reappears.
5. Type a term that matches nothing — confirm the existing "No episodes match your search" friendly message appears (not a blank grid or error).
6. With the API stopped, type a search term — confirm the existing friendly error state appears instead of a blank or broken grid.
