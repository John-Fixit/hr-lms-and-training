# HR Training — Backend API Requirements

This document combines the API contracts for the seven HR Training features built as UI prototypes. It is intended to be shared with the backend team as the implementation target for the production API layer.

Scope:
- Training Needs Assessment (TNA)
- Skills & Competency
- Programme & Course Catalogue
- Calendar & Scheduling
- Requests & Approvals
- Participants & Enrolment
- Trainers & Providers

The feature hooks call the backend endpoints in the frontend API guide. The shared API layer validates and unwraps the backend envelope, while screens continue to consume their existing UI-facing data shapes.

## Shared conventions

- Use `POST training/...` endpoints for listing, create/update actions, and workflows.
- Request fields use `snake_case`.
- Response fields use `UPPER_SNAKE` names.
- Backend success envelope: `{ status: true, message, data }`; the shared API layer unwraps `data` and preserves `message` for mutations.
- Backend error envelope: `{ status: false, message }`; unsuccessful responses are surfaced as errors.
- Where a table or object is referenced by ID, the real build should use the company/org/staff IDs already used by the platform.

## Feature 1: Training Needs Assessment (TNA)

UI: `/people/hr/training/needs`
Mock: `src/API/trainingNeeds.js`

### 1. Data model

#### `tna_round`
| Field | Type | Notes |
|---|---|---|
| TNA_ID | id | |
| TITLE, YEAR | string, int | |
| DESCRIPTION, OBJECTIVES | string | |
| START_DATE, DEADLINE | date | |
| RESPONSIBLE_OFFICER | string → later staff id | |
| STATUS | enum | `DRAFT`, `OPEN`, `CLOSED`; only one `OPEN` at a time |
| DEPARTMENTS | dept ids | each gets a submission on creation |

#### `tna_submission`
| Field | Notes |
|---|---|
| SUBMISSION_ID, TNA_ID, DEPARTMENT | use department id in the real build |
| STATUS | `NOT_STARTED` → `DRAFT` (first need added) → `SUBMITTED` → `REVIEWED`, or `RETURNED` |
| SUBMITTED_BY, SUBMITTED_AT | | |
| REVIEW_COMMENT, REVIEWED_AT | | |

#### `tna_need`
| Field | Type | Notes |
|---|---|---|
| NEED_ID, SUBMISSION_ID, TNA_ID, DEPARTMENT | | |
| COURSE_ID | fk, nullable | catalogue course |
| PROPOSED_TITLE | string | when the training isn't in the catalogue |
| SKILL_IDS | fk[] → skill | |
| SOURCE | enum | `DEPARTMENT`, `SKILL_GAP`, `APPRAISAL`, `COMPLIANCE`, `STRATEGIC` |
| STAFF_IDS | fk[] | optional named staff |
| PARTICIPANTS | int | estimate (≥ named staff) |
| JUSTIFICATION | string | min 15 chars |
| EXPECTED_OUTCOME | string | |
| PRIORITY | enum | `HIGH`, `MEDIUM`, `LOW` |
| ESTIMATED_COST | number | defaults to course cost × participants |
| STATUS | enum | `PROPOSED`, `APPROVED`, `DEFERRED`, `REJECTED` |
| HR_COMMENT | string | required for defer/reject |
| SESSION_IDS | fk[] → session | set when planned into a session |

### 2. Business rules
1. Needs can be added/edited only while the round is `OPEN` and the submission is not `SUBMITTED`/`REVIEWED`.
2. A submission needs at least one need to be submitted.
3. HR reviews a `SUBMITTED` department: decide every need (approve / defer / reject), then mark it `REVIEWED` — or return it with a comment.
4. Needs can be decided in bulk from the register. Needs already planned into a session cannot be deferred/rejected.
5. Approved needs with a catalogue course are planned by creating a session with `need_id`. One session can serve the same course across several departments.
6. Closing a round stops further submissions; approved needs remain in the register.
7. Skill-gap suggestions combine: skills where staff sit at L1–L2 (from Skills & Competency), and the active catalogue course whose target level for that skill is >= 3, with primary skills first.
8. Real build should also pull APER Part 10 recommendations (`training_recommendation`, `training_recommendation_purpose`) as `APPRAISAL` suggestions.

### 3. Endpoints

