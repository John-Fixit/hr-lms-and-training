# HR Training — Real API Response Shapes

Captured from the live backend on 2026-11-09 (`https://hr.ncaa.gov.ng/old_hr/apis/train/...`, `company_id: 1`, `staff_id: 1`).
Compare against `HR_TRAINING_BACKEND_API_REQUIREMENTS.md`, which is what the hooks currently expect.

## Global findings

| # | Finding | Impact on the frontend |
|---|---|---|
| 1 | Most lists return `data: { ITEMS: [], PAGE, LIMIT, TOTAL }` | `responseList()` only accepts an array / `rows` / `ROWS`, so these list hooks throw. Affects `skills/list`, `skills/staff_directory`, `catalogue/courses`, `providers/list`, `trainers/list`, `sessions/list`, `requests/list`. |
| 2 | Some lists return a plain array | `catalogue/programmes`, `requests/routes`, `tna/rounds`, `tna/needs`, `tna/skill_gaps`, `skills/categories`, `sessions/staff_history`. |
| 3 | Create responses return IDs as strings (`"SKILL_ID": "2"`); lists and details return numbers (`2`) | Compare IDs with `String()` / `Number()` consistently. |
| 4 | Decimals come back as strings (`"DEFAULT_COST": "100000.00"`, `"DURATION_DAYS": "3.00"`, `"MIN_COST": ".00"`) | Wrap them in `Number()` before doing maths or formatting. |
| 5 | People are returned as `FIRST_NAME` + `LAST_NAME`, not `STAFF_NAME` / `NAME` | Build the display name on the frontend. |
| 6 | Departments are returned as `DEPARTMENT` / `DEPARTMENT_ID` (a number, e.g. `37`); only TNA returns `DEPARTMENT_NAME` | Other screens need a lookup to show the department name. |
| 7 | Every overview returns different fields from the requirements doc | See each section. |
| 8 | No token was needed for any call | The backend should check auth (flag this to the backend team). |
| 9 | **Backend SQL injection:** `catalogue/create_course` puts request values straight into the SQL. An array `target_grades` produced `Invalid column name 'Array'`, and the HTML error page exposed the SQL and the server file path | Backend must use parameterised queries and return JSON errors. Until then, send `target_grades` as a comma-separated string (`"9,10"`). |
| 10 | Dates are SQL Server datetimes (`"2027-03-01 00:00:00.000"`, `"2026-11-09 09:31:05.7693408"`) | `dayjs()` parses them; to show only the date, use `.slice(0, 10)` or `dayjs(...).format(...)`. |

---

## Skills & Competency

`POST skills/overview`
```json
{ "ACTIVE_SKILLS": 2, "PENDING_ASSESSMENTS": 1, "VERIFIED_ASSESSMENTS": 0, "STAFF_WITH_SKILLS": 1,
  "TOP_SKILLS": [{ "SKILL_ID": 2, "SKILL_NAME": "...", "HOLDER_COUNT": 1 }] }
```
Mismatch: the hook reads `TOP_SKILL.STAFF_COUNT ?? COUNT`, but the field is `HOLDER_COUNT`.

`POST skills/categories` → `[{ CATEGORY_ID, COMPANY_ID, CATEGORY_NAME, DESCRIPTION, IS_ACTIVE, CREATED_BY, CREATED_AT, UPDATED_AT }]`

`POST skills/list` → `{ ITEMS: [...], PAGE, LIMIT, TOTAL }`
```json
{ "SKILL_ID": 2, "COMPANY_ID": 1, "CATEGORY_ID": 1, "CATEGORY_NAME": "Safety", "SKILL_NAME": "...",
  "DESCRIPTION": "...", "IS_ACTIVE": 1, "CREATED_BY": 0, "CREATED_AT": "...", "UPDATED_AT": null }
```
Missing compared with the doc: `STAFF_COUNT`, `VERIFIED_COUNT`, `AVERAGE_LEVEL`. Also, `useCreateSkill` doesn't send `created_by`, so it's stored as `0`.

`POST skills/create` → `{ SKILL_ID: "2" }`
`POST skills/save_staff_skill` (`staff_id, skill_id, skill_level, years_experience, source, notes`) → `{ STAFF_SKILL_ID: "1" }`

