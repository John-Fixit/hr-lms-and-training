# Skills & Competency — API Requirements

The UI at `/people/hr/training/skills` currently runs on mock data (`src/API/trainingSkills.js`).
This document lists what the backend needs to provide so the mock can be swapped for real calls.
Hook names in brackets are the frontend hooks each endpoint replaces.

Naming follows the existing training APIs: `POST training/...`, snake_case request fields,
UPPER_SNAKE response fields, `{ message, data }` envelope, errors as `{ message }`.

---

## 1. Data model

### `skill_category` (lookup)
| Field | Type | Notes |
|---|---|---|
| CATEGORY_ID | id | |
| CATEGORY_NAME | string | Technical, Leadership, Communication, Digital, Financial, Compliance, Behavioural |
| COMPANY_ID | id | |

### `skill` (the skills library)
| Field | Type | Notes |
|---|---|---|
| SKILL_ID | id | |
| SKILL_NAME | string | Unique per company (case-insensitive) |
| CATEGORY_ID | fk → skill_category | |
| DESCRIPTION | string, nullable | max 240 |
| IS_ACTIVE | 0/1 | Inactive skills stay on staff records but can't be newly assigned or searched |
| COMPANY_ID, CREATED_BY, CREATED_AT | | |

### `staff_skill` (a skill held by a staff member — current assessment)
| Field | Type | Notes |
|---|---|---|
| STAFF_SKILL_ID | id | |
| STAFF_ID | fk → staff | One row per staff + skill (unique pair) |
| SKILL_ID | fk → skill | |
| LEVEL | int 1–5 | 1 Beginner · 2 Basic · 3 Intermediate · 4 Advanced · 5 Expert |
| YEARS_EXPERIENCE | int | 0–50 |
| SOURCE | enum | `SELF`, `SUPERVISOR`, `HR` |
| STATUS | enum | `PENDING`, `VERIFIED`, `REJECTED` |
| EVIDENCE_FILE_ID / EVIDENCE_NAME | nullable | Upload via existing `attachment/addChatFile` |
| NOTE | string, nullable | max 300 |
| ASSESSED_BY | staff id / name | Who recorded this level |
| ASSESSED_AT | date | |

### `staff_skill_history` (previous assessments — never overwrite)
Same fields as `staff_skill` (LEVEL, SOURCE, STATUS, ASSESSED_BY, ASSESSED_AT, NOTE) plus
`STAFF_SKILL_ID`. A row is written every time a `staff_skill` level is updated.