| Endpoint | Hook | Request | Response `data` |
|---|---|---|---|
| `POST training/tna/overview` | useGetNeedsOverview | `{ company_id }` | `{ ACTIVE_ROUND }` (round + stats) |
| `POST training/tna/rounds` | useGetTnaRounds | `{ company_id }` | `[round + DEPARTMENT_COUNT, SUBMITTED_COUNT, REVIEWED_COUNT, AWAITING_REVIEW, NEED_COUNT, APPROVED_COUNT, PLANNED_COUNT, APPROVED_COST, APPROVED_PARTICIPANTS, DAYS_LEFT]` |
| `GET training/tna/round/:tna_id` | useGetTnaRound | — | round + stats + `SUBMISSIONS[]` (+ `NEED_COUNT, HIGH_PRIORITY, ESTIMATED_COST, PARTICIPANTS, APPROVED_COUNT`) |
| `POST training/tna/needs` | useGetTnaNeeds | `{ tna_id }` | `[need + TITLE, COURSE_CODE, STAFF[] { STAFF_ID, NAME, DESIGNATION }, SESSIONS[] { SESSION_ID, START_DATE, END_DATE, STATUS }]` |
| `GET training/tna/submission/:id` | useGetTnaSubmission | — | submission + `ROUND_STATUS` + `NEEDS[]` |
| `POST training/tna/skill_gaps` | useGetDepartmentSkillGaps | `{ department }` | `[{ SKILL_ID, SKILL_NAME, STAFF_IDS, STAFF_COUNT, DEPARTMENT_SIZE, SUGGESTED_COURSE }]` |
| `POST training/tna/create_round` | useCreateTnaRound | `{ title, year, description, objectives, start_date, deadline, responsible_officer, departments, status }` | `message`, `data: { TNA_ID }` |
| `POST training/tna/set_round_status` | useSetTnaRoundStatus | `{ tna_id, status: OPEN | CLOSED }` | `message` |
| `POST training/tna/save_need` | useSaveTnaNeed | `{ need_id?, submission_id, course_id?, proposed_title?, skill_ids, source, staff_ids, participants, estimated_cost, priority, justification, expected_outcome }` | `message` |
| `POST training/tna/delete_need` | useDeleteTnaNeed | `{ need_id }` | `message` |
| `POST training/tna/submit` | useSubmitTnaSubmission | `{ submission_id }` | `message` |
| `POST training/tna/review` | useReviewTnaSubmission | `{ submission_id, action: ACCEPT | RETURN, comment? }` | `message` |
| `POST training/tna/decide_needs` | useDecideTnaNeeds | `{ need_ids, status, comment? }` | `message` |
| `POST training/tna/remind` | useRemindTnaDepartments | `{ submission_ids }` | `message` (emails/SMS to department heads) |

### 4. Open questions
1. Do department heads fill submissions themselves or does HR enter them?
2. Should APER Part 10 recommendations flow in automatically as suggested needs?
3. Is an annual training plan needed after TNA, or do approved needs go straight to scheduling?

---

## Feature 2: Skills & Competency

UI: `/people/hr/training/skills`
Mock: `src/API/trainingSkills.js`

### 1. Data model

#### `skill_category`
| Field | Type | Notes |
|---|---|---|
| CATEGORY_ID | id | |
| CATEGORY_NAME | string | Technical, Leadership, Communication, Digital, Financial, Compliance, Behavioural |
| COMPANY_ID | id | |

#### `skill`
| Field | Type | Notes |
|---|---|---|
| SKILL_ID | id | |
| SKILL_NAME | string | unique per company, case-insensitive |
| CATEGORY_ID | fk → skill_category | |
| DESCRIPTION | string, nullable | max 240 |
| IS_ACTIVE | 0/1 | inactive skills stay on staff records but cannot be newly assigned/search |
| COMPANY_ID, CREATED_BY, CREATED_AT | | | |

#### `staff_skill`
| Field | Type | Notes |
|---|---|---|
| STAFF_SKILL_ID | id | |
| STAFF_ID | fk → staff | one row per staff + skill |
| SKILL_ID | fk → skill | |
| LEVEL | int 1–5 | 1 Beginner, 2 Basic, 3 Intermediate, 4 Advanced, 5 Expert |
| YEARS_EXPERIENCE | int | 0–50 |
| SOURCE | enum | `SELF`, `SUPERVISOR`, `HR` |
| STATUS | enum | `PENDING`, `VERIFIED`, `REJECTED` |
| EVIDENCE_FILE_ID / EVIDENCE_NAME | nullable | upload via existing attachment API |
| NOTE | string, nullable | max 300 |
| ASSESSED_BY | staff id / name | |
| ASSESSED_AT | date | |

#### `staff_skill_history`
Same fields as `staff_skill` plus `STAFF_SKILL_ID`, written every time a `staff_skill` level is updated.

### 2. Business rules
1. `SOURCE = SELF` → `STATUS = PENDING`. `SUPERVISOR` or `HR` → `STATUS = VERIFIED`.
2. Updating a level moves the old values into `staff_skill_history` first.
3. A skill held by any staff cannot be deleted — only deactivated.
4. Who may verify/reject: HR and, later, the staff member's supervisor.

### 3. Endpoints

#### Library
| Endpoint | Hook | Request | Response `data` |
|---|---|---|---|
| `POST training/skills/categories` | useGetSkillCategories | `{ company_id }` | `[{ CATEGORY_ID, CATEGORY_NAME }]` |
| `POST training/skills/list` | useGetSkills | `{ company_id }` | `[{ SKILL_ID, SKILL_NAME, CATEGORY_ID, CATEGORY_NAME, DESCRIPTION, IS_ACTIVE, STAFF_COUNT, VERIFIED_COUNT, AVERAGE_LEVEL }]` |
| `POST training/skills/create` | useCreateSkill | `{ company_id, skill_name, category_id, description, is_active }` | `message` |
| `POST training/skills/update` | useUpdateSkill | `{ skill_id, skill_name?, category_id?, description?, is_active? }` | `message` |
| `POST training/skills/delete` | useDeleteSkill | `{ skill_id }` | `message`; error if skill is held by staff |

#### Directory (`who has this skill`)
`POST training/skills/staff_directory` — `useGetStaffSkillDirectory`

Request example:
```json
{
  "company_id": "",
  "skill_ids": ["sk-pm", "sk-report"],
  "match": "any | all",
  "min_level": 3,
  "verification": "any | verified | pending",
  "search": "name or staff number",
  "directorate": "",
  "department": "",
  "unit": "",
  "designation": "",
  "grade": "",
  "region": "",
  "page": 1,
  "page_size": 10
}
```

Filter rules:
- `skill_ids` + `min_level` + `match`: staff must hold any/all matched skills at `LEVEL >= min_level`.
- `verification = verified`: only VERIFIED records count.
- `verification = pending`: staff with at least one PENDING record in the matching set.
- Only active skills are returned. Without skill filter, return all staff in scope.
- Sort: highest matched level first, then last name.