`POST skills/staff_directory` → `{ ITEMS, PAGE, LIMIT, TOTAL }`
```json
{ "STAFF_SKILL_ID": 1, "STAFF_ID": 1, "FIRST_NAME": "SYSTEM", "LAST_NAME": "SUPPORTS", "GRADE": 12,
  "DEPARTMENT": 37, "SKILL_ID": 2, "SKILL_NAME": "...", "SKILL_LEVEL": 3, "SOURCE": "SELF",
  "STATUS": "PENDING", "ASSESSED_BY": null, "ASSESSED_AT": null, "LEVEL_LABEL": "Intermediate" }
```

`GET skills/staff_profile/:staff_id`
```json
{ "STAFF": { "STAFF_ID": 1, "FIRST_NAME": "...", "LAST_NAME": "...", "GRADE": 12, "DEPARTMENT": 37, "COMPANY_ID": 1 },
  "SKILLS": [{ "STAFF_SKILL_ID": 1, "SKILL_ID": 2, "SKILL_NAME": "...", "CATEGORY_NAME": "Safety", "SKILL_LEVEL": 3,
               "SOURCE": "SELF", "STATUS": "PENDING", "NOTES": "...", "ASSESSED_BY": null, "ASSESSED_AT": null,
               "CREATED_AT": "...", "LEVEL_LABEL": "Intermediate" }] }
```
`YEARS_EXPERIENCE` isn't returned.

---

## Programme & Course Catalogue

