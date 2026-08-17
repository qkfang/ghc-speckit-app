# Phase 0 Research: Sample App Episode Browser

**Feature**: `002-web-app`  
**Date**: 2026-08-17

## React and Vite Baseline

**Decision**: Use React `18.3.1`, React DOM `18.3.1`, and Vite `8.2.1`, with Node.js `20.19.0` or newer within the repository's Node 20 CI baseline. Pin direct dependency versions and commit `package-lock.json`.

**Rationale**: React `18.3.1` is the final React 18 release. Vite `8.2.1` supports Node `^20.19.0 || >=22.12.0`. Exact direct versions plus `npm ci` and the lockfile make the one-week implementation and CI build reproducible.

**Alternatives considered**:

- React 19 was rejected because the feature explicitly requires React 18 and a major-version change would need its own specification.
- Node 24 LTS is preferable for a new long-lived app because Node 20 is end-of-life, but changing the repository CI baseline is outside this feature. A later maintenance feature should upgrade Node and revalidate Vite.
- Floating version ranges were rejected because they permit avoidable drift between implementation and CI.

## JSX Without a React Plugin

**Decision**: Use Vite's built-in `.jsx` handling and a minimal `vite.config.js` with no plugins. Do not install `@vitejs/plugin-react`.

**Rationale**: Vite transforms JSX without a framework plugin, so the requested source files build with only `react`, `react-dom`, and `vite`. A plugin-free config honors the explicit dependency constraint.

**Alternatives considered**:

- `@vitejs/plugin-react` is the standard route to React Fast Refresh, but it violates the no-new-dependencies requirement.
- Handwritten `React.createElement` calls would avoid JSX transformation but make the page harder to read.
- Omitting `vite.config.js` would also work, but the requested scaffold explicitly includes that file.

**Tradeoff**: Vite development and general hot module replacement remain available, but React Fast Refresh is not. Component edits may reload the page and reset local state during development.

## Minimal Project Scaffold

**Decision**: Create `package.json`, `package-lock.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`, and `src/App.css`. Define `dev`, `build`, and `preview` package scripts.

**Rationale**: This is the smallest conventional Vite/React shape that meets the requested files, keeps bootstrap separate from page behavior, and supports local development, deterministic production builds, and local production preview.

**Alternatives considered**:

- The standard `create-vite` React template was rejected because it adds the prohibited React plugin.
- A component/service directory hierarchy was rejected because one page and three requests do not justify more abstractions.

## React Bootstrap

**Decision**: Mount `App` with one React 18 `createRoot` from `react-dom/client`, wrapped in `StrictMode`.

**Rationale**: `createRoot` is the React 18 client-rendering API. `StrictMode` provides useful development checks, including validating effect cleanup behavior.

**Alternatives considered**:

- Legacy `ReactDOM.render` was rejected because it is superseded in React 18.
- `hydrateRoot` was rejected because this feature has no server-rendered HTML.

## Initial Data Loading

**Decision**: In one mount effect, request `GET /api/status`, `GET /api/series`, and `GET /api/episodes` concurrently with `Promise.all`. Publish page data only after all responses pass HTTP and top-level shape validation and status reports `running`.

**Rationale**: The three requests are independent and all are required to render a trustworthy page. Parallel loading minimizes wait time, while fail-fast behavior matches the requirement to show one friendly error rather than partial content.

**Alternatives considered**:

- Sequential requests were rejected because they add avoidable network latency.
- `Promise.allSettled` was rejected because partial rendering is explicitly outside the desired failure behavior.

## Request Cancellation and UI State

**Decision**: Create one `AbortController` for the mount effect, pass its signal to all requests, and abort during cleanup. Ignore cancellation errors and map all other request, HTTP, health, parsing, and top-level validation failures to one friendly error state. Represent remote content as one discriminated state: `loading`, `ready`, or `error`.

**Rationale**: Cancellation avoids stale state updates and works correctly with React 18 Strict Mode's development effect cycle. One state discriminator prevents impossible combinations such as loading and error appearing together.

**Alternatives considered**:

- An `isMounted` flag was rejected because it suppresses stale updates without cancelling network work.
- Separate loading, data, and error booleans were rejected because they permit contradictory states.