Response:
```json
{
  "rows": [{
    "STAFF_ID": "",
    "STAFF_NUMBER": "",
    "FIRST_NAME": "",
    "LAST_NAME": "",
    "FILE_NAME": "",
    "DESIGNATION": "",
    "DIRECTORATE": "",
    "DEPARTMENT": "",
    "UNIT": "",
    "GRADE": "",
    "STEP": "",
    "REGION": "",
    "SKILLS": [{ "STAFF_SKILL_ID": "", "SKILL_ID": "", "SKILL_NAME": "", "CATEGORY_ID": "", "CATEGORY_NAME": "", "LEVEL": 3, "STATUS": "VERIFIED" }],
    "MATCHED_SKILLS": ["...same shape, only the skills that matched the filter..."]
  }],
  "total": 0,
  "insights": {
    "byDepartment": [{ "label": "Finance", "count": 6 }],
    "topSkills": [{ "skillId": "sk-report", "label": "Report & Memo Writing", "count": 24 }],
    "levelSpread": [{ "level": 1, "count": 0 }, "... levels 1–5 for matched records"]
  }
}
```

`insights` must be calculated over the entire filtered result, not only the current page.

#### Staff profile
| Endpoint | Hook | Request | Response `data` |
|---|---|---|---|
| `GET training/skills/staff_profile/:staff_id` | useGetStaffSkillProfile | — | Staff fields + `SKILLS: [{ STAFF_SKILL_ID, SKILL_ID, SKILL_NAME, CATEGORY_ID, CATEGORY_NAME, SKILL_IS_ACTIVE, LEVEL, YEARS_EXPERIENCE, SOURCE, STATUS, EVIDENCE_NAME, EVIDENCE_URL, NOTE, ASSESSED_BY, ASSESSED_AT, HISTORY: [{ LEVEL, SOURCE, STATUS, ASSESSED_BY, ASSESSED_AT, NOTE }] }]` |
| `POST training/skills/save_staff_skill` | useSaveStaffSkill | `{ staff_skill_id?, staff_id, skill_id, level, years_experience, source, note, file_url_id? }` | `message` |
| `POST training/skills/set_status` | useSetStaffSkillStatus | `{ staff_skill_id, status: "VERIFIED" | "REJECTED", note? }` | `message` |
| `POST training/skills/remove_staff_skill` | useRemoveStaffSkill | `{ staff_skill_id }` | `message` |

#### Overview tiles
`POST training/skills/overview` — `useGetSkillsOverview`
```json
{ "ACTIVE_SKILLS": 28, "CATEGORIES": 7, "TOTAL_STAFF": 72, "STAFF_WITH_SKILLS": 62,
  "TOTAL_RECORDS": 313, "VERIFIED_RECORDS": 237, "PENDING_RECORDS": 76,
  "TOP_SKILL": { "SKILL_ID": "", "SKILL_NAME": "", "STAFF_COUNT": 24 } }
```

### 4. Existing endpoints to reuse
| Need | Existing endpoint / hook |
|---|---|
| Directorate, department, unit filters | `package/get_directorate`, `package/get_departments/:company_id`, `package/get_units` |
| Designation, region filters | `package/get_organisation_designation`, `package/get_region/:company_id` |
| Staff picker in “Record skill” | existing staff search (`useMutateGetStaffByType`) |
| Evidence upload | `attachment/addChatFile` (`useUploadCertificate`) |

### 5. Open questions
1. Can staff add their own skills from self-service or only HR?
2. Should supervisors verify their own team's skills, or only HR?
3. Is the 1–5 level scale fixed or configurable?
4. Do skill categories need to be managed in the UI, or is a fixed list enough?

---

## Feature 3: Programme & Course Catalogue

UI: `/people/hr/training/catalogue`
Mock: `src/API/trainingCatalogue.js`

### 1. Data model

#### `training_programme`
| Field | Type | Notes |
|---|---|---|
| PROGRAMME_ID | id | |
| PROGRAMME_NAME | string | unique per company, max 100 |
| DESCRIPTION | string, nullable | max 400 |
| OWNER | string → later staff id | |
| STATUS | enum | `ACTIVE`, `ARCHIVED` |
| COMPANY_ID, CREATED_BY, CREATED_AT | | |

#### `training_course`
| Field | Type | Notes |
|---|---|---|
| COURSE_ID | id | |
| COURSE_CODE | string | unique per company, `^[A-Z0-9-]{2,16}$` |
| COURSE_TITLE | string | unique within a programme, max 120 |
| PROGRAMME_ID | fk → training_programme | |
| TRAINING_TYPE | enum | `SEMINAR`, `WORKSHOP`, `CONFERENCE`, `FELLOWSHIP`, `TRAINING` |
| DELIVERY_METHOD | enum | `CLASSROOM`, `VIRTUAL`, `BLENDED`, `SELF_PACED`, `ON_THE_JOB` |
| LOCATION | enum | `LOCAL`, `FOREIGN` |
| DURATION_DAYS | int | 1–365 |
| IS_MANDATORY | 0/1 | |
| DESCRIPTION | string | max 300 |
| OBJECTIVES | string | max 600 |
| LEARNING_OUTCOMES | string[] | up to 8 |
| TARGET_AUDIENCE | string | max 120 |
| TARGET_GRADES | string[] | empty = all grades |
| DEFAULT_PROVIDER_ID | fk → training_provider, nullable | |
| DEFAULT_COST | number | per participant, ₦ |
| LMS_COURSE_ID | nullable | LMS service course ID |
| STATUS | enum | `DRAFT`, `ACTIVE`, `ARCHIVED` |
| UPDATED_AT, UPDATED_BY | | |