`POST catalogue/overview`
```json
{ "PROGRAMMES": 0, "ACTIVE_COURSES": 0, "DRAFT_COURSES": 0, "ARCHIVED_COURSES": 0, "MANDATORY_COURSES": 0 }
```
Missing compared with the doc: `ACTIVE_PROGRAMMES` (it's called `PROGRAMMES`), `TOTAL_COURSES`, `SKILLS_COVERED`, `COURSES_WITHOUT_SKILLS`, `STAFF_TRAINED`.

`POST catalogue/programmes` → plain array
```json
{ "PROGRAMME_ID": 1, "COMPANY_ID": 1, "PROGRAMME_NAME": "...", "DESCRIPTION": "...", "OWNER_STAFF_ID": 1,
  "STATUS": "ACTIVE", "CREATED_BY": 1, "CREATED_AT": "...", "UPDATED_AT": null, "COURSE_COUNT": 0 }
```
Missing: `OWNER` (it's `OWNER_STAFF_ID`, with no name), `ACTIVE_COURSE_COUNT`, `SESSIONS_RUN`, `STAFF_TRAINED`.

`POST catalogue/create_programme` → `{ PROGRAMME_ID: "1" }`
`POST catalogue/create_course` → `{ COURSE_ID: "1" }` (send `target_grades` as a string, see global #9)

`POST catalogue/courses` → `{ ITEMS, PAGE, LIMIT, TOTAL }`
```json
{ "COURSE_ID": 1, "COMPANY_ID": 1, "PROGRAMME_ID": 1, "COURSE_CODE": "ZZT-101", "COURSE_TITLE": "...",
  "TRAINING_TYPE": "TRAINING", "DELIVERY_METHOD": "CLASSROOM", "LOCATION": "LOCAL", "DURATION_DAYS": "3.00",
  "IS_MANDATORY": 0, "DESCRIPTION": "...", "OBJECTIVES": "...", "LEARNING_OUTCOMES": "Outcome one\nOutcome two",
  "TARGET_AUDIENCE": "...", "TARGET_GRADES": "9,10", "DEFAULT_PROVIDER_ID": 1, "DEFAULT_COST": "100000.00",
  "LMS_COURSE_ID": null, "STATUS": "ACTIVE", "CREATED_BY": 1, "UPDATED_BY": null, "CREATED_AT": "...",
  "UPDATED_AT": null, "PROGRAMME_NAME": "...", "DEFAULT_PROVIDER_NAME": "..." }
```
Missing: `SKILLS[]`, `SESSIONS_RUN`, `STAFF_TRAINED`. `LEARNING_OUTCOMES` is a newline string and `TARGET_GRADES` a comma string; split both for the UI.

`GET catalogue/course/:course_id` → the list fields plus:
```json
{ "SKILLS": [{ "SKILL_ID": 2, "SKILL_NAME": "...", "TARGET_LEVEL": null }], "PREREQUISITES": [] }
```
`TARGET_LEVEL` and `IS_PRIMARY` from the `skills[]` payload aren't stored; the backend appears to use only `skill_ids`. `REQUIRED_FOR[]` is missing.

---

## Trainers & Providers

`POST providers/overview`
```json
{ "ACTIVE_PROVIDERS": 0, "ACTIVE_TRAINERS": 0, "EXPIRING_DOCUMENTS": 0, "EXPIRED_DOCUMENTS": 0 }
```
Missing: internal/external splits, `AVERAGE_RATING`, `RATED_ENGAGEMENTS`, `DOCUMENT_ALERTS` (split into `EXPIRING_DOCUMENTS` and `EXPIRED_DOCUMENTS`).

`POST providers/create` → `{ PROVIDER_ID: "1" }` (`services` sent as a string)

`POST providers/list` → `{ ITEMS, PAGE, LIMIT, TOTAL }`
```json
{ "PROVIDER_ID": 1, "COMPANY_ID": 1, "PROVIDER_NAME": "...", "PROVIDER_TYPE": "INSTITUTION", "LOCATION": "LOCAL",
  "CITY": "Abuja", "COUNTRY": "Nigeria", "CONTACT_PERSON": "...", "EMAIL": "...", "PHONE": "...", "WEBSITE": "...",
  "ACCREDITATION": "...", "ACCREDITATION_EXPIRY": "2027-12-15", "SERVICES": "Safety management", "NOTES": "...",
  "STATUS": "ACTIVE", "CREATED_BY": 1, "CREATED_AT": "...", "UPDATED_AT": null }
```
Missing from the list: `DOCUMENTS[]`, `ENGAGEMENTS`, `LAST_ENGAGED`, `AVERAGE_RATING`, `PARTICIPANTS_TOTAL`, `SPEND_TOTAL`, `TRAINER_COUNT`, `COURSE_COUNT`, `DOCUMENT_ALERT`. `SERVICES` is a comma string.

`GET providers/detail/:provider_id` → the list fields plus:
```json
{ "DOCUMENTS": [{ "DOCUMENT_ID": 1, "DOCUMENT_NAME": "...", "DOCUMENT_TYPE": "CONTRACT", "EXPIRY_DATE": "2027-12-31",
                  "FILE_URL_ID": "", "EXPIRY_ALERT": "VALID" }],
  "TRAINERS": [{ "TRAINER_ID": 1, "FULL_NAME": "...", "TRAINER_TYPE": "EXTERNAL", "TITLE": "...", "EMAIL": "...",
                 "PHONE": "...", "STATUS": "ACTIVE" }] }
```
Missing: `RATING_BREAKDOWN`, `ENGAGEMENT_HISTORY[]`, `COURSES[]`.

`POST trainers/create` → `{ TRAINER_ID: "1" }`. **`full_name` is required even for INTERNAL trainers with a `staff_id`**, so the form must fill it from the selected staff.

`POST trainers/list` → `{ ITEMS, PAGE, LIMIT, TOTAL }`
```json
{ "TRAINER_ID": 1, "COMPANY_ID": 1, "TRAINER_TYPE": "EXTERNAL", "STAFF_ID": null, "FULL_NAME": "...",
  "PROVIDER_ID": 1, "TITLE": "...", "EMAIL": "...", "PHONE": "...", "YEARS_EXPERIENCE": 5, "BIO": "...",
  "STATUS": "ACTIVE", "CREATED_BY": 1, "CREATED_AT": "...", "UPDATED_AT": null, "PROVIDER_NAME": "..." }
```
Missing: `SESSIONS_DELIVERED`, `LAST_ENGAGED`, `AVERAGE_RATING`, `QUALIFICATIONS` (sent, never returned).

`GET trainers/detail/:trainer_id` → the list fields + `SKILLS: [{ SKILL_ID, SKILL_NAME }]`. Missing: `PARTICIPANTS_TOTAL`, `RATING_BREAKDOWN`, `ENGAGEMENT_HISTORY[]`.

---

## Calendar & Scheduling / Participants

The session ID is **`TRAINING_ID`** everywhere (the hooks already alias it to `SESSION_ID`). Sessions are built on the existing training table, so old records come back with the new fields set to `null`.

`POST sessions/overview`
```json
{ "SCHEDULED": 29, "COMPLETED": 17, "CANCELLED": 0, "PARTICIPANTS": 1114, "YEAR": 2026 }
```
None of the doc's fields (`NEXT_30_DAYS`, `IN_PROGRESS`, `SEAT_FILL_RATE`, ...) exist.

`POST sessions/create` → `{ TRAINING_ID: "743", EXTENSION_ID: "1" }`. `responseMutation` aliases this to `SESSION_ID`.

`POST sessions/list` → `{ ITEMS, PAGE, LIMIT, TOTAL }`. **`from` / `to` are ignored**: every session is returned.
```json
{ "TRAINING_ID": 743, "TRAINING_TITLE": "...", "START_DATE": "2027-03-01 00:00:00.000", "END_DATE": "...",
  "VENUE": "...", "TRAINER": null, "TRAINING_TYPE": "LOCAL", "IS_COMPLETED": 0, "IS_APPROVED": 0,
  "PERIOD_IN_DAYS": 3, "EXTENSION_ID": 1, "COURSE_ID": 1, "PROVIDER_ID": 1, "DELIVERY_METHOD": "CLASSROOM",
  "CAPACITY_MIN": 1, "CAPACITY_MAX": 10, "MEETING_LINK": "", "SESSION_STATUS": "SCHEDULED", "COURSE_CODE": "ZZT-101",
  "COURSE_TITLE": "...", "PROVIDER_NAME": "...", "PARTICIPANT_COUNT": 1, "PHASE": "UPCOMING" }
```
Notes:
- **Legacy rows:** `TRAINING_TYPE` is lowercase `"local"`, and `COURSE_TITLE` / `SESSION_STATUS` are `null`. The hook's `TRAINING_TITLE → COURSE_TITLE` alias only fills `undefined`, not `null`, so these rows show no title.
- **Status:** use `SESSION_STATUS`, not `STATUS`. The detail's `STATUS` is a legacy numeric field.
- **Missing:** `TRAINER_NAMES[]`, `ENROLLED` (it's `PARTICIPANT_COUNT`), `CONFIRMED`, `WAITLISTED`, `CLASHES[]`, `PROGRAMME_ID`.
- **Values seen:** `PHASE` was `UPCOMING` and `IN_PROGRESS`.

`GET sessions/detail/:training_id` → about 50 legacy training columns plus:
```json
{ "SESSION_STATUS": "SCHEDULED", "END_TIME": "16:00", "NOTES": "...", "CANCEL_REASON": null, "PHASE": "UPCOMING",
  "PARTICIPANTS": [{ "STAFF_ID": 1, "FIRST_NAME": "SYSTEM", "LAST_NAME": "SUPPORTS", "GRADE": 12, "DEPARTMENT_ID": 37,
                     "PARTICIPANT_EXT_ID": 1, "PARTICIPANT_STATUS": "CONFIRMED", "SOURCE": "DIRECT", "OUTCOME": null }],
  "TRAINERS": [{ "SESSION_TRAINER_ID": 1, "TRAINER_ID": 1, "FULL_NAME": "...", "TRAINER_TYPE": "EXTERNAL", "ROLE_NAME": null }] }
```
- **Not stored:** `start_time` (only `END_TIME` comes back) and `city`.
- **Missing:** `DAYS[]`, and the per-participant `ATTENDANCE`, `ATTENDANCE_RATE`, `FLAGS[]`, `STAFF_NUMBER`, `DESIGNATION`.
- **Participant ID:** it's `PARTICIPANT_EXT_ID`.

`POST sessions/add_participants` (`training_id, staff_ids, source`) → `{ CONFIRMED: 1, WAITLISTED: 0 }` (doc: `added, waitlisted, skipped`)

`POST sessions/attendance` with a future date → `status:false, "Attendance cannot be recorded for future dates"` (expected validation).

`POST sessions/check_clashes`
```json
{ "WARNINGS": [{ "TYPE": "TRAINER", "DETAIL": { "TRAINER_ID": 1, "TRAINING_ID": 743, "TRAINING_TITLE": "...", "START_DATE": "...", "END_DATE": "..." } },
               { "TYPE": "VENUE",   "DETAIL": { "TRAINING_ID": 743, "TRAINING_TITLE": "...", "VENUE": "...", "START_DATE": "...", "END_DATE": "..." } }],
  "BLOCKING": false }
```
The doc expects `CLASHES[] { TYPE, SESSION_ID, MESSAGE }`; the server returns no message text.

`POST sessions/eligibility` (`staff_id, course_id`) → `{ "ELIGIBLE": false, "ISSUES": ["Staff grade not in target grades", "Already enrolled on overlapping course session 743"] }`
The hook expects `{ ENROLMENT_STATUS, FLAGS[] }`.

`GET sessions/staff_history/:staff_id` → plain array
```json
{ "TRAINING_ID": 743, "TRAINING_TITLE": "...", "START_DATE": "...", "END_DATE": "...", "VENUE": "...", "TRAINER": null,
  "IS_COMPLETED": 0, "COURSE_ID": 1, "COURSE_CODE": "ZZT-101", "COURSE_TITLE": "...", "PARTICIPANT_STATUS": "CONFIRMED",
  "OUTCOME": null, "SOURCE": "DIRECT" }
```
`SESSION_STATUS` is missing (use `IS_COMPLETED`).

---

## Requests & Approvals

`POST requests/overview`
```json
{ "DRAFT": 0, "PENDING": 1, "RETURNED": 0, "APPROVED": 0, "SCHEDULED": 0, "REJECTED": 0, "CANCELLED": 0 }
```
Missing: `OVERDUE`, `AWAITING_SCHEDULING`, `AVERAGE_DAYS_TO_DECIDE`, `APPROVAL_RATE`.

`POST requests/save_route` → `{ ROUTE_ID: "1" }` on create, `{ ROUTE_ID: 1 }` on update.
**`steps` must be an array of role strings** (`["LINE_MANAGER", "HR_TRAINING"]`). Objects are dropped without an error.

`POST requests/routes` → plain array
```json
{ "ROUTE_ID": 1, "COMPANY_ID": 1, "ROUTE_NAME": "...", "LOCATION_SCOPE": "LOCAL", "MIN_COST": ".00",
  "MAX_COST": "99999999.00", "IS_ACTIVE": 1, "SORT_ORDER": 0, "CREATED_BY": 1, "CREATED_AT": "...",
  "STEPS": [{ "ROUTE_STEP_ID": 1, "ROUTE_ID": 1, "STEP_NO": 1, "ROLE_CODE": "LINE_MANAGER" }] }
```
- **Edit bug:** `ApprovalRoutesTab` puts `route.STEPS` (objects) back into the form and reads `route.LOCATION`. Editing a route would wipe its steps and lose its location. Map `STEPS.map(s => s.ROLE_CODE)` and use `LOCATION_SCOPE`.
- **Missing:** `PENDING_REQUESTS`.

`POST requests/preview_route`
```json
{ "ROUTE": { ...route fields }, "STEPS": [{ "STEP_NO": 1, "ROLE_CODE": "LINE_MANAGER", "APPROVER_ID": 2797 }] }
```
The doc expects `{ ROUTE_ID, ROUTE_NAME, STEPS[] { ROLE, APPROVER_NAME } }`; there are no approver names.

`POST requests/create` (`submit: true`) → `{ REQUEST_ID: "1" }`, status goes straight to `PENDING`.

`POST requests/list` → `{ ITEMS, PAGE, LIMIT, TOTAL }`
```json
{ "REQUEST_ID": 1, "COMPANY_ID": 1, "STAFF_ID": 1, "REQUEST_SOURCE": "EMPLOYEE", "REQUEST_TYPE": "CATALOGUE",
  "COURSE_ID": 1, "PROPOSED_TITLE": "", "PROVIDER_ID": null, "TRAINING_TYPE": "TRAINING", "LOCATION": "LOCAL",
  "DURATION_DAYS": "3.00", "PREFERRED_START": "2027-03-01", "PREFERRED_END": "2027-03-03", "ESTIMATED_COST": "100000.00",
  "FUNDING_SOURCE": "TRAINING_BUDGET", "JUSTIFICATION": "...", "EXPECTED_OUTCOME": "...", "TNA_NEED_ID": null,
  "ROUTE_ID": 1, "CURRENT_STEP_NO": 1, "H_REQUEST_ID": null, "TRAINING_ID": null, "STATUS": "PENDING",
  "ATTACHMENT_ID": "", "CREATED_BY": 1, "CREATED_AT": "...", "UPDATED_AT": "...",
  "FIRST_NAME": "SYSTEM", "LAST_NAME": "SUPPORTS", "COURSE_TITLE": "...", "PROVIDER_NAME": null }
```
- **Missing:** `STAFF_NAME`, `STAFF_NUMBER`, `DESIGNATION`, `DEPARTMENT`, `GRADE`, `TITLE`, `COURSE_CODE`, `CURRENT_ROLE`, `CURRENT_APPROVER`, `STEPS_APPROVED`, `DAYS_WAITING`.
- **Steps:** `STEPS[]` is missing from the list. `RequestsTab` renders `<StepDots steps={r.STEPS} />` and calls `steps.map`, which will crash on `undefined`.

`GET requests/detail/:request_id` → the list fields + `GRADE`, `DEPARTMENT` (id) and `COURSE_CODE`, plus:
```json
{ "STEPS": [{ "REQUEST_STEP_ID": 1, "REQUEST_ID": 1, "STEP_NO": 1, "ROLE_CODE": "LINE_MANAGER", "APPROVER_ID": 2797,
              "STATUS": "PENDING", "COMMENT": null, "ACTED_AT": null, "FIRST_NAME": "ABIODUN ", "LAST_NAME": "ADEBOWALE" }],
  "HISTORY": [{ "HISTORY_ID": 1, "REQUEST_ID": 1, "ACTION_TYPE": "CREATE", "FROM_STATUS": null, "TO_STATUS": "PENDING",
                "ACTOR_ID": 1, "COMMENT": "created", "CREATED_AT": "...", "FIRST_NAME": "...", "LAST_NAME": "..." }],
  "SKILLS": [{ "SKILL_ID": 2, "SKILL_NAME": "..." }] }
```
- **Step fields:** the UI reads `s.ROLE`, but the server returns `ROLE_CODE`.
- **Missing:** `SKILL_GAPS[]`, `SESSION`, `OPEN_SESSIONS[]`.
- **Spacing:** names can have trailing spaces (`"ABIODUN "`), so trim them.

---

## Training Needs Assessment (TNA)

`POST tna/overview`
```json
{ "OPEN_ROUNDS": 1, "PROPOSED_NEEDS": 0, "APPROVED_NEEDS": 0, "DEFERRED_NEEDS": 0, "REJECTED_NEEDS": 0 }
```
The doc expects `{ ACTIVE_ROUND: round + stats }`; there is no `ACTIVE_ROUND`.

`POST tna/create_round` → `{ TNA_ID: "2" }`

`POST tna/rounds` → plain array
```json
{ "TNA_ID": 1, "COMPANY_ID": 1, "TITLE": "...", "YEAR": 2027, "DESCRIPTION": "...", "OBJECTIVES": "...",
  "START_DATE": "2026-11-09", "DEADLINE": "2026-12-09", "RESPONSIBLE_OFFICER": 2406, "STATUS": "OPEN",
  "CREATED_BY": 1, "CREATED_AT": "...", "UPDATED_AT": null }
```
- **Missing:** all the stats (`DEPARTMENT_COUNT`, `SUBMITTED_COUNT`, `NEED_COUNT`, `APPROVED_COST`, ...) and `DEPARTMENTS`. `DAYS_LEFT` is filled in by the hook.
- **Officer:** `RESPONSIBLE_OFFICER` is a staff ID, not a name.

`GET tna/round/:tna_id` → round fields + `SUBMISSIONS[]`
```json
{ "SUBMISSION_ID": 1, "TNA_ID": 1, "COMPANY_ID": 1, "DEPARTMENT_ID": 37, "SUBMITTED_BY": null, "SUBMITTED_AT": null,
  "STATUS": "DRAFT", "HR_COMMENT": null, "CREATED_AT": "...", "UPDATED_AT": null, "DEPARTMENT_NAME": "HUMAN RESOURCES" }
```
- **Created late:** submissions are **not** created with the round. A department's submission appears when it saves its first need, so a new round has `SUBMISSIONS: []` and the UI can't list "not started" departments.
- **Missing:** per-submission `NEED_COUNT`, `HIGH_PRIORITY`, `ESTIMATED_COST`, `PARTICIPANTS`, `APPROVED_COUNT`.
- **Renamed:** the comment is `HR_COMMENT`, not `REVIEW_COMMENT`.

`POST tna/save_need` → `{ NEED_ID: "1", SUBMISSION_ID: "1" }`. It only works while the round is `OPEN` (`"Departments can only submit during an OPEN TNA round"`).

`POST tna/needs` (`tna_id`) → plain array
```json
{ "NEED_ID": 1, "SUBMISSION_ID": 1, "COMPANY_ID": 1, "COURSE_ID": 1, "PROPOSED_COURSE": "", "SOURCE": "DEPARTMENT",
  "JUSTIFICATION": "...", "EXPECTED_OUTCOMES": "...", "PRIORITY": "HIGH", "EST_PARTICIPANTS": 2, "EST_COST": "200000.00",
  "STATUS": "PROPOSED", "HR_DECISION_COMMENT": null, "DECIDED_BY": null, "DECIDED_AT": null, "CREATED_BY": 1,
  "CREATED_AT": "...", "UPDATED_AT": null, "DEPARTMENT_ID": 37, "SUBMISSION_STATUS": "DRAFT",
  "DEPARTMENT_NAME": "HUMAN RESOURCES", "COURSE_TITLE": "..." }
```
Renamed compared with the UI:

| UI field | Server field |
|---|---|
| `PROPOSED_TITLE` | `PROPOSED_COURSE` |
| `EXPECTED_OUTCOME` | `EXPECTED_OUTCOMES` |
| `PARTICIPANTS` | `EST_PARTICIPANTS` |
| `ESTIMATED_COST` | `EST_COST` |
| `HR_COMMENT` | `HR_DECISION_COMMENT` |
| `TITLE` | `COURSE_TITLE` |

Missing from the list: `COURSE_CODE`, `STAFF[]`, `SKILL_IDS`, `SESSIONS[]`, `TNA_ID`.

`GET tna/submission/:submission_id` → submission fields + `ROUND_TITLE`, `ROUND_STATUS`, `NEEDS[]`. Each need has the list fields + `SKILLS: [{ SKILL_ID, SKILL_NAME }]` and `STAFF: [{ STAFF_ID, FIRST_NAME, LAST_NAME }]` (no `DESIGNATION`).

`POST tna/decide_needs` (`decided_by, decisions: [{ need_id, status, comment }]`) → `message: "Need decisions saved"` and no `data`.
`POST tna/delete_need` → `message: "Need deleted"`.
`POST tna/skill_gaps` (`department_id`) → `[]` (no staff skill data for that department yet).

Not tested, to avoid notifying departments or approvers: `tna/submit`, `tna/review`, `tna/remind`, `tna/set_round_status`, `requests/act`.

---

## Test data left on the server (company 1)

All of it is named `ZZ ... (API shape test)`.

| Record | ID | How to remove |
|---|---|---|
| Skill | 2 | `skills/remove_staff_skill { staff_skill_id: 1 }` first, then `skills/delete { skill_id: 2 }` |
| Staff skill (staff 1) | 1 | `skills/remove_staff_skill` |
| Programme | 1 | `catalogue/delete_programme` (delete the course first) |
| Course | 1 | `catalogue/delete_course`. It may be blocked because of session 743 and request 1 |
| Provider | 1 | `providers/delete` (delete the trainers first) |
| Trainers | 1, 2 | `trainers/delete` |
| Session | `TRAINING_ID` 743 | `sessions/cancel` (no delete endpoint) |
| Request | 1 (PENDING, approver staff 2797) | `requests/cancel` |
| Approval route | 1 | `requests/delete_route` |
| TNA round | 2 (DRAFT) | No delete endpoint, so the backend must remove it |
| TNA submission in real round 1 | 1 (dept 37, empty DRAFT) | No delete endpoint, so the backend must remove it |
