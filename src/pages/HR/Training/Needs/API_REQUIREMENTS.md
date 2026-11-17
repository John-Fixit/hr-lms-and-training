# Training Needs Assessment (TNA) — API Requirements

UI: `/people/hr/training/needs`. Mock: `src/API/trainingNeeds.js`.

Conventions: `POST training/...`, snake_case requests, UPPER_SNAKE responses, `{ message, data }`.

---

## 1. Data model

### `tna_round` (one assessment exercise, usually yearly)
| Field | Type | Notes |
|---|---|---|
| TNA_ID | id | |
| TITLE, YEAR | string, int | |
| DESCRIPTION, OBJECTIVES | string | |
| START_DATE, DEADLINE | date | |
| RESPONSIBLE_OFFICER | string → later staff id | |
| STATUS | enum | `DRAFT`, `OPEN`, `CLOSED` — only one `OPEN` at a time |
| DEPARTMENTS | dept ids | each gets a submission on creation |

### `tna_submission` (one per department per round)
| Field | Notes |
|---|---|
| SUBMISSION_ID, TNA_ID, DEPARTMENT | use department id in the real build |
| STATUS | `NOT_STARTED` → `DRAFT` (first need added) → `SUBMITTED` → `REVIEWED`, or `RETURNED` (back to the department) |
| SUBMITTED_BY, SUBMITTED_AT | |
| REVIEW_COMMENT, REVIEWED_AT | |

### `tna_need`
| Field | Type | Notes |
|---|---|---|
| NEED_ID, SUBMISSION_ID, TNA_ID, DEPARTMENT | | |
| COURSE_ID | fk, nullable | catalogue course |
| PROPOSED_TITLE | string | when the training isn't in the catalogue |
| SKILL_IDS | fk[] → skill | |
| SOURCE | enum | `DEPARTMENT`, `SKILL_GAP`, `APPRAISAL` (APER Part 10), `COMPLIANCE`, `STRATEGIC` |
| STAFF_IDS | fk[] | optional named staff |
| PARTICIPANTS | int | estimate (≥ named staff) |
| JUSTIFICATION | string | min 15 chars |
| EXPECTED_OUTCOME | string | |
| PRIORITY | enum | `HIGH`, `MEDIUM`, `LOW` |
| ESTIMATED_COST | number | defaults to course cost × participants |
| STATUS | enum | `PROPOSED`, `APPROVED`, `DEFERRED`, `REJECTED` |
| HR_COMMENT | string | required for defer/reject |
| SESSION_IDS | fk[] → session | set when planned into a session |

### Rules
1. Needs can be added/edited only while the round is `OPEN` and the submission isn't `SUBMITTED`/`REVIEWED`.
2. A submission needs at least one need to be submitted.
3. HR reviews a `SUBMITTED` department: decide every need (approve / defer / reject), then mark it `REVIEWED` — or return it with a comment.
4. Needs can be decided in bulk from the register. Needs already planned into a session can't be deferred/rejected.
5. Approved needs with a catalogue course are planned by creating a session with `need_id` (one session can serve the same course across several departments — the needs register's "By course" view).
6. Closing a round stops further submissions; approved needs stay in the register.

### Skill-gap suggestions
For a department: skills where staff sit at L1–L2 (from Skills & Competency), with the active catalogue course whose target level for that skill is ≥ 3 (primary skills first). Real build should also pull **APER Part 10 training recommendations** (`training_recommendation`, `training_recommendation_purpose` in the appraisal templates) as `APPRAISAL` suggestions.

---

## 2. Endpoints

| Endpoint | Hook | Request | Response `data` |
|---|---|---|---|
| `POST training/tna/overview` | useGetNeedsOverview | `{ company_id }` | `{ ACTIVE_ROUND }` (round + stats) |
| `POST training/tna/rounds` | useGetTnaRounds | `{ company_id }` | `[round + DEPARTMENT_COUNT, SUBMITTED_COUNT, REVIEWED_COUNT, AWAITING_REVIEW, NEED_COUNT, APPROVED_COUNT, PLANNED_COUNT, APPROVED_COST, APPROVED_PARTICIPANTS, DAYS_LEFT]` |
| `GET training/tna/round/:tna_id` | useGetTnaRound | — | round + stats + `SUBMISSIONS[]` (+ `NEED_COUNT, HIGH_PRIORITY, ESTIMATED_COST, PARTICIPANTS, APPROVED_COUNT`) |
| `POST training/tna/needs` | useGetTnaNeeds | `{ tna_id }` | `[need + TITLE, COURSE_CODE, STAFF[] { STAFF_ID, NAME, DESIGNATION }, SESSIONS[] { SESSION_ID, START_DATE, END_DATE, STATUS }]` |
| `GET training/tna/submission/:id` | useGetTnaSubmission | — | submission + `ROUND_STATUS` + `NEEDS[]` |
| `POST training/tna/skill_gaps` | useGetDepartmentSkillGaps | `{ department }` | `[{ SKILL_ID, SKILL_NAME, STAFF_IDS, STAFF_COUNT, DEPARTMENT_SIZE, SUGGESTED_COURSE }]` |
| `POST training/tna/create_round` | useCreateTnaRound | `{ title, year, description, objectives, start_date, deadline, responsible_officer, departments, status }` | `message`, `data: { TNA_ID }` |
| `POST training/tna/set_round_status` | useSetTnaRoundStatus | `{ tna_id, status: OPEN \| CLOSED }` | `message` |
| `POST training/tna/save_need` | useSaveTnaNeed | `{ need_id?, submission_id, course_id?, proposed_title?, skill_ids, source, staff_ids, participants, estimated_cost, priority, justification, expected_outcome }` | `message` |
| `POST training/tna/delete_need` | useDeleteTnaNeed | `{ need_id }` | `message` |
| `POST training/tna/submit` | useSubmitTnaSubmission | `{ submission_id }` | `message` |
| `POST training/tna/review` | useReviewTnaSubmission | `{ submission_id, action: ACCEPT \| RETURN, comment? }` | `message` |
| `POST training/tna/decide_needs` | useDecideTnaNeeds | `{ need_ids, status, comment? }` | `message` |
| `POST training/tna/remind` | useRemindTnaDepartments | `{ submission_ids }` | `message` (sends email/SMS to department heads) |

## 3. Open questions
1. Do department heads fill submissions themselves (needs a department-head view and role), or does HR enter them?
2. Should APER Part 10 recommendations flow in automatically as suggested needs?
3. Is an annual training **plan** (parked) needed after TNA, or do approved needs go straight to scheduling?