#### `training_course_skill`
| Field | Type | Notes |
|---|---|---|
| COURSE_ID | fk | |
| SKILL_ID | fk → skill | unique per course |
| TARGET_LEVEL | int 1–5 | level the course takes staff to |
| IS_PRIMARY | 0/1 | primary vs secondary |

#### `training_course_prerequisite`
`COURSE_ID`, `PREREQUISITE_COURSE_ID`; a course cannot be its own prerequisite.

Derived (calculated, not stored): `SESSIONS_RUN`, `STAFF_TRAINED` counted from existing training records linked to the course via `COURSE_ID`.

### 2. Business rules
1. Only `ACTIVE` courses can be picked when creating a training.
2. A course with training history cannot be deleted — only archived.
3. A course listed as another course's prerequisite cannot be deleted.
4. A programme with courses cannot be deleted — only archived. Archived programmes accept no new courses.
5. Duplicating a course creates a `DRAFT` copy with code `<CODE>-COPY` and no history.

### 3. Endpoints

| Endpoint | Hook | Request | Response `data` |
|---|---|---|---|
| `POST training/catalogue/overview` | useGetCatalogueOverview | `{ company_id }` | Observed backend: `{ PROGRAMMES, ACTIVE_COURSES, DRAFT_COURSES, ARCHIVED_COURSES, MANDATORY_COURSES }` |
| `POST training/catalogue/programmes` | useGetProgrammes | `{ company_id }` | Observed backend: `[{ PROGRAMME_ID, COMPANY_ID, PROGRAMME_NAME, DESCRIPTION, OWNER_STAFF_ID, STATUS, CREATED_BY, CREATED_AT, UPDATED_AT, COURSE_COUNT }]` |
| `POST training/catalogue/create_programme` | useCreateProgramme | `{ company_id, programme_name, description, owner, status }` | `message` |
| `POST training/catalogue/update_programme` | useUpdateProgramme | `{ programme_id, programme_name?, description?, owner?, status? }` | `message` |
| `POST training/catalogue/delete_programme` | useDeleteProgramme | `{ programme_id }` | `message` (blocked if it has courses) |
| `POST training/catalogue/courses` | useGetCatalogueCourses | `{ company_id, page?, limit? }` | Observed backend: `{ ITEMS: [course + PROGRAMME_NAME + DEFAULT_PROVIDER_NAME], PAGE, LIMIT, TOTAL }`; the sample did not include `SKILLS`, `SESSIONS_RUN`, or `STAFF_TRAINED` |
| `GET training/catalogue/course/:course_id` | useGetCatalogueCourse | — | Expected to include course + `PROGRAMME_NAME`, `SKILLS[]`, `PREREQUISITES[]`, `REQUIRED_FOR[]`; confirm against live response |
| `POST training/catalogue/create_course` | useCreateCatalogueCourse | course payload | `message` |
| `POST training/catalogue/update_course` | useUpdateCatalogueCourse | `{ course_id, ...course payload }` | `message` |
| `POST training/catalogue/set_course_status` | useSetCourseStatus | `{ course_id, status }` | `message` |
| `POST training/catalogue/duplicate_course` | useDuplicateCourse | `{ course_id }` | `message`, `data: { COURSE_ID }` |
| `POST training/catalogue/delete_course` | useDeleteCatalogueCourse | `{ course_id }` | `message` (blocked if history or prerequisite) |

#### Course payload
```json
{
  "company_id": "",
  "course_title": "Safety Management Systems Fundamentals",
  "course_code": "SAF-101",
  "programme_id": "",
  "training_type": "TRAINING",
  "delivery_method": "CLASSROOM",
  "location": "LOCAL",
  "duration_days": 5,
  "is_mandatory": true,
  "description": "",
  "objectives": "",
  "learning_outcomes": ["Explain the four SMS pillars"],
  "skills": [{ "skill_id": "", "target_level": 3, "is_primary": true }],
  "target_audience": "All inspectors",
  "target_grades": ["9", "10"],
  "prerequisite_ids": [],
  "default_provider_id": "",
  "default_cost": 280000,
  "lms_course_id": null,
  "status": "DRAFT | ACTIVE"
}
```

### 4. Existing endpoints reused
| Need | Existing |
|---|---|
| Skills to link | Skills & Competency endpoints (`training/skills/list`) |
| LMS e-learning course picker | `LMS_API GET /course/get-all-courses` |

### 5. Existing training flow connection
1. Add nullable `course_id` to `training/create` and `training/create_training`.
2. The create-training drawer gets a “Pick from catalogue” field that pre-fills name, type, location, organiser (provider), objective, and fees from the course.
3. `SESSIONS_RUN` / `STAFF_TRAINED` are counted from trainings with that `course_id`.

### 6. Open questions
1. Do new courses need approval before publication?
2. Should programme owners be staff members or free text?
3. Is the course code format fixed or does the organisation already have a coding scheme?

---

## Feature 4: Calendar & Scheduling and Feature 6: Participants & Enrolment

UI: `/people/hr/training/calendar`
Mock: `src/API/trainingSessions.js`

A session is one scheduled run of a catalogue course. In the real build it should be the existing training record extended with the fields below; participants map onto the existing training-staff link.

### 1. Data model

