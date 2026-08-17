---
feature: 004-text-search
risk: low
breaking: false
reviewer-team: web
---

# Feature Specification: Episode Text Search

**Feature Branch**: `004-text-search`
**Created**: 2026-08-17
**Status**: Draft
**Input**: User description: "Connect the Sample App frontend search box to the backend text search endpoint. The React frontend calls the episode search endpoint instead of filtering client-side. The search term supports wildcard matching using `*` (e.g. `*dan*` matches any title or description containing "dan", `dan*` matches values starting with "dan", `*dan` matches values ending with "dan"). A search term with no `*` wildcard falls back to a plain case-insensitive substring match, same as before. Requests are debounced so typing does not fire one request per keystroke. An empty search term returns all episodes. The no-results state and friendly message from Part 3 still work."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find Episodes by Keyword (Priority: P1)

As a visitor, I want to type a keyword into the search box and see only the episodes whose title or description contain that keyword, so I can quickly find content relevant to a topic without knowing the exact title.

**Why this priority**: This replaces the existing client-side filter with the authoritative server search, and is the baseline behavior every other story builds on.

**Independent Test**: Can be fully tested by typing a plain keyword (no wildcard) that appears in a known episode's title or description and confirming that episode appears in the results, while episodes without that keyword are excluded.

**Acceptance Scenarios**:

1. **Given** episodes are loaded, **When** a visitor types a keyword that appears in an episode's title, **Then** that episode is shown and non-matching episodes are hidden.
2. **Given** episodes are loaded, **When** a visitor types a keyword that appears only in an episode's description, **Then** that episode is still shown.
3. **Given** a visitor types a keyword in a different letter case than the stored text, **When** results are returned, **Then** matching episodes are shown regardless of case.
4. **Given** a visitor clears the search box, **When** the box becomes empty, **Then** the full episode catalog is shown again.

---

### User Story 2 - Narrow Results with Wildcard Patterns (Priority: P2)

As a visitor, I want to use a `*` in my search to match episodes whose title or description starts with, ends with, or contains a specific piece of text, so I can narrow or broaden my search beyond a simple substring.

**Why this priority**: Wildcards add precision and flexibility on top of the baseline keyword search, but the app is fully usable with plain keyword search alone.

**Independent Test**: Can be fully tested by searching `*term*`, `term*`, and `*term` against known episode data and confirming each pattern returns the expected set of matches (contains, starts-with, ends-with respectively).

**Acceptance Scenarios**:

1. **Given** an episode's title or description contains "dan" anywhere within it, **When** a visitor searches `*dan*`, **Then** that episode is included in the results.
2. **Given** an episode's title or description starts with "dan", **When** a visitor searches `dan*`, **Then** that episode is included, and episodes where "dan" appears only in the middle or end are excluded.
3. **Given** an episode's title or description ends with "dan", **When** a visitor searches `*dan`, **Then** that episode is included, and episodes where "dan" appears only at the start or middle are excluded.
4. **Given** a visitor searches a term with no `*` character, **When** results are returned, **Then** they match the same episodes as a plain substring search (User Story 1 behavior).

---

### User Story 3 - Smooth, Responsive Typing Experience (Priority: P3)

As a visitor, I want the app to wait briefly while I'm actively typing before searching, so my typing feels responsive and the app doesn't overload the backend with a search request for every keystroke.

**Why this priority**: This is a refinement of search behavior that improves performance and perceived responsiveness, but does not change what results are ultimately shown.

**Independent Test**: Can be fully tested by typing several characters in quick succession and confirming only one search request is sent after typing pauses, and confirming the results shown always reflect the most recently typed term (not an earlier, in-flight one).

**Acceptance Scenarios**:

1. **Given** a visitor types multiple characters in quick succession, **When** typing is still in progress, **Then** no search request is sent for each individual keystroke.
2. **Given** a visitor pauses typing, **When** the pause is detected, **Then** a single search request is sent using the current search box value.
3. **Given** a visitor changes the search term again before an earlier request finishes, **When** results arrive, **Then** only the results matching the latest typed term are shown to the visitor.

---

### Edge Cases

- An empty or whitespace-only search term returns the full, unfiltered episode catalog.
- A search term consisting of only `*` (no other characters) is treated as matching all episodes, same as an empty term.
- A search term with a `*` in a position other than the start, end, or both (e.g., in the middle of other text) is treated using the same fallback substring behavior as a term with no wildcard, ignoring the `*` as a literal wildcard trigger.
- A search that matches no episodes shows the existing friendly no-results message rather than an empty grid or an error.
- If the backend search request fails (network or service error), the visitor sees the existing friendly error state rather than a blank or broken results grid.
- Rapid, repeated edits to the search box do not cause results from an earlier, slower request to overwrite results from a later, faster one.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST search episodes by sending the visitor's current search term to the backend search capability instead of filtering the already-loaded episode list in the browser.
- **FR-002**: The system MUST support wildcard search patterns using `*`: a term wrapped in `*` on both sides matches episodes whose title or description contains the enclosed text anywhere; a term ending in `*` matches episodes whose title or description starts with the preceding text; a term starting with `*` matches episodes whose title or description ends with the following text.
- **FR-003**: The system MUST treat a search term containing no `*` character as a plain, case-insensitive substring match against episode title or description, matching prior behavior.
- **FR-004**: The system MUST treat all wildcard and plain-text matching as case-insensitive.
- **FR-005**: The system MUST wait for a brief pause in the visitor's typing before sending a search request, so that continuous typing does not send a request per keystroke.
- **FR-006**: The system MUST treat an empty or whitespace-only search term as a request for the full, unfiltered episode catalog.
- **FR-007**: The system MUST display only the results corresponding to the most recently entered search term when multiple search requests are in flight at once, discarding any results from a now-outdated request.
- **FR-008**: The system MUST continue to show the existing friendly no-results message when a search returns zero matching episodes.
- **FR-009**: The system MUST continue to show the existing friendly error state when a search request cannot be completed.
- **FR-010**: Clearing the search box MUST restore the full episode catalog without requiring a page reload.

### Key Entities

- **Search Term**: The text a visitor enters into the search box, optionally containing one or more `*` wildcard characters that change how it is matched against episode title and description.
- **Episode**: A single item in the series catalog, matched by its title and description against the search term; unchanged from prior features.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Visitors can find an episode by typing any plain substring of its title or description and see it appear in results, matching prior search accuracy.
- **SC-002**: In acceptance testing, each of the three wildcard patterns (contains, starts-with, ends-with) returns exactly the expected set of matching episodes with 100% accuracy against known test data.
- **SC-003**: Typing a multi-character search term in quick succession results in a single search request being sent, not one per keystroke.
- **SC-004**: Results shown to the visitor always reflect the most recently typed search term, even when an earlier request is still in flight, in 100% of tested rapid-edit scenarios.
- **SC-005**: Clearing the search box shows the full episode catalog again within the same response time as a normal search.
- **SC-006**: Visitors see the friendly no-results or error message, never a blank or broken grid, in 100% of tested no-match and request-failure scenarios.

## Assumptions

- The backend text search endpoint used in feature 003-api-app is extended (or already able) to support the three `*` wildcard patterns described here; this feature focuses on connecting the frontend to it and defining the expected matching behavior from the user's perspective.
- "Description" refers to the same episode field previously described as introduction/description in earlier features; the visible label to visitors is unchanged.
- A short typing pause (on the order of a few hundred milliseconds, consistent with standard responsive UI practice) is an acceptable default debounce delay; no specific value was mandated.
- Search continues to be read-only and does not introduce authentication, sorting, or filtering controls beyond the existing search box.
- The no-results and error friendly states reused here are the same ones already established in the prior episode browsing feature.