### Business rules
1. `SOURCE = SELF` → `STATUS = PENDING`. `SUPERVISOR` or `HR` → `STATUS = VERIFIED`.
2. Updating a level moves the old values into `staff_skill_history` first.
3. A skill held by any staff cannot be deleted — only deactivated.
4. Who may verify/reject: HR (and later, the staff member's supervisor).

---

## 2. Endpoints

### Library
| Endpoint | Hook | Request | Response `data` |
|---|---|---|---|
| `POST training/skills/categories` | useGetSkillCategories | `{ company_id }` | `[{ CATEGORY_ID, CATEGORY_NAME }]` |
| `POST training/skills/list` | useGetSkills | `{ company_id }` | `[{ SKILL_ID, SKILL_NAME, CATEGORY_ID, CATEGORY_NAME, DESCRIPTION, IS_ACTIVE, STAFF_COUNT, VERIFIED_COUNT, AVERAGE_LEVEL }]` |
| `POST training/skills/create` | useCreateSkill | `{ company_id, skill_name, category_id, description, is_active }` | `message` |
| `POST training/skills/update` | useUpdateSkill | `{ skill_id, skill_name?, category_id?, description?, is_active? }` | `message` (partial update — used by the Active toggle) |
| `POST training/skills/delete` | useDeleteSkill | `{ skill_id }` | `message`; error if skill is held by staff |

### Directory ("who has this skill")
`POST training/skills/staff_directory` — **useGetStaffSkillDirectory**

Request (all optional):
```json
{
  "company_id": "",
  "skill_ids": ["sk-pm", "sk-report"],
  "match": "any | all",
  "min_level": 3,
  "verification": "any | verified | pending",
  "search": "name or staff number",
  "directorate": "", "department": "", "unit": "",
  "designation": "", "grade": "", "region": "",
  "page": 1, "page_size": 10
}
```
Filter rules:
- `skill_ids` + `min_level` + `match`: staff must hold any/all of the skills at `LEVEL >= min_level`.
- `verification = verified`: only VERIFIED records count as a match.
- `verification = pending`: staff with at least one PENDING record (among the matched skills, if skills are selected).
- Only active skills are returned. With no skill filter, return all staff in scope (including staff with no skills).
- Sort: highest matched level first, then last name.

Response:
```json
{
  "rows": [{
    "STAFF_ID": "", "STAFF_NUMBER": "", "FIRST_NAME": "", "LAST_NAME": "", "FILE_NAME": "",
    "DESIGNATION": "", "DIRECTORATE": "", "DEPARTMENT": "", "UNIT": "",
    "GRADE": "", "STEP": "", "REGION": "",
    "SKILLS":         [{ "STAFF_SKILL_ID": "", "SKILL_ID": "", "SKILL_NAME": "", "CATEGORY_ID": "", "CATEGORY_NAME": "", "LEVEL": 3, "STATUS": "VERIFIED" }],
    "MATCHED_SKILLS": [ "...same shape, only the skills that matched the filter..." ]
  }],
  "total": 0,
  "insights": {
    "byDepartment": [{ "label": "Finance", "count": 6 }],
    "topSkills":    [{ "skillId": "sk-report", "label": "Report & Memo Writing", "count": 24 }],
    "levelSpread":  [{ "level": 1, "count": 0 }, "... levels 1–5 for matched records"]
  }
}
```
`insights` must be calculated over the **whole** filtered result, not just the current page.
The prototype paginates client-side; with real data this should be server-side (`page`, `page_size`, `total`).

### Staff profile
| Endpoint | Hook | Request | Response `data` |
|---|---|---|---|
| `GET training/skills/staff_profile/:staff_id` | useGetStaffSkillProfile | — | Staff fields (as in a directory row) + `SKILLS: [{ STAFF_SKILL_ID, SKILL_ID, SKILL_NAME, CATEGORY_ID, CATEGORY_NAME, SKILL_IS_ACTIVE, LEVEL, YEARS_EXPERIENCE, SOURCE, STATUS, EVIDENCE_NAME, EVIDENCE_URL, NOTE, ASSESSED_BY, ASSESSED_AT, HISTORY: [{ LEVEL, SOURCE, STATUS, ASSESSED_BY, ASSESSED_AT, NOTE }] }]` |
| `POST training/skills/save_staff_skill` | useSaveStaffSkill | `{ staff_skill_id?, staff_id, skill_id, level, years_experience, source, note, file_url_id? }` | `message`. Creates, or updates (with history) if the staff already holds the skill |
| `POST training/skills/set_status` | useSetStaffSkillStatus | `{ staff_skill_id, status: "VERIFIED" \| "REJECTED", note? }` | `message` |
| `POST training/skills/remove_staff_skill` | useRemoveStaffSkill | `{ staff_skill_id }` | `message` |

### Overview tiles
`POST training/skills/overview` — **useGetSkillsOverview**
```json
{ "ACTIVE_SKILLS": 28, "CATEGORIES": 7, "TOTAL_STAFF": 72, "STAFF_WITH_SKILLS": 62,
  "TOTAL_RECORDS": 313, "VERIFIED_RECORDS": 237, "PENDING_RECORDS": 76,
  "TOP_SKILL": { "SKILL_ID": "", "SKILL_NAME": "", "STAFF_COUNT": 24 } }
```

---

## 3. Existing endpoints to reuse (no new work)
| Need | Existing endpoint / hook |
|---|---|
| Directorate, department, unit filters | `package/get_directorate`, `package/get_departments/:company_id`, `package/get_units` (`src/API/memo.js`, `src/API/officials.js`) |
| Designation, region filters | `package/get_organisation_designation`, `package/get_region/:company_id` |
| Staff picker in "Record skill" | existing staff search (`useMutateGetStaffByType`) |
| Evidence upload | `attachment/addChatFile` (`useUploadCertificate`) |

Filters should send **IDs** to the directory endpoint; the prototype uses names only because it has no real IDs.

---

## 4. Open questions
1. Can staff add their own skills from self-service (pending until verified), or only HR?
2. Should supervisors verify their own team's skills, or only HR?
3. Is the 1–5 level scale fixed, or should HR be able to configure it?
4. Do skill categories need to be managed in the UI, or is a fixed list enough?
