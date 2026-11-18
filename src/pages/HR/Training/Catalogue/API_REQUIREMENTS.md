# Training Catalogue — API Requirements

The UI at `/people/hr/training/catalogue` currently runs on mock data (`src/API/trainingCatalogue.js`).
This lists what the backend needs so the mock can be swapped for real calls.
Hook names in brackets are the frontend hooks each endpoint replaces.

Conventions match the existing training APIs: `POST training/...`, snake_case request fields,
UPPER_SNAKE response fields, `{ message, data }` envelope, errors as `{ message }`.

---

## 1. Data model

### `training_programme`
| Field | Type | Notes |
|---|---|---|
| PROGRAMME_ID | id | |
| PROGRAMME_NAME | string | Unique per company (case-insensitive), max 100 |
| DESCRIPTION | string, nullable | max 400 |
| OWNER | string → later staff id | Officer/office responsible |
| STATUS | enum | `ACTIVE`, `ARCHIVED` |
| COMPANY_ID, CREATED_BY, CREATED_AT | | |

### `training_course` (a reusable catalogue course — not a scheduled training)
| Field | Type | Notes |
|---|---|---|
| COURSE_ID | id | |
| COURSE_CODE | string | Unique per company, `^[A-Z0-9-]{2,16}$` |
| COURSE_TITLE | string | Unique within a programme, max 120 |
| PROGRAMME_ID | fk → training_programme | |
| TRAINING_TYPE | enum | Same values as the create-training form: `SEMINAR`, `WORKSHOP`, `CONFERENCE`, `FELLOWSHIP`, `TRAINING` |
| DELIVERY_METHOD | enum | `CLASSROOM`, `VIRTUAL`, `BLENDED`, `SELF_PACED`, `ON_THE_JOB` |
| LOCATION | enum | Same values as the create-training form: `LOCAL`, `FOREIGN` |
| DURATION_DAYS | int | 1–365 |
| IS_MANDATORY | 0/1 | |
| DESCRIPTION | string | max 300 (shown on cards) |
| OBJECTIVES | string | max 600 |
| LEARNING_OUTCOMES | string[] | up to 8 (child table or JSON) |
| TARGET_AUDIENCE | string | max 120 |
| TARGET_GRADES | string[] | empty = all grades |
| DEFAULT_PROVIDER_ID | fk → training_provider, nullable | Picked from Trainers & Providers; return `DEFAULT_PROVIDER_NAME` joined in |
| DEFAULT_COST | number | Per participant, ₦ |
| LMS_COURSE_ID | nullable | `COURSE_ID` from the LMS service (`/course/get-all-courses`) |
| STATUS | enum | `DRAFT`, `ACTIVE`, `ARCHIVED` |
| UPDATED_AT, UPDATED_BY | | |

### `training_course_skill` (course → skills it builds)
| Field | Type | Notes |
|---|---|---|
| COURSE_ID | fk | |
| SKILL_ID | fk → skill (Skills & Competency) | Unique per course |
| TARGET_LEVEL | int 1–5 | Level the course takes staff to |
| IS_PRIMARY | 0/1 | Primary vs secondary outcome |

### `training_course_prerequisite`
`COURSE_ID`, `PREREQUISITE_COURSE_ID` — a course can't be its own prerequisite.

### Derived (calculated, not stored on the course)
`SESSIONS_RUN` and `STAFF_TRAINED` = counts from existing trainings linked to this course
(needs a new nullable `COURSE_ID` column on the existing training table — see §4).

### Business rules
1. Only `ACTIVE` courses can be picked when creating a training.
2. A course with training history can't be deleted — only archived.
3. A course listed as another course's prerequisite can't be deleted.
4. A programme with courses can't be deleted — only archived. Archived programmes accept no new courses.
5. Duplicating a course creates a `DRAFT` copy with code `<CODE>-COPY` (incrementing if taken) and no history.

---

## 2. Endpoints