#### Session (= existing training record + new fields)
| Field | Type | Notes |
|---|---|---|
| SESSION_ID | id | existing `TRAINING_ID` |
| COURSE_ID | fk → training_course | required for new sessions |
| PROVIDER_ID | fk → training_provider | replaces free-text organiser |
| TRAINER_IDS | fk[] → training_trainer | link table `training_session_trainer` |
| START_DATE, END_DATE | date | existing |
| START_TIME, END_TIME | `HH:mm` | existing `TIME` + new end time |
| DELIVERY_METHOD | enum | `CLASSROOM`, `VIRTUAL`, `BLENDED`, `SELF_PACED`, `ON_THE_JOB` |
| LOCATION | enum | existing `LOCAL` / `FOREIGN` |
| VENUE, CITY | string | existing venue/state |
| MEETING_LINK | url | required for virtual/blended |
| CAPACITY_MIN, CAPACITY_MAX | int | new |
| COST_PER_PARTICIPANT | number | existing fees |
| STATUS | enum | `SCHEDULED`, `COMPLETED`, `CANCELLED` |
| CANCEL_REASON, NOTES | string | |
| HISTORY | rows | `{ TYPE: CREATED/RESCHEDULED/CANCELLED/COMPLETED, AT, BY, NOTE }` |

Derived: `PHASE` = `UPCOMING` · `IN_PROGRESS` · `AWAITING_CLOSE` · `COMPLETED` · `CANCELLED`.

#### Participant (= existing training-staff link + new fields)
| Field | Type | Notes |
|---|---|---|
| PARTICIPANT_ID | id | |
| STAFF_ID | fk | |
| STATUS | enum | `NOMINATED` → `CONFIRMED`; `WAITLISTED`; `WITHDRAWN` |
| SOURCE | enum | `HR_NOMINATION`, `REQUEST`, `TNA` |
| REFERENCE_ID | id, nullable | request id when SOURCE = REQUEST |
| STATUS_NOTE | string | withdraw/replace reason |
| ATTENDANCE | rows | `training_attendance (PARTICIPANT_ID, DATE, VALUE: PRESENT/LATE/ABSENT)` |
| OUTCOME | enum, nullable | set on close: `COMPLETED`, `INCOMPLETE`, `NO_SHOW` |

### 2. Business rules
1. Only `ACTIVE` catalogue courses can be scheduled.
2. Changing dates requires a `reschedule_reason`; it is logged and participants are notified. Attendance for dropped days is removed.
3. Capacity cannot go below seats already held.
4. Adding staff to a full session places them on the waitlist. Withdrawing a seated participant promotes the oldest waitlisted person.
5. Attendance cannot be taken for future days or on cancelled sessions.
6. Closing a session (after it starts) sets every seated participant's outcome; leftover waitlist is withdrawn; feedback forms are sent.
7. Clashes are warnings, not blocks: same trainer, same venue (non-virtual), or same participant in overlapping sessions.
8. Eligibility flags when nominating: grade outside course target grades, missing prerequisite, already completed course, enrolled elsewhere on same dates. Leave checks use the leave API, not part of prototype.

### 3. Endpoints

| Endpoint | Hook | Request | Response `data` |
|---|---|---|---|
| `POST training/sessions/overview` | useGetSessionsOverview | `{ company_id }` | `{ NEXT_30_DAYS, IN_PROGRESS, SESSIONS_THIS_YEAR, SEAT_FILL_RATE, UPCOMING_SEATS, SESSIONS_WITH_CLASHES, AWAITING_CLOSE, COMPLETION_RATE }` |
| `POST training/sessions/list` | useGetSessions | `{ company_id, from?, to? }` | `[session + COURSE_TITLE, COURSE_CODE, PROGRAMME_ID, PROVIDER_NAME, TRAINER_NAMES[], ENROLLED, CONFIRMED, WAITLISTED, PHASE, CLASHES[] { TYPE, SESSION_ID, MESSAGE }]` |
| `GET training/sessions/detail/:id` | useGetSession | — | list fields + `DAYS[]` + `PARTICIPANTS[]` (staff name/number/designation/department/grade, `ATTENDANCE`, `ATTENDANCE_RATE`, `FLAGS[]`) |
| `POST training/sessions/check_clashes` | useCheckSessionClashes | `{ session_id?, start_date, end_date, trainer_ids, venue, delivery_method }` | `CLASHES[]` |
| `POST training/sessions/eligibility` | useGetEnrolmentEligibility | `{ session_id, staff_ids }` | `{ [staff_id]: { ENROLMENT_STATUS, FLAGS[] } }` |
| `GET training/sessions/staff_history/:staff_id` | useGetStaffTrainingHistory | — | `[{ SESSION_ID, COURSE_TITLE, COURSE_CODE, START_DATE, END_DATE, SESSION_STATUS, PARTICIPANT_STATUS, OUTCOME }]` |
| `POST training/sessions/create` | useCreateSession | session payload + optional `need_id` or `request_id` | `message`, `data: { SESSION_ID }` |
| `POST training/sessions/update` | useUpdateSession | `{ session_id, ...payload, reschedule_reason? }` | `message` |
| `POST training/sessions/cancel` | useCancelSession | `{ session_id, reason }` | `message` |
| `POST training/sessions/complete` | useCompleteSession | `{ session_id }` | `message` |
| `POST training/sessions/add_participants` | useAddSessionParticipants | `{ session_id, staff_ids, source, reference_id? }` | `message`, `data: { added, waitlisted, skipped }` |
| `POST training/sessions/participant_status` | useSetParticipantStatus | `{ session_id, participant_id, status, reason? }` | `message` |
| `POST training/sessions/replace_participant` | useReplaceParticipant | `{ session_id, participant_id, staff_id, reason? }` | `message` |
| `POST training/sessions/attendance` | useSetAttendance | `{ session_id, date, participant_id?, value }` | `message` |

