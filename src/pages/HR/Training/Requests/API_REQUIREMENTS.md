# Training Requests & Approval Workflow — API Requirements

UI: `/people/hr/training/requests`. Mock: `src/API/trainingRequests.js`.

This upgrades the existing request flow (`training/create`, `training/get_all_trainings`, statuses
Draft → Pending → Approved → HR Approved → Completed/Declined). The approval steps should run on the
**existing approval engine** (`useApprovedApprovalRequest` / `useDeclineApprovalRequest`, `request_id`);
what's new is that the steps come from configurable **routes**, and "return for correction" is added.

Conventions: `POST training/...`, snake_case requests, UPPER_SNAKE responses, `{ message, data }`.

---

## 1. Data model

### `training_request`
| Field | Type | Notes |
|---|---|---|
| REQUEST_ID, REFERENCE_NO | id, string | `TR/<year>/<0000>` |
| STAFF_ID | fk | who the training is for |
| SOURCE | enum | `EMPLOYEE`, `MANAGER`, `HR`, `TNA` |
| REQUEST_TYPE | enum | `CATALOGUE` (has `COURSE_ID`) or `EXTERNAL` (proposed training) |
| COURSE_ID | fk, nullable | |
| PROPOSED_TITLE, PROPOSED_PROVIDER | string | EXTERNAL only |
| TRAINING_TYPE, LOCATION, DURATION_DAYS | | from the course for CATALOGUE |
| PREFERRED_START, PREFERRED_END | date | |
| ESTIMATED_COST | number | drives the route |
| FUNDING_SOURCE | enum | `TRAINING_BUDGET`, `DEPARTMENT_BUDGET`, `SPONSOR`, `SELF` |
| JUSTIFICATION | string | min 20 chars |
| EXPECTED_OUTCOME | string | |
| SKILL_IDS | fk[] → skill | skill gap it addresses |
| ATTACHMENT | file | via `attachment/addChatFile` |
| TNA_NEED_ID | fk, nullable | |
| STATUS | enum | `DRAFT`, `PENDING`, `RETURNED`, `APPROVED`, `SCHEDULED`, `REJECTED`, `CANCELLED` |
| ROUTE_ID | fk | snapshot at submission |
| SESSION_ID | fk, nullable | set when scheduled |

### `training_request_step` (snapshot of the route at submission)
`ROLE`, `APPROVER_ID`, `APPROVER_NAME`, `STATUS` (`WAITING`, `PENDING`, `APPROVED`, `RETURNED`, `REJECTED`, `SKIPPED`), `ACTED_AT`, `COMMENT`.

### `training_request_history`
`ACTION` (`SUBMITTED`, `RESUBMITTED`, `APPROVED`, `RETURNED`, `REJECTED`, `CANCELLED`, `SCHEDULED`), `BY`, `ROLE`, `AT`, `COMMENT`.

### `training_approval_route`
| Field | Notes |
|---|---|
| ROUTE_ID, ROUTE_NAME | |
| LOCATION | `ANY`, `LOCAL`, `FOREIGN` |
| MIN_COST, MAX_COST | MAX null = no limit |
| PRIORITY | match order |
| STEPS | ordered roles: `LINE_MANAGER`, `HEAD_OF_DEPARTMENT`, `DIRECTOR`, `HR_TRAINING`, `FINANCE`, `CHIEF_EXECUTIVE` |
| IS_ACTIVE | |

### Rules
1. On submit, the first active route (by priority) matching location + cost is copied onto the request as steps. Later route edits don't affect requests in progress.
2. Approvers are resolved from the org structure: line manager = nearest senior officer in the unit (then department); head of department / director = most senior in department / directorate; one person isn't given two steps when someone else can take it; HR and DG are desks. Real build: use the existing reporting lines / organogram.
3. Only the current step's approver can act. Approve → next step, or `APPROVED` after the last. Reject and Return need a comment.
4. A returned request can be corrected and resubmitted; it resumes at the step that returned it (earlier approvals stand).
5. `APPROVED` requests are placed into an upcoming session of the course (or a new one is scheduled), which sets `SCHEDULED`.

---

## 2. Endpoints

| Endpoint | Hook | Request | Response `data` |
|---|---|---|---|
| `POST training/requests/overview` | useGetRequestsOverview | `{ company_id }` | `{ PENDING, OVERDUE (>5 days), RETURNED, AWAITING_SCHEDULING, SCHEDULED, AVERAGE_DAYS_TO_DECIDE, APPROVAL_RATE }` |
| `POST training/requests/list` | useGetTrainingRequests | `{ company_id, status? }` | `[request + STAFF_NAME, STAFF_NUMBER, DESIGNATION, DEPARTMENT, GRADE, TITLE, COURSE_CODE, STEPS[], CURRENT_ROLE, CURRENT_APPROVER, STEPS_APPROVED, DAYS_WAITING]` |
| `GET training/requests/detail/:id` | useGetTrainingRequest | — | list fields + `HISTORY[]`, `SKILL_GAPS[] { SKILL_ID, SKILL_NAME, CURRENT_LEVEL, TARGET_LEVEL, GAP }`, `SESSION`, `OPEN_SESSIONS[] { SESSION_ID, START_DATE, END_DATE, VENUE, SEATS_LEFT }` |
| `POST training/requests/preview_route` | usePreviewApprovalRoute | `{ staff_id, course_id? , location?, estimated_cost }` | `{ ROUTE_ID, ROUTE_NAME, STEPS[] { ROLE, APPROVER_NAME } }` |
| `POST training/requests/create` | useCreateTrainingRequest | request payload + `submit` | `message`, `data: { REQUEST_ID }` |
| `POST training/requests/update` | useUpdateTrainingRequest | `{ request_id, ...payload, submit, resubmit_note? }` | `message` |
| `POST training/requests/act` | useActOnTrainingRequest | `{ request_id, action: APPROVE \| REJECT \| RETURN, comment }` | `message` |
| `POST training/requests/cancel` | useCancelTrainingRequest | `{ request_id, reason }` | `message` |
| `POST training/requests/schedule` | useScheduleTrainingRequest | `{ request_id, session_id }` | `message` (enrols via sessions `add_participants`, source `REQUEST`) |
| `POST training/requests/routes` | useGetApprovalRoutes | `{ company_id }` | `[route + PENDING_REQUESTS]` |
| `POST training/requests/save_route` | useSaveApprovalRoute | `{ route_id?, route_name, location, min_cost, max_cost, steps, is_active }` | `message` |
| `POST training/requests/move_route` | useMoveApprovalRoute | `{ route_id, direction: up \| down }` | `message` |
| `POST training/requests/delete_route` | useDeleteApprovalRoute | `{ route_id }` | `message`; blocked while requests are pending on it |

### Request payload
```json
{
  "staff_id": "", "source": "EMPLOYEE",
  "request_type": "CATALOGUE", "course_id": "",
  "proposed_title": "", "proposed_provider": "", "training_type": "TRAINING", "location": "LOCAL", "duration_days": 1,
  "preferred_start": "2026-12-01", "preferred_end": "2026-12-05",
  "estimated_cost": 250000, "funding_source": "TRAINING_BUDGET",
  "justification": "", "expected_outcome": "", "skill_ids": [],
  "file_url_id": "", "tna_need_id": null,
  "submit": true
}
```

## 3. Not in the prototype
- The staff self-service form (`/people/training/request`) should use the same payload; the HR page here can raise requests on someone's behalf.
- Notifications to each approver as the request moves (existing notification endpoints).
- Budget check against a departmental training budget (budget module was parked).