| Endpoint | Hook | Request | Response `data` |
|---|---|---|---|
| `POST training/catalogue/overview` | useGetCatalogueOverview | `{ company_id }` | Observed backend: `{ PROGRAMMES, ACTIVE_COURSES, DRAFT_COURSES, ARCHIVED_COURSES, MANDATORY_COURSES }` |
| `POST training/catalogue/programmes` | useGetProgrammes | `{ company_id }` | Observed backend: `[{ PROGRAMME_ID, COMPANY_ID, PROGRAMME_NAME, DESCRIPTION, OWNER_STAFF_ID, STATUS, CREATED_BY, CREATED_AT, UPDATED_AT, COURSE_COUNT }]` |
| `POST training/catalogue/create_programme` | useCreateProgramme | `{ company_id, programme_name, description, owner, status }` | `message` |
| `POST training/catalogue/update_programme` | useUpdateProgramme | `{ programme_id, programme_name?, description?, owner?, status? }` | `message` (partial — also used to archive/restore) |
| `POST training/catalogue/delete_programme` | useDeleteProgramme | `{ programme_id }` | `message`; error if it has courses |
| `POST training/catalogue/courses` | useGetCatalogueCourses | `{ company_id, page?, limit? }` | Observed backend: `{ ITEMS: [course + PROGRAMME_NAME + DEFAULT_PROVIDER_NAME], PAGE, LIMIT, TOTAL }`; sample did not include `SKILLS`, `SESSIONS_RUN`, or `STAFF_TRAINED` |
| `GET training/catalogue/course/:course_id` | useGetCatalogueCourse | — | Expected to include course + `PROGRAMME_NAME`, `SKILLS[]`, `PREREQUISITES[]`, `REQUIRED_FOR[]` (each `{ COURSE_ID, COURSE_CODE, COURSE_TITLE, STATUS }`); verify live response |
| `POST training/catalogue/create_course` | useCreateCatalogueCourse | course payload (below) | `message` |
| `POST training/catalogue/update_course` | useUpdateCatalogueCourse | `{ course_id, ...course payload }` | `message` |
| `POST training/catalogue/set_course_status` | useSetCourseStatus | `{ course_id, status }` | `message` |
| `POST training/catalogue/duplicate_course` | useDuplicateCourse | `{ course_id }` | `message`, `data: { COURSE_ID }` |
| `POST training/catalogue/delete_course` | useDeleteCatalogueCourse | `{ course_id }` | `message`; error if it has history or is a prerequisite |

Skill names: `SKILLS[]` should come back with `SKILL_NAME`, `CATEGORY_ID`, `CATEGORY_NAME`
joined in. The prototype joins them on the frontend from the Skills Library.

### Course payload
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

The prototype filters courses on the client. If the catalogue grows past a few hundred
courses, add `search`, `programme_id`, `training_type`, `delivery_method`, `skill_id`,
`status`, `is_mandatory`, `without_skills`, `page`, `page_size` to `training/catalogue/courses`.

---

## 3. Existing endpoints reused
| Need | Existing |
|---|---|
| Skills to link | Skills & Competency endpoints (`training/skills/list`) |
| LMS e-learning course picker | `LMS_API GET /course/get-all-courses` (already live) |

---

## 4. Connecting to the existing training flow (next step)
Once these endpoints exist:
1. Add a nullable `course_id` to `training/create` and `training/create_training`.
2. The create-training drawer gets a "Pick from catalogue" field that pre-fills course name,
   type, location, organiser (provider), objective and fees from the course.
3. `SESSIONS_RUN` / `STAFF_TRAINED` are then counted from trainings with that `course_id`.

This step was deliberately **not** done in the prototype: the existing create form writes to the
live backend, and pre-filling it from mock catalogue data could create real trainings from sample data.

---

## 5. Open questions
1. Do new courses need approval (e.g. by the Head of Training) before they can be published?
2. Should programme owners be staff members (picker) or free text?
3. Is the course code format fixed, or does the organisation already have a coding scheme?