#### Session payload
```json
{
  "course_id": "",
  "provider_id": "",
  "trainer_ids": [],
  "start_date": "2026-12-01",
  "end_date": "2026-12-04",
  "start_time": "09:00",
  "end_time": "16:00",
  "delivery_method": "CLASSROOM",
  "location": "LOCAL",
  "venue": "HQ Training Room A",
  "city": "Abuja",
  "meeting_link": "",
  "capacity_min": 5,
  "capacity_max": 20,
  "cost_per_participant": 300000,
  "notes": ""
}
```

### 4. Existing pieces reused
- Existing training record continues to carry DTA, travel, flights, finance and other details.
- Email/SMS notifications: existing notification endpoints.
- Availability confirmation sets participant `CONFIRMED`.

---

## Feature 5: Requests & Approval Workflow

UI: `/people/hr/training/requests`
Mock: `src/API/trainingRequests.js`

This upgrades the existing request flow; the approval steps should run on the existing approval engine and route config, with “return for correction” included.

### 1. Data model

#### `training_request`
| Field | Type | Notes |
|---|---|---|
| REQUEST_ID, REFERENCE_NO | id, string | `TR/<year>/<0000>` |
| STAFF_ID | fk | who the training is for |
| SOURCE | enum | `EMPLOYEE`, `MANAGER`, `HR`, `TNA` |
| REQUEST_TYPE | enum | `CATALOGUE` or `EXTERNAL` |
| COURSE_ID | fk, nullable | |
| PROPOSED_TITLE, PROPOSED_PROVIDER | string | EXTERNAL only |
| TRAINING_TYPE, LOCATION, DURATION_DAYS | | |
| PREFERRED_START, PREFERRED_END | date | |
| ESTIMATED_COST | number | |
| FUNDING_SOURCE | enum | `TRAINING_BUDGET`, `DEPARTMENT_BUDGET`, `SPONSOR`, `SELF` |
| JUSTIFICATION | string | min 20 chars |
| EXPECTED_OUTCOME | string | |
| SKILL_IDS | fk[] → skill | |
| ATTACHMENT | file | via attachment API |
| TNA_NEED_ID | fk, nullable | |
| STATUS | enum | `DRAFT`, `PENDING`, `RETURNED`, `APPROVED`, `SCHEDULED`, `REJECTED`, `CANCELLED` |
| ROUTE_ID | fk | snapshot at submission |
| SESSION_ID | fk, nullable | set when scheduled |

#### `training_request_step`
`ROLE`, `APPROVER_ID`, `APPROVER_NAME`, `STATUS` (`WAITING`, `PENDING`, `APPROVED`, `RETURNED`, `REJECTED`, `SKIPPED`), `ACTED_AT`, `COMMENT`.

#### `training_request_history`
`ACTION` (`SUBMITTED`, `RESUBMITTED`, `APPROVED`, `RETURNED`, `REJECTED`, `CANCELLED`, `SCHEDULED`), `BY`, `ROLE`, `AT`, `COMMENT`.

#### `training_approval_route`
| Field | Notes |
|---|---|
| ROUTE_ID, ROUTE_NAME | |
| LOCATION | `ANY`, `LOCAL`, `FOREIGN` |
| MIN_COST, MAX_COST | MAX null = no limit |
| PRIORITY | match order |
| STEPS | ordered roles: `LINE_MANAGER`, `HEAD_OF_DEPARTMENT`, `DIRECTOR`, `HR_TRAINING`, `FINANCE`, `CHIEF_EXECUTIVE` |
| IS_ACTIVE | |

### 2. Business rules
1. On submit, the first active route matching location + cost is copied onto the request as steps. Later route edits do not affect requests in progress.
2. Approvers are resolved from the org structure: line manager = nearest senior officer in the unit (then department); head of department / director = most senior in department / directorate; one person is not given two steps when someone else can take it; HR and DG are desks.
3. Only the current step’s approver can act. Approve advances to the next step; reject and return require a comment.
4. A returned request can be corrected and resubmitted; it resumes at the step that returned it.
5. `APPROVED` requests are placed into an upcoming session of the course, or a new session is scheduled, which sets `SCHEDULED`.

### 3. Endpoints

| Endpoint | Hook | Request | Response `data` |
|---|---|---|---|
| `POST training/requests/overview` | useGetRequestsOverview | `{ company_id }` | `{ PENDING, OVERDUE (>5 days), RETURNED, AWAITING_SCHEDULING, SCHEDULED, AVERAGE_DAYS_TO_DECIDE, APPROVAL_RATE }` |
| `POST training/requests/list` | useGetTrainingRequests | `{ company_id, status? }` | `[request + STAFF_NAME, STAFF_NUMBER, DESIGNATION, DEPARTMENT, GRADE, TITLE, COURSE_CODE, STEPS[], CURRENT_ROLE, CURRENT_APPROVER, STEPS_APPROVED, DAYS_WAITING]` |
| `GET training/requests/detail/:id` | useGetTrainingRequest | — | list fields + `HISTORY[]`, `SKILL_GAPS[]`, `SESSION`, `OPEN_SESSIONS[]` |
| `POST training/requests/preview_route` | usePreviewApprovalRoute | `{ staff_id, course_id?, location?, estimated_cost }` | `{ ROUTE_ID, ROUTE_NAME, STEPS[] { ROLE, APPROVER_NAME } }` |
| `POST training/requests/create` | useCreateTrainingRequest | request payload + `submit` | `message`, `data: { REQUEST_ID }` |
| `POST training/requests/update` | useUpdateTrainingRequest | `{ request_id, ...payload, submit, resubmit_note? }` | `message` |
| `POST training/requests/act` | useActOnTrainingRequest | `{ request_id, action: APPROVE | REJECT | RETURN, comment }` | `message` |
| `POST training/requests/cancel` | useCancelTrainingRequest | `{ request_id, reason }` | `message` |
| `POST training/requests/schedule` | useScheduleTrainingRequest | `{ request_id, session_id }` | `message` |
| `POST training/requests/routes` | useGetApprovalRoutes | `{ company_id }` | `[route + PENDING_REQUESTS]` |
| `POST training/requests/save_route` | useSaveApprovalRoute | `{ route_id?, route_name, location, min_cost, max_cost, steps, is_active }` | `message` |
| `POST training/requests/move_route` | useMoveApprovalRoute | `{ route_id, direction: up | down }` | `message` |
| `POST training/requests/delete_route` | useDeleteApprovalRoute | `{ route_id }` | `message` |

