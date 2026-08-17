---
feature: 002-sample-app-api
risk: low
breaking: false
reviewer-team: spec-reviewer
---

# Feature Specification: Sample App Backend API

**Feature Branch**: `002-sample-app-api`
**Created**: 2026-08-17
**Status**: Draft
**Input**: User description: "Build the Sample App backend API from scratch in `src/app-api`. New endpoints for status, health, series info, episode listing, episode detail, and episode search. Data comes from a local file. Must be callable from the frontend on http://localhost:5173. Must have interactive API docs."

## Clarifications

### Session 2026-08-17

- Q: What implementation structure and target framework should the API use? → A: .NET minimal APIs in a single Program.cs, matching the target framework already used elsewhere in this solution.
- Q: What are the exact Episode entity fields? → A: season, episode, title, presenter, introduction, youWillLearn, technologiesUsed, whoShouldAttend, status.
- Q: What happens when the search query parameter is omitted? → A: It is optional; omitting it returns all episodes (same as GET /api/episodes).
- Q: What search matching approach should be used? → A: Simple case-insensitive Contains(), no external search library.
- Q: How are allowed CORS origins configured? → A: Configurable, defaulting to http://localhost:5173.
- Q: What is the authentication and data storage approach? → A: No authentication and no database for this demo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Episodes for the Season (Priority: P1)

A visitor to the Sample App frontend wants to see the full list of episodes for the season, and drill into a specific episode to read its details.

**Why this priority**: This is the core content of the application. Without episode browsing, there is nothing for the frontend to display — every other endpoint supports or complements this primary journey.

**Independent Test**: Can be fully tested by requesting the episode list endpoint and confirming all season episodes are returned, then requesting a specific episode by its number and confirming its details match, and confirming an unknown episode number returns a clear not-found response instead of a server error.

**Acceptance Scenarios**:

1. **Given** the season's episode data is loaded, **When** a client requests all episodes, **Then** the response contains every episode for the season with its identifying details.
2. **Given** a valid episode number, **When** a client requests that episode, **Then** the response contains only that episode's details.
3. **Given** an episode number that does not exist, **When** a client requests that episode, **Then** the response clearly indicates the episode was not found (not a generic server error).

---

### User Story 2 - Search Episodes by Keyword (Priority: P2)

A visitor wants to find episodes related to a topic by typing a search term, without needing to know the exact title or episode number.

**Why this priority**: Search improves discoverability once the base episode list exists, but the app is usable without it — so it ranks below basic browsing.

**Independent Test**: Can be fully tested by searching for a term known to appear in an episode's title or description and confirming matching episodes are returned, then searching for a term that matches nothing and confirming an empty list (not an error) is returned.

**Acceptance Scenarios**:

1. **Given** a search term that appears in an episode's title, **When** a client searches for that term, **Then** that episode is included in the results.
2. **Given** a search term that appears in an episode's description but not its title, **When** a client searches for that term, **Then** that episode is included in the results.
3. **Given** a search term in a different letter case than the stored text, **When** a client searches for that term, **Then** matching episodes are still returned.
4. **Given** a search term that matches no episode, **When** a client searches for that term, **Then** the response is an empty list rather than an error.
5. **Given** search results, **When** a client inspects the response shape, **Then** it matches the same shape used by the full episode list endpoint.

---

### User Story 3 - View Series Info and System Status (Priority: P3)

A visitor or operator wants a quick summary of the series (name, season, description, topics covered) and a way to confirm the API is running correctly.

**Why this priority**: This is supporting/informational content — useful for an "about" section and for operational monitoring, but not required for the core episode-browsing experience.

**Independent Test**: Can be fully tested by requesting the series info endpoint and confirming name, season, description, and topics are present, and separately requesting the status and health endpoints and confirming they respond with current runtime information.

**Acceptance Scenarios**:

1. **Given** the API is running, **When** a client requests series info, **Then** the response includes the series name, season, description, and list of episode topics.
2. **Given** the API is running, **When** a client requests the status endpoint, **Then** the response includes the current environment and a timestamp.
3. **Given** the API is running, **When** a client requests the health endpoint, **Then** the response indicates the API is healthy and includes how long it has been running.

---

### Edge Cases

- What happens when the search term is empty or missing? The system returns the full episode list unfiltered (treated as "no filter applied").
- What happens when the episode data file is missing or malformed at startup? The system should fail to start (or clearly log the problem) rather than silently serving no data.
- How does the system handle a browser-based request from the frontend's origin (a different port than the API)? The request must succeed rather than being blocked by the browser.
- What happens when an episode number is requested in a format that isn't a valid number? The system returns the same not-found response used for unknown episode numbers.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a status endpoint that reports the current runtime environment and a timestamp.
- **FR-002**: System MUST provide a health check endpoint that reports the API is running and how long it has been running (uptime).
- **FR-003**: System MUST provide series information consisting of the series name, season, description, and a list of episode topics.
- **FR-004**: System MUST provide a list of all episodes belonging to the season.
- **FR-005**: System MUST provide the details of a single episode identified by its episode number.
- **FR-006**: System MUST return a clear not-found response (not a generic error) when the requested episode number does not exist.
- **FR-007**: System MUST allow searching episodes by a text term, matching against episode title or description; the search term query parameter is optional, and omitting it MUST return the full episode list (identical to the episode list endpoint).
- **FR-008**: Search matching MUST be case-insensitive and implemented as a simple substring (`Contains()`) match; no external search library is used.
- **FR-009**: Search results MUST use the same response shape as the full episode list, filtered to only matching episodes.
- **FR-010**: System MUST return an empty list (not an error) when a search term matches no episodes.
- **FR-011**: Series and episode data MUST be sourced from a local data file bundled with the API; no external database is used.
- **FR-012**: System MUST allow the frontend application, served from a configurable set of allowed CORS origins (defaulting to http://localhost:5173), to call every endpoint directly from the browser.
- **FR-013**: System MUST expose interactive, browsable documentation describing all available endpoints and their response formats.
- **FR-014**: System MUST NOT require authentication or authorization for any endpoint; all endpoints are publicly accessible for this demo.

### Key Entities

- **Series**: The show being cataloged. Attributes: name, season, description, list of episode topics covered.
- **Episode**: A single installment of the season. Attributes: season, episode, title, presenter, introduction, youWillLearn, technologiesUsed, whoShouldAttend, status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can discover and try out every available endpoint through the interactive docs without reading any separate written documentation.
- **SC-002**: Requests for the episode list, a single episode, series info, status, or health each return a response in under 200 milliseconds under normal local use, since all data is served from an in-memory local source.
- **SC-003**: Searching by a keyword that exists in the data returns the correct matching episodes 100% of the time; searching by a keyword that doesn't exist never produces an error.
- **SC-004**: Requesting a non-existent episode returns a clear not-found result 100% of the time, with zero unhandled server errors.
- **SC-005**: The frontend running on its own origin can successfully call all six endpoints from the browser with zero cross-origin access failures.

## Assumptions

- An empty or missing search term is treated as "no filter," returning the complete episode list.
- No authentication or authorization is required for any endpoint; all data is public, read-only content.
- No database is used for this demo; data is served from an in-memory local data file.
- Uptime reported by the health endpoint is measured as elapsed time since the API process started.
- The not-found response for an unknown or invalid episode number uses a standard, descriptive error rather than a custom error catalog.
- The API is implemented as .NET minimal APIs in a single Program.cs, matching the target framework already used elsewhere in this solution.
