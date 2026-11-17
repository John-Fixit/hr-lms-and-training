# Training Calendar, Participants & Enrolment — API Requirements

UI: `/people/hr/training/calendar`. Mock: `src/API/trainingSessions.js`.
Covers feature 4 (Calendar & Scheduling) and feature 6 (Participant & Enrolment Management).

A **session** is one scheduled run of a catalogue course. In the real build it should be the
**existing training record** (`training/create`, `training/get_all_notification`, …) extended with
the fields below — not a second table. Participants map onto the existing training-staff link
(`training/view_training_staff`, `add_training_staff`, `remove_training_staff`, `send_availability`).

Conventions: `POST training/...`, snake_case requests, UPPER_SNAKE responses, `{ message, data }`.

---

## 1. Data model

### Session (= existing training record + new fields)
| Field | Type | Notes |
|---|---|---|
| SESSION_ID | id | existing `TRAINING_ID` |
| COURSE_ID | fk → training_course | **new**, required for new sessions |
| PROVIDER_ID | fk → training_provider | **new** (replaces free-text organiser) |
| TRAINER_IDS | fk[] → training_trainer | **new** link table `training_session_trainer` |
| START_DATE, END_DATE | date | existing |
| START_TIME, END_TIME | `HH:mm` | existing `TIME` + new end time |
| DELIVERY_METHOD | enum | `CLASSROOM`, `VIRTUAL`, `BLENDED`, `SELF_PACED`, `ON_THE_JOB` |
| LOCATION | enum | existing `LOCAL` / `FOREIGN` |
| VENUE, CITY | string | existing venue/state |
| MEETING_LINK | url | **new**, for virtual/blended |
| CAPACITY_MIN, CAPACITY_MAX | int | **new** |
| COST_PER_PARTICIPANT | number | existing fees |
| STATUS | enum | `SCHEDULED`, `COMPLETED`, `CANCELLED` |
| CANCEL_REASON, NOTES | string | |
| HISTORY | rows | `{ TYPE: CREATED/RESCHEDULED/CANCELLED/COMPLETED, AT, BY, NOTE }` |

Derived (not stored): `PHASE` = `UPCOMING` · `IN_PROGRESS` · `AWAITING_CLOSE` (ended, not closed) · `COMPLETED` · `CANCELLED`.

### Participant (= existing training-staff link + new fields)
| Field | Type | Notes |
|---|---|---|
| PARTICIPANT_ID | id | |
| STAFF_ID | fk | |
| STATUS | enum | `NOMINATED` → `CONFIRMED` (availability confirmed); `WAITLISTED`; `WITHDRAWN` |
| SOURCE | enum | `HR_NOMINATION`, `REQUEST`, `TNA` |
| REFERENCE_ID | id, nullable | request id when SOURCE = REQUEST |
| STATUS_NOTE | string | withdraw/replace reason |
| ATTENDANCE | rows | `training_attendance (PARTICIPANT_ID, DATE, VALUE: PRESENT/LATE/ABSENT)` |
| OUTCOME | enum, nullable | set on close: `COMPLETED` (≥75% attended, late counts), `INCOMPLETE`, `NO_SHOW` |

### Rules
1. Only `ACTIVE` catalogue courses can be scheduled.
2. Changing dates needs a `reschedule_reason`; it's logged and participants are notified. Attendance for dropped days is removed.
3. Capacity can't go below seats already held.
4. Adding staff to a full session puts them on the waitlist. Withdrawing a seated participant (reason required) promotes the oldest waitlisted person.
5. Attendance can't be taken for future days or on cancelled sessions.
6. Closing a session (only after it starts) sets every seated participant's outcome; leftover waitlist is withdrawn; feedback forms are sent (existing `review_training`).
7. Clashes are **warnings**, not blocks: same trainer, same venue (non-virtual), or same participant in overlapping sessions.
8. Eligibility flags when nominating: grade outside course target grades, missing prerequisite, already completed the course, enrolled elsewhere on the same dates. Leave clash needs the leave API (`src/API/leave.js`) — not in the prototype.