#### Request payload
```json
{
  "staff_id": "",
  "source": "EMPLOYEE",
  "request_type": "CATALOGUE",
  "course_id": "",
  "proposed_title": "",
  "proposed_provider": "",
  "training_type": "TRAINING",
  "location": "LOCAL",
  "duration_days": 1,
  "preferred_start": "2026-12-01",
  "preferred_end": "2026-12-05",
  "estimated_cost": 250000,
  "funding_source": "TRAINING_BUDGET",
  "justification": "",
  "expected_outcome": "",
  "skill_ids": [],
  "file_url_id": "",
  "tna_need_id": null,
  "submit": true
}
```

### 4. Not in the prototype
- Staff self-service form should use the same payload.
- Notifications to each approver as the request moves.
- Budget checks against a departmental training budget were parked.

---

## Feature 7: Trainers & Providers

UI: `/people/hr/training/providers`
Mock: `src/API/trainingProviders.js`

### 1. Data model

#### `training_provider`
| Field | Type | Notes |
|---|---|---|
| PROVIDER_ID | id | |
| PROVIDER_NAME | string | unique per company, max 120 |
| PROVIDER_TYPE | enum | `INSTITUTION`, `CONSULTANT`, `INTERNAL` |
| LOCATION | enum | `LOCAL`, `FOREIGN` |
| CITY, COUNTRY | string | country required when foreign |
| CONTACT_PERSON, EMAIL, PHONE, WEBSITE | string | |
| ACCREDITATION | string | |
| ACCREDITATION_EXPIRY | date, nullable | |
| SERVICES | string[] | |
| NOTES | string | max 500 |
| STATUS | enum | `ACTIVE`, `INACTIVE` |
| COMPANY_ID, CREATED_BY, CREATED_AT | | |

#### `training_provider_document`
| Field | Type | Notes |
|---|---|---|
| DOCUMENT_ID | id | |
| PROVIDER_ID | fk | |
| DOCUMENT_NAME | string | |
| DOCUMENT_TYPE | enum | `CONTRACT`, `ACCREDITATION`, `TAX`, `PROFILE`, `OTHER` |
| EXPIRY_DATE | date, nullable | |
| FILE_URL_ID / FILE_URL | | upload via attachment API |

#### `training_trainer`
| Field | Type | Notes |
|---|---|---|
| TRAINER_ID | id | |
| TRAINER_TYPE | enum | `INTERNAL` or `EXTERNAL` |
| STAFF_ID | fk → staff, nullable | required for INTERNAL |
| FULL_NAME | string | |
| PROVIDER_ID | fk → training_provider, nullable | required for EXTERNAL |
| TITLE | string | for internal trainer: designation |
| EMAIL, PHONE | string | |
| EXPERTISE_SKILL_IDS | fk[] → skill | |
| QUALIFICATIONS | string[] | |
| YEARS_EXPERIENCE | int | 0–60 |
| BIO | string | max 400 |
| STATUS | enum | `ACTIVE`, `INACTIVE` |

#### Engagement history
Existing training records should carry `PROVIDER_ID` and a trainer link table (`TRAINING_ID`, `TRAINER_ID`). Each engagement row is:
`{ ENGAGEMENT_ID (= TRAINING_ID), PROVIDER_ID, TRAINER_IDS, TRAINER_NAMES, COURSE_ID, COURSE_TITLE, START_DATE, END_DATE, PARTICIPANTS, TOTAL_COST, RESPONSES, RATING_OVERALL, RATINGS }`

#### Ratings
From feedback form responses:
| Key | Description |
|---|---|
| `RATING_OVERALL` | overall course rating |
| `PRESENTATION` | trainer presentation |
| `KNOWLEDGE` | knowledge & command |
| `TRAINING_AIDS` | use of aids |
| `INTERACTION` | open exchange of ideas |

- Provider rating = average `RATING_OVERALL` across its engagements.
- Trainer rating = average of the four trainer questions across sessions they delivered.

### 2. Business rules
1. A provider with engagements, trainers, or catalogue courses using it cannot be deleted — only deactivated.
2. A trainer who has delivered sessions cannot be deleted — only deactivated.
3. Inactive providers/trainers are not offered in pickers, but remain on historic records.
4. Document alert: `EXPIRED` if any document/accreditation date has passed, `EXPIRING` if within 60 days.

### 3. Endpoints

