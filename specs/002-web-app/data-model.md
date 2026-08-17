# Data Model: Sample App Episode Browser

**Feature**: `002-web-app`  
**Date**: 2026-08-17

## Overview

The frontend has no persistent storage. It reads three remote payloads once, keeps the resulting page data and search term in browser memory, and derives the visible episode list during render.

## Remote Entities

### Service Status

Represents whether the future API is ready to supply the page's required content.

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `status` | string | Yes | The frontend accepts `running`; any other value is treated as unavailable. |
| `environment` | string | No | Informational only; not required for display. |
| `timestamp` | date-time string | No | Informational only; not required for display. |
| `speckit` | object | No | Informational metadata ignored by this frontend. |

### Series

Represents the featured Sample App series displayed above the catalog.

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `seriesId` | string | No | Optional stable series identifier; not required by this feature's UI. |
| `name` | string | Yes | Non-empty display name. |
| `season` | integer | Yes | Positive season number. |
| `url` | URI string | No | Optional external series URL; not required by this feature's UI. |
| `description` | string | No | Optional descriptive copy for the series section. |
| `topics` | Episode Summary array | No | May be present for compatibility; the catalog uses the episodes endpoint as its source of truth. |

### Episode Collection

Represents the response envelope returned by the episodes endpoint.

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `season` | integer | Yes | Positive season number and expected to match the featured series. |
| `name` | string | Yes | Non-empty collection label. |
| `episodes` | Episode array | Yes | May be empty; an empty array is a valid catalog-empty state. |

### Episode

Represents one card in the catalog.

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `season` | integer | Yes | Positive season number. |
| `episode` | integer | Yes | Positive episode number; unique within a season and used as the stable card identity. |
| `title` | string or null | No | Blank, null, or missing values display as `Unavailable`. Used for search when non-blank. |
| `presenter` | string or null | No | Blank, null, or missing values display as `Unavailable`. Used for search when non-blank. |
| `status` | string or null | No | Blank, null, or missing values display as `Unavailable`. |
| Additional fields | any | No | Rich episode detail fields may be returned and are ignored by this feature. |

### Episode Summary

Represents optional topic data nested in the series response. It contains `episode`, `title`, `presenter`, and `status` under the same display-value rules as an Episode, but is not used to populate the card grid.

## Client State

### Remote Content State

One discriminated state prevents contradictory combinations.

| Variant | Fields | Meaning |
|---------|--------|---------|
| `loading` | `kind` | All three initial requests are in progress. |
| `ready` | `kind`, `series`, `episodes` | Every request and top-level payload check succeeded. |
| `error` | `kind` | A network, HTTP, health, parsing, or top-level validation failure occurred. Raw errors are not retained for display. |

### Search Term

| Field | Type | Initial value | Rules |
|-------|------|---------------|-------|
| `searchTerm` | string | Empty string | Controlled input value stored with `useState`; never sent to the API or persisted. |

### Visible Episodes

Derived from the ready state's `episodes` collection and `searchTerm`.

1. Trim the search term and compare in a case-insensitive manner.
2. A blank term returns every loaded episode.
3. A non-blank term returns episodes whose non-blank title or presenter contains the term.
4. Do not store this collection in component state.

## Relationships

- Service Status gates publication of Series and Episode Collection data.
- One Series describes one season and relates to zero or more Episodes for that season.
- Episode Collection owns the ordered list used to render cards.
- Search Term filters Episode Collection into Visible Episodes without modifying either source.

## Validation and Normalization

- All three responses must have successful HTTP status codes and valid JSON.
- Status must be an object whose `status` is `running`.
- Series must be an object with a non-empty `name` and a positive integer `season`.
- Episode Collection must be an object with a positive integer `season`, a non-empty `name`, and an `episodes` array.
- Every episode entry must be an object with positive integer `season` and `episode` values.
- A malformed top-level payload or episode identity causes the whole load to enter `error`.
- Missing display strings do not reject an otherwise valid episode; render them as `Unavailable`.
- Additional response properties are allowed and ignored.

## State Transitions

```text
initial -> loading
loading -> ready   (all requests, health, and validation succeed)
loading -> error   (any required request or validation fails)
loading -> removed (component unmount aborts requests; no state update)

ready + blank search + episodes       -> full catalog
ready + matching search + episodes    -> filtered catalog
ready + non-matching search + episodes -> no-search-results
ready + empty episodes                -> empty catalog
```

Search changes never transition remote content back to `loading` and never trigger a network request.