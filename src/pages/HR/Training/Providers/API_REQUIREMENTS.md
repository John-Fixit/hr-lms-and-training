# Trainers & Providers — API Requirements

The UI at `/people/hr/training/providers` currently runs on mock data (`src/API/trainingProviders.js`).
This lists what the backend needs so the mock can be swapped for real calls.
Hook names in brackets are the frontend hooks each endpoint replaces.

Conventions match the existing training APIs: `POST training/...`, snake_case request fields,
UPPER_SNAKE response fields, `{ message, data }` envelope, errors as `{ message }`.

---

## 1. Data model

### `training_provider`
| Field | Type | Notes |
|---|---|---|
| PROVIDER_ID | id | |
| PROVIDER_NAME | string | Unique per company (case-insensitive), max 120 |
| PROVIDER_TYPE | enum | `INSTITUTION`, `CONSULTANT`, `INTERNAL` (an in-house unit) |
| LOCATION | enum | `LOCAL`, `FOREIGN` (same values as the create-training form) |
| CITY, COUNTRY | string | Country required when `FOREIGN` |
| CONTACT_PERSON, EMAIL, PHONE, WEBSITE | string | Email and URL validated |
| ACCREDITATION | string | Accrediting body / certificate |
| ACCREDITATION_EXPIRY | date, nullable | |
| SERVICES | string[] | Free tags |
| NOTES | string | max 500 |
| STATUS | enum | `ACTIVE`, `INACTIVE` |
| COMPANY_ID, CREATED_BY, CREATED_AT | | |

### `training_provider_document`
| Field | Type | Notes |
|---|---|---|
| DOCUMENT_ID | id | |
| PROVIDER_ID | fk | |
| DOCUMENT_NAME | string | |
| DOCUMENT_TYPE | enum | `CONTRACT`, `ACCREDITATION`, `TAX`, `PROFILE`, `OTHER` |
| EXPIRY_DATE | date, nullable | |
| FILE_URL_ID / FILE_URL | | Upload via existing `attachment/addChatFile` |

### `training_trainer`
| Field | Type | Notes |
|---|---|---|
| TRAINER_ID | id | |
| TRAINER_TYPE | enum | `INTERNAL` (a staff member) or `EXTERNAL` |
| STAFF_ID | fk → staff, nullable | Required for INTERNAL, unique across trainers |
| FULL_NAME | string | INTERNAL: from the staff record |
| PROVIDER_ID | fk → training_provider, nullable | Required for EXTERNAL (non-internal provider). Optional for INTERNAL (an internal unit) |
| TITLE | string | INTERNAL: staff designation |
| EMAIL, PHONE | string | |
| EXPERTISE_SKILL_IDS | fk[] → skill | "Can teach" — at least one (child table) |
| QUALIFICATIONS | string[] | |
| YEARS_EXPERIENCE | int | 0–60 |
| BIO | string | max 400 |
| STATUS | enum | `ACTIVE`, `INACTIVE` |

### Engagement history (derived — no new table if trainings get these links)
An engagement is an **existing training** delivered by the provider. It needs, on the existing
training record: `PROVIDER_ID` and a `training_trainer` link table (`TRAINING_ID`, `TRAINER_ID`).
Then each engagement row is:
`{ ENGAGEMENT_ID (= TRAINING_ID), PROVIDER_ID, TRAINER_IDS, TRAINER_NAMES, COURSE_ID, COURSE_TITLE, START_DATE, END_DATE, PARTICIPANTS, TOTAL_COST, RESPONSES, RATING_OVERALL, RATINGS }`

### Ratings (from the existing feedback form)
Participants already rate trainers in `TrainingFeedbackReviewForm` (submitted via `training/review_training`).
Ratings here are averages of those answers:
| Key | Feedback question |
|---|---|
| `RATING_OVERALL` | "Overall, how would you rate this course?" (1–5) |
| `PRESENTATION` | Trainer — a) Presentation |
| `KNOWLEDGE` | Trainer — b) Knowledge & command of subject |
| `TRAINING_AIDS` | Trainer — c) Use of training aids |
| `INTERACTION` | Trainer — d) Open exchange of ideas, participation & group interaction |

- Provider rating = average `RATING_OVERALL` across its engagements.
- Trainer rating = average of the four trainer questions across the sessions they delivered.

### Business rules
1. A provider with engagements, trainers, or catalogue courses using it can't be deleted — only deactivated.
2. A trainer who has delivered sessions can't be deleted — only deactivated.
3. Inactive providers/trainers aren't offered in pickers, but stay on historic records.
4. Document alert: `EXPIRED` if any document/accreditation date has passed, `EXPIRING` if within 60 days.

---

## 2. Endpoints

| Endpoint | Hook | Request | Response `data` |
|---|---|---|---|
| `POST training/providers/overview` | useGetProvidersOverview | `{ company_id }` | `{ ACTIVE_PROVIDERS, INTERNAL_PROVIDERS, EXTERNAL_PROVIDERS, ACTIVE_TRAINERS, INTERNAL_TRAINERS, EXTERNAL_TRAINERS, AVERAGE_RATING, RATED_ENGAGEMENTS, DOCUMENT_ALERTS }` |
| `POST training/providers/list` | useGetProviders | `{ company_id }` | `[provider + DOCUMENTS[] + ENGAGEMENTS, LAST_ENGAGED, AVERAGE_RATING, PARTICIPANTS_TOTAL, SPEND_TOTAL, TRAINER_COUNT, COURSE_COUNT, DOCUMENT_ALERT]` |
| `GET training/providers/detail/:provider_id` | useGetProvider | — | list fields + `RATING_BREAKDOWN { PRESENTATION, KNOWLEDGE, TRAINING_AIDS, INTERACTION }`, `ENGAGEMENT_HISTORY[]`, `TRAINERS[] { TRAINER_ID, FULL_NAME, TITLE, TRAINER_TYPE, STATUS }`, `COURSES[] { COURSE_ID, COURSE_CODE, COURSE_TITLE, STATUS }` |
| `POST training/providers/create` | useCreateProvider | provider payload (below) | `message` |
| `POST training/providers/update` | useUpdateProvider | `{ provider_id, ...provider payload }` | `message` |
| `POST training/providers/set_status` | useSetProviderStatus | `{ provider_id, status }` | `message` |
| `POST training/providers/delete` | useDeleteProvider | `{ provider_id }` | `message`; error per rule 1 |
| `POST training/trainers/list` | useGetTrainers | `{ company_id }` | `[trainer + PROVIDER_NAME, SESSIONS_DELIVERED, LAST_ENGAGED, AVERAGE_RATING]` |
| `GET training/trainers/detail/:trainer_id` | useGetTrainer | — | list fields + `PARTICIPANTS_TOTAL`, `RATING_BREAKDOWN`, `ENGAGEMENT_HISTORY[]` (with `PROVIDER_NAME`) |
| `POST training/trainers/create` | useCreateTrainer | trainer payload (below) | `message` |
| `POST training/trainers/update` | useUpdateTrainer | `{ trainer_id, ...trainer payload }` | `message` |
| `POST training/trainers/set_status` | useSetTrainerStatus | `{ trainer_id, status }` | `message` |
| `POST training/trainers/delete` | useDeleteTrainer | `{ trainer_id }` | `message`; error per rule 2 |

### Provider payload
```json
{
  "company_id": "",
  "provider_name": "Aviation Safety Academy",
  "provider_type": "INSTITUTION",
  "location": "LOCAL", "city": "Lagos", "country": "Nigeria",
  "contact_person": "", "email": "", "phone": "", "website": "",
  "accreditation": "ICAO TRAINAIR PLUS Associate Member",
  "accreditation_expiry": "2026-12-15",
  "services": ["Safety management"],
  "documents": [{ "document_id": null, "document_name": "Service agreement", "document_type": "CONTRACT", "expiry_date": "2026-12-31", "file_url_id": "" }],
  "notes": "",
  "status": "ACTIVE"
}
```
`documents` is the full list: rows without `document_id` are new, missing ids are removed.

### Trainer payload
```json
{
  "company_id": "",
  "trainer_type": "INTERNAL | EXTERNAL",
  "staff_id": "3010",
  "full_name": "", "title": "", "department": "",
  "provider_id": "",
  "email": "", "phone": "",
  "expertise_skill_ids": ["sk-sms"],
  "qualifications": ["ICAO SMS Instructor"],
  "years_experience": 12,
  "bio": "",
  "status": "ACTIVE"
}
```

---

## 3. Existing endpoints reused
| Need | Existing |
|---|---|
| Internal trainer staff picker | existing staff search (`useMutateGetStaffByType`) |
| Document upload | `attachment/addChatFile` (`useUploadCertificate`) |
| Ratings | answers already submitted through `training/review_training` |
| "Can teach" skills | Skills & Competency `training/skills/list` |

---

## 4. Connecting to the existing training flow (next step)
1. Add nullable `provider_id` and a trainers list to `training/create` / `training/create_training`.
2. The create-training drawer's free-text **Training Organiser** becomes a provider picker (pre-filled
   from the catalogue course's default provider), plus a trainers picker filtered by provider.
3. Engagement history and ratings then come from real trainings and feedback.

Not done in the prototype for the same reason as the catalogue: that form writes to the live backend.

---

## 5. Open questions
1. Should external providers ever log in (e.g. to upload attendance or materials), or are they records only?
2. Does Procurement need to approve a provider before HR can use it (e.g. a "pending vetting" status)?
3. Should HR also rate providers directly (cost, reliability), or are participant ratings enough?