| Endpoint | Hook | Request | Response `data` |
|---|---|---|---|
| `POST training/providers/overview` | useGetProvidersOverview | `{ company_id }` | `{ ACTIVE_PROVIDERS, INTERNAL_PROVIDERS, EXTERNAL_PROVIDERS, ACTIVE_TRAINERS, INTERNAL_TRAINERS, EXTERNAL_TRAINERS, AVERAGE_RATING, RATED_ENGAGEMENTS, DOCUMENT_ALERTS }` |
| `POST training/providers/list` | useGetProviders | `{ company_id }` | `[provider + DOCUMENTS[] + ENGAGEMENTS, LAST_ENGAGED, AVERAGE_RATING, PARTICIPANTS_TOTAL, SPEND_TOTAL, TRAINER_COUNT, COURSE_COUNT, DOCUMENT_ALERT]` |
| `GET training/providers/detail/:provider_id` | useGetProvider | — | list fields + `RATING_BREAKDOWN`, `ENGAGEMENT_HISTORY[]`, `TRAINERS[]`, `COURSES[]` |
| `POST training/providers/create` | useCreateProvider | provider payload | `message` |
| `POST training/providers/update` | useUpdateProvider | `{ provider_id, ...provider payload }` | `message` |
| `POST training/providers/set_status` | useSetProviderStatus | `{ provider_id, status }` | `message` |
| `POST training/providers/delete` | useDeleteProvider | `{ provider_id }` | `message` |
| `POST training/trainers/list` | useGetTrainers | `{ company_id }` | `[trainer + PROVIDER_NAME, SESSIONS_DELIVERED, LAST_ENGAGED, AVERAGE_RATING]` |
| `GET training/trainers/detail/:trainer_id` | useGetTrainer | — | list fields + `PARTICIPANTS_TOTAL`, `RATING_BREAKDOWN`, `ENGAGEMENT_HISTORY[]` |
| `POST training/trainers/create` | useCreateTrainer | trainer payload | `message` |
| `POST training/trainers/update` | useUpdateTrainer | `{ trainer_id, ...trainer payload }` | `message` |
| `POST training/trainers/set_status` | useSetTrainerStatus | `{ trainer_id, status }` | `message` |
| `POST training/trainers/delete` | useDeleteTrainer | `{ trainer_id }` | `message` |

#### Provider payload
```json
{
  "company_id": "",
  "provider_name": "Aviation Safety Academy",
  "provider_type": "INSTITUTION",
  "location": "LOCAL",
  "city": "Lagos",
  "country": "Nigeria",
  "contact_person": "",
  "email": "",
  "phone": "",
  "website": "",
  "accreditation": "ICAO TRAINAIR PLUS Associate Member",
  "accreditation_expiry": "2026-12-15",
  "services": ["Safety management"],
  "documents": [{ "document_id": null, "document_name": "Service agreement", "document_type": "CONTRACT", "expiry_date": "2026-12-31", "file_url_id": "" }],
  "notes": "",
  "status": "ACTIVE"
}
```

`documents` is the full list: new rows without `document_id` are created; missing ids are removed.

#### Trainer payload
```json
{
  "company_id": "",
  "trainer_type": "INTERNAL | EXTERNAL",
  "staff_id": "3010",
  "full_name": "",
  "title": "",
  "department": "",
  "provider_id": "",
  "email": "",
  "phone": "",
  "expertise_skill_ids": ["sk-sms"],
  "qualifications": ["ICAO SMS Instructor"],
  "years_experience": 12,
  "bio": "",
  "status": "ACTIVE"
}
```

### 4. Existing endpoints reused
| Need | Existing |
|---|---|
| Internal trainer staff picker | existing staff search |
| Document upload | `attachment/addChatFile` |
| Ratings | existing `training/review_training` responses |
| “Can teach” skills | Skills & Competency `training/skills/list` |

### 5. Connecting to the existing training flow
1. Add nullable `provider_id` and a trainer list to `training/create` / `training/create_training`.
2. The create-training drawer’s free-text Training Organiser becomes a provider picker (pre-filled from default provider on a course), plus a trainers picker filtered by provider.
3. Engagement history and ratings then come from real trainings and feedback.

### 6. Open questions
1. Should external providers ever log in or upload attendance/materials, or are they records only?
2. Does procurement need to approve a provider before HR can use it?
3. Should HR also rate providers directly beyond course feedback?

---

## Cross-feature integrations and dependencies

### Core integration points
- Skills library is the reference source for skill IDs and skill levels used by TNA, course mappings, and trainer expertise.
- Catalogue courses are the canonical training inventory used for scheduling and training requests.
- Session records are the reusable training instances tied to a course, provider, and set of participants.
- Requests and schedules flow from approved TNA needs and employee/manager training requests.
- Provider and trainer records are used both in the catalogue default provider and when creating or updating sessions.

### Shared IDs and links
- `company_id` should be required on most listing and create endpoints.
- `department_id`, `directorate_id`, `unit_id`, `grade_id`, and `staff_id` should be consistent with existing org/staff models.
- `need_id` and `request_id` should be linkable to sessions when they are planned.
- `course_id` should be created as a nullable field on the underlying training record so the full training history and catalogue metrics can be joined.

### Implementation priority
1. Skills & Competency
2. Programme & Course Catalogue
3. Providers & Trainers
4. TNA
5. Calendar, Participants & Enrolment
6. Requests & Approvals

This ordering lets each module populate the objects that depend on it before the workflow is fully wired.

## Final notes for backend implementation
- The UI screens are already designed around the endpoint names and shapes above.
- The prototype is intentionally separated from the production backend; the goal is to avoid large front-end rewrites when the API layer is added.
- The backend should preserve the same naming conventions and response envelopes across all modules so the mock-to-live swap is minimal.
