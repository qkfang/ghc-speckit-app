# Quickstart: Sample App Episode Browser

**Feature**: `002-web-app`  
**Date**: 2026-08-17

These commands apply after the frontend implementation tasks are complete.

## Prerequisites

- Node.js `20.19.0` or newer within Node 20
- npm included with Node.js
- A compatible API implementing [contracts/api-contract.yaml](contracts/api-contract.yaml) when validating live content

The API itself is not part of this feature.

## Install

From the repository root:

```powershell
Set-Location src/app-web
npm ci
```

`package-lock.json` is committed, so use `npm ci` for reproducible local and CI installs.

## Configure the API

The frontend calls `/api` on its own origin by default. During Vite development,
those requests are proxied to the local API on port `5000`.

The local API must be available at `http://localhost:5000`.

To bypass the development proxy and target another API origin, set:

```powershell
$env:VITE_API_URL = "https://api.example.com"
```

`VITE_API_URL` is included in the browser bundle. It must be an origin only, must not include a secret, and must use HTTPS in production. Restart the development server after changing it.

The configured service must provide:

- `GET /api/status`
- `GET /api/series`
- `GET /api/episodes`

## Run Locally

```powershell
npm run dev
```

Open `http://localhost:5173`. The header and loading state should appear immediately, followed by content or a friendly error.

Because the dependency constraint excludes `@vitejs/plugin-react`, component edits may reload the page and reset component state instead of using React Fast Refresh.

## Build

```powershell
npm run build
```

Expected result: Vite exits successfully and writes the production assets to `src/app-web/dist/` with no build errors.

## Preview the Production Build

```powershell
npm run preview
```

Use the URL printed by Vite. The preview still needs access to the configured API origin.

## Acceptance Checks

| Scenario | Setup or action | Expected result |
|----------|-----------------|-----------------|
| Normal success | Return three valid responses | Header, series information, and exactly one card per episode appear. |
| Slow service | Throttle all three requests | Loading feedback appears immediately and remains until the final outcome. |
| Endpoint failure | Fail each endpoint in turn with a network or non-success HTTP result | One friendly error appears; no partial or stale grid appears. |
| Unhealthy service | Return a status other than `running` | Friendly unavailable error appears. |
| Invalid payload | Return malformed JSON or an invalid top-level response | Friendly error appears without a raw exception. |
| Empty catalog | Return `episodes: []` | Series information and the catalog-empty message appear. |
| Missing display field | Return a valid episode with a null, blank, or omitted title, presenter, or status | The card remains and shows `Unavailable` for that value. |
| Matching search | Enter partial title and presenter terms with mixed case and surrounding spaces | Matching cards update in place with no additional request. |
| No search match | Enter an unmatched term, then clear it | Search-specific no-results message appears; clearing restores all cards. |
| Request cancellation | Navigate away or reload while requests are throttled | In-flight requests abort and no stale update warning appears. |
| API configuration | Test an unset URL and a configured URL with a trailing slash | Requests use the correct same-origin or configured paths without double slashes. |
| Accessibility | Use keyboard navigation, a screen reader, a mobile width, and 200% zoom | Search has a visible label, state changes are announced, focus remains stable, and content does not overlap. |

## Definition of Done

- `npm ci` succeeds from a clean checkout.
- `npm run build` exits with zero errors.
- Only `react`, `react-dom`, and `vite` are declared as package dependencies.
- All acceptance checks above pass against a contract-compatible API or controlled browser responses.
- No API implementation or infrastructure change is included in this feature.