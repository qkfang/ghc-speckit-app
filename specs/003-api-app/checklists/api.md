# API Checklist: Sample App Backend API

**Purpose**: Validate requirements quality for API contract correctness, CORS, search behavior, error handling, and testing coverage
**Created**: 2026-08-17
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [tasks.md](../tasks.md) | [contracts/api-contract.md](../contracts/api-contract.md)

**Note**: This checklist tests the requirements themselves (completeness, clarity, consistency, measurability, coverage) — not the implementation.

## API Contract Correctness

- [ ] CHK001 Are response shapes (fields/types) explicitly defined for every endpoint (status, health, series, episodes, episode by id, search)? [Completeness, Spec §FR-001-FR-010, Contract]
- [ ] CHK002 Is the exact JSON field naming/casing convention specified for all response bodies? [Clarity, Gap]
- [ ] CHK003 Are HTTP status codes explicitly defined for every success and failure path per endpoint? [Completeness, Contract]
- [ ] CHK004 Is the `Episode` entity's field list consistent between spec.md Key Entities and the contract's example payloads? [Consistency, Spec §Key Entities]
- [ ] CHK005 Are the `topics` projection fields for `GET /api/series` explicitly enumerated and traceable to the Episode entity? [Clarity, Contract §GET /api/series]
- [ ] CHK006 Is the timestamp format (e.g., ISO 8601, timezone) specified consistently across status, health, and error responses? [Consistency, Gap]
- [ ] CHK007 Are content-type/response header expectations (e.g., `application/json`) stated for every endpoint, not just as a general cross-cutting note? [Completeness]
- [ ] CHK008 Is an API versioning strategy (or its explicit absence) documented as a requirement? [Gap]
- [ ] CHK009 Is the `{id:int}` route constraint's requirement-level intent (reject non-numeric ids before app logic) captured in spec.md, not only in the contract? [Traceability, Spec §Edge Cases]

## CORS

- [ ] CHK010 Is the mechanism for configuring `AllowedOrigins` (env var vs. appsettings key vs. per-environment values) specified as a requirement? [Clarity, Spec §FR-012]
- [ ] CHK011 Are requirements defined for system behavior when `AllowedOrigins` is empty or misconfigured at startup? [Gap, Edge Case]
- [ ] CHK012 Is the requirement for allowed HTTP methods and headers under CORS explicitly stated (e.g., "all methods/headers") rather than left to implementation choice? [Clarity, Contract §Cross-cutting]
- [ ] CHK013 Are CORS requirements consistent across spec.md (FR-012), plan.md (Constraints/Constitution Check), and the API contract's cross-cutting section? [Consistency]
- [ ] CHK014 Is there an explicit requirement prohibiting wildcard/any-origin CORS policies (to satisfy the Security-First gate)? [Completeness, Spec §Constitution Check]
- [ ] CHK015 Are requirements defined for how CORS applies (or doesn't) to non-browser clients (e.g., curl, server-to-server calls)? [Gap, Edge Case]
- [ ] CHK016 Is SC-005 ("zero cross-origin access failures") stated in a way that is objectively measurable given the configured allowed-origins approach? [Measurability, Spec §SC-005]

## Search Behavior

- [ ] CHK017 Is the exact set of searched fields (title, introduction) unambiguous and free of conflicting references to other fields (e.g., presenter, technologiesUsed)? [Consistency, Spec §FR-007, Contract §GET /api/episodes/search]
- [ ] CHK018 Are "empty" and "missing" `q` query parameter cases explicitly unified as equivalent behavior? [Clarity, Spec §FR-007, Edge Cases]
- [ ] CHK019 Are requirements defined for whitespace-only search terms (e.g., `q` containing only spaces)? [Gap, Edge Case]
- [ ] CHK020 Is the case-insensitivity requirement specific enough to avoid locale-dependent ambiguity (e.g., ordinal vs. culture-aware comparison)? [Clarity, Spec §FR-008]
- [ ] CHK021 Is result ordering for search matches defined in spec.md, or only mentioned in the contract ("matches returned in original order")? [Consistency, Contract §GET /api/episodes/search]
- [ ] CHK022 Are requirements defined for very long search terms or special/regex-like characters in `q`? [Gap, Edge Case]
- [ ] CHK023 Does the spec explicitly state that fields other than title/introduction (e.g., presenter) are out of scope for matching? [Completeness, Ambiguity]
- [ ] CHK024 Is the response-shape equivalence between `GET /api/episodes` and an unfiltered `GET /api/episodes/search` stated as a testable requirement (not just an implementation note)? [Measurability, Spec §FR-009]

## Error Handling

- [ ] CHK025 Is the not-found response shape (`{ "error": "..." }`) specified as a stable, required contract element rather than an implementation detail? [Clarity, Spec §FR-006, Contract §GET /api/episodes/{id}]
- [ ] CHK026 Are requirements defined so that malformed/non-integer episode identifiers produce the same not-found response as unknown-but-valid ids? [Consistency, Spec §Edge Cases]
- [ ] CHK027 Is startup failure behavior precisely specified (fail-fast vs. log-and-continue) when the data file is missing or malformed? [Clarity, Ambiguity, Spec §Edge Cases]
- [ ] CHK028 Are error-response requirements defined for unexpected/unhandled failures (5xx) across all endpoints, not only the documented 404 case? [Gap, Completeness]
- [ ] CHK029 Is there a requirement stating whether error responses may include internal details (e.g., stack traces) in any environment? [Gap, Security]
- [ ] CHK030 Are error-handling requirements consistent across endpoints (e.g., is "no match" the only non-happy path defined for search, with no other failure mode)? [Consistency]

## Testing

- [ ] CHK031 Does the task list map test coverage to every acceptance scenario in spec.md (US1–US3), not only to endpoint happy paths? [Traceability, Coverage, Tasks §T011/T014/T016]
- [ ] CHK032 Are requirements defined for testing CORS behavior itself (e.g., allowed-origin verification), or only for functional endpoint responses? [Gap, Coverage]
- [ ] CHK033 Is there a requirement to test the "startup fails on missing/malformed data file" edge case, or is it left unverified? [Gap, Edge Case]
- [ ] CHK034 Is SC-002's <200ms performance target paired with a defined test or measurement approach, or left unmeasured? [Measurability, Spec §SC-002]
- [ ] CHK035 Is SC-004's "zero unhandled server errors" criterion testable via a specific, enumerable test case rather than a qualitative assertion? [Measurability, Spec §SC-004]
- [ ] CHK036 Is there a requirement to validate the Swagger/OpenAPI document itself (e.g., all 6 endpoints present), supporting SC-001, or is it left to manual inspection only? [Gap, Spec §SC-001]
- [ ] CHK037 Are independent test requirements defined for matching by title AND matching by introduction (per FR-007/FR-009), and are both reflected in the planned test tasks? [Traceability, Tasks §T014]

## Notes

- Check items off as completed: `[x]`
- Add comments or findings inline
- Link to relevant resources or documentation
- Items are numbered sequentially for easy reference