---

## 2. Endpoints

| Endpoint | Hook | Request | Response `data` |
|---|---|---|---|
| `POST training/sessions/overview` | useGetSessionsOverview | `{ company_id }` | `{ NEXT_30_DAYS, IN_PROGRESS, SESSIONS_THIS_YEAR, SEAT_FILL_RATE, UPCOMING_SEATS, SESSIONS_WITH_CLASHES, AWAITING_CLOSE, COMPLETION_RATE }` |
| `POST training/sessions/list` | useGetSessions | `{ company_id, from?, to? }` | `[session + COURSE_TITLE, COURSE_CODE, PROGRAMME_ID, PROVIDER_NAME, TRAINER_NAMES[], ENROLLED, CONFIRMED, WAITLISTED, PHASE, CLASHES[] { TYPE, SESSION_ID, MESSAGE }]` |
| `GET training/sessions/detail/:id` | useGetSession | — | list fields + `DAYS[]` + `PARTICIPANTS[]` (staff name, number, designation, department, grade, `ATTENDANCE {date: value}`, `ATTENDANCE_RATE`, `FLAGS[] { TYPE, MESSAGE }`) |
| `POST training/sessions/check_clashes` | useCheckSessionClashes | `{ session_id?, start_date, end_date, trainer_ids, venue, delivery_method }` | `CLASHES[]` |
| `POST training/sessions/eligibility` | useGetEnrolmentEligibility | `{ session_id, staff_ids }` | `{ [staff_id]: { ENROLMENT_STATUS, FLAGS[] } }` |
| `GET training/sessions/staff_history/:staff_id` | useGetStaffTrainingHistory | — | `[{ SESSION_ID, COURSE_TITLE, COURSE_CODE, START_DATE, END_DATE, SESSION_STATUS, PARTICIPANT_STATUS, OUTCOME }]` — **replaces the dummy history in `RecipientSelector`/`StaffHistoryDrawer`** |
| `POST training/sessions/create` | useCreateSession | session payload + optional `need_id` (comma-separated ids) / `request_id` | `message`, `data: { SESSION_ID }`. With `need_id`: links the needs. With `request_id`: enrols the requester and marks the request `SCHEDULED`. |
| `POST training/sessions/update` | useUpdateSession | `{ session_id, ...payload, reschedule_reason? }` | `message` |
| `POST training/sessions/cancel` | useCancelSession | `{ session_id, reason }` | `message` |
| `POST training/sessions/complete` | useCompleteSession | `{ session_id }` | `message` |
| `POST training/sessions/add_participants` | useAddSessionParticipants | `{ session_id, staff_ids, source, reference_id? }` | `message`, `data: { added, waitlisted, skipped }` |
| `POST training/sessions/participant_status` | useSetParticipantStatus | `{ session_id, participant_id, status, reason? }` | `message` |
| `POST training/sessions/replace_participant` | useReplaceParticipant | `{ session_id, participant_id, staff_id, reason? }` | `message` |
| `POST training/sessions/attendance` | useSetAttendance | `{ session_id, date, participant_id?, value }` — no `participant_id` = mark all unmarked present; `value: null` clears | `message` |

### Session payload
```json
{
  "course_id": "", "provider_id": "", "trainer_ids": [],
  "start_date": "2026-12-01", "end_date": "2026-12-04",
  "start_time": "09:00", "end_time": "16:00",
  "delivery_method": "CLASSROOM", "location": "LOCAL",
  "venue": "HQ Training Room A", "city": "Abuja", "meeting_link": "",
  "capacity_min": 5, "capacity_max": 20,
  "cost_per_participant": 300000, "notes": ""
}
```

## 3. Existing pieces reused
- DTA, travel, flight and the finance drawer stay on the existing training record.
- Email/SMS notifications: existing `send_staff_notification` / `send_directors_notification` / SMS.
- Availability confirmation (`send_availability`) sets participant `CONFIRMED`.