## API Base Configuration

**Decision**: Read `import.meta.env.VITE_API_URL` once, default to an empty string for same-origin calls, remove trailing slashes, and append each `/api/...` path. Proxy same-origin Vite development requests to the local API at `http://localhost:5000`.

**Rationale**: This supports same-origin production hosting and a separately hosted Azure API without malformed double slashes. The development proxy connects to the known local backend without requiring CORS configuration. The optional value is client-visible configuration and must never contain a secret. Production configuration must use HTTPS.

**Alternatives considered**:

- A hard-coded service URL was rejected because it prevents environment promotion.
- A runtime configuration service was rejected as unnecessary for this small feature. Direct cross-origin local requests were rejected because the Vite proxy is simpler and does not require development CORS settings.

## Response Validation and Fallback Values

**Decision**: Check `response.ok` before reading JSON. Require `{ status: "running" }`, a series object with a non-empty string `name`, and `{ episodes: [...] }`. Require each episode to be an object, but normalize a missing or blank `title`, `presenter`, or `status` to `Unavailable` for display.

**Rationale**: `fetch` does not reject for non-success HTTP statuses, and parsed JSON may still be unusable. Small handwritten checks provide adequate boundary validation without another package while preserving the specified per-card fallback behavior.

**Alternatives considered**:

- Blind property access was rejected because malformed responses could crash rendering.
- A schema-validation library was rejected by the dependency constraint and would be disproportionate for three small payloads.
- Rejecting the whole catalog for one missing display string was rejected because the specification requires a friendly fallback on that card.

## Search Behavior

**Decision**: Keep only `searchTerm` in `useState`. During render, trim and lowercase the term and filter loaded episodes by title or presenter. A blank term returns every loaded episode. Do not send search requests or store filtered episodes in state.

**Rationale**: Visible episodes are derived data. Render-time filtering keeps the API collection authoritative, cannot drift out of sync, and is inexpensive at the feature's scale.

**Alternatives considered**:

- Duplicated filtered state and an effect were rejected because they introduce synchronization bugs.
- `useMemo` was rejected because the catalog is small and memoization adds complexity without a measured need.
- Server-side search was rejected because the API is future work and the feature requires loaded results to update locally.

## Accessible Dynamic States

**Decision**: Keep the page `<h1>` visible in every state; give the content region `aria-busy` while loading; use a polite live status for loading, result counts, empty catalog, and no matches; use `role="alert"` for errors; pair the search input with a visible label; and render episodes as a semantic list.

**Rationale**: Dynamic changes become perceivable without moving focus or interrupting typing. Separate empty-catalog and no-search-match messages preserve the feature's state distinctions.

**Alternatives considered**:

- Visual-only spinners and placeholder-only input labels were rejected as inaccessible.
- Assertive announcements for routine search updates were rejected because they would be disruptive.

## Validation Strategy

**Decision**: Use `npm ci` followed by `npm run build` as the automated gate. Manually verify normal success, slow loading, each endpoint failing, unhealthy status, malformed payloads, empty episodes, missing card values, matching and non-matching searches, request cancellation, API URL variants, keyboard use, mobile width, and 200% zoom.

**Rationale**: A production build verifies entry processing, JSX transformation, dependency resolution, and bundling while respecting the dependency cap. The manual matrix covers runtime and accessibility behavior that a build cannot prove.

**Alternatives considered**:

- Adding a unit or browser test framework would improve automation but violates the explicit dependency constraint.
- Treating the build as complete behavioral validation was rejected because it cannot exercise API or interaction states.

## References

- [React versions](https://react.dev/versions)
- [React `createRoot`](https://react.dev/reference/react-dom/client/createRoot)
- [React `useEffect`](https://react.dev/reference/react/useEffect)
- [Vite getting started](https://vite.dev/guide/)
- [Vite JSX support](https://vite.dev/guide/features.html#jsx)
- [Vite environment variables](https://vite.dev/guide/env-and-mode)
- [Vite 8 announcement](https://vite.dev/blog/announcing-vite8)
- [MDN `AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN `Promise.all`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
- [npm lockfiles](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json)