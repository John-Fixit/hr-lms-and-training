# HR Training — Seven Features (UI Prototype)

All seven features are built as UI prototypes inside **HR Training**. They run on mock data saved in
the browser (a yellow "Prototype" banner says so) so the screens can be reviewed before the backend exists.
Each feature has an `API_REQUIREMENTS.md` listing the tables, endpoints and rules it needs.

| # | Feature | Page | API contract | Mock hooks |
|---|---|---|---|---|
| 1 | Training Needs Assessment | `/people/hr/training/needs` | `Needs/API_REQUIREMENTS.md` | `src/API/trainingNeeds.js` |
| 2 | Skills & Competency | `/people/hr/training/skills` | `SkillsCompetency/API_REQUIREMENTS.md` | `src/API/trainingSkills.js` |
| 3 | Programme & Course Catalogue | `/people/hr/training/catalogue` | `Catalogue/API_REQUIREMENTS.md` | `src/API/trainingCatalogue.js` |
| 4 | Calendar & Scheduling | `/people/hr/training/calendar` | `Calendar/API_REQUIREMENTS.md` | `src/API/trainingSessions.js` |
| 5 | Requests & Approvals | `/people/hr/training/requests` | `Requests/API_REQUIREMENTS.md` | `src/API/trainingRequests.js` |
| 6 | Participants & Enrolment | inside each Calendar session | `Calendar/API_REQUIREMENTS.md` | `src/API/trainingSessions.js` |
| 7 | Trainers & Providers | `/people/hr/training/providers` | `Providers/API_REQUIREMENTS.md` | `src/API/trainingProviders.js` |

## How they connect
Skills (2) show low levels per department → TNA (1) turns them into department needs → approved needs
point at Catalogue courses (3), delivered by Trainers & Providers (7) → "Plan session" opens the Calendar (4)
pre-filled → staff are added by nomination, by approved Requests (5), or from TNA → Participants,
waitlist, attendance and results (6) live inside each session.

Backend build spec: [HR_TRAINING_BACKEND_API_REQUIREMENTS.md](./HR_TRAINING_BACKEND_API_REQUIREMENTS.md)

Deep links used between pages:
- `/people/hr/training/calendar?course=<id>&need=<id,id>` — schedule from TNA needs
- `/people/hr/training/calendar?course=<id>&request=<id>` — schedule for an approved request
- `/people/hr/training/calendar?session=<id>` — open a session

## Swapping in the real backend
1. Each hook in `src/API/training*.js` names its proposed endpoint. Replace the `runMock(...)` call with
   `API.post(...)` / `API.get(...)` (the existing axios instance) and keep the hook name and return shape.
2. Delete `src/API/mock/` once nothing imports it.
3. Remove `<PrototypeBanner />` from each page.
4. Filter dropdowns (department, unit, directorate, designation, grade, region) and staff pickers should
   switch to the existing org/staff endpoints noted in each contract.

## Deliberately not touched
The existing Course / Course Notification pages, create-training form, DTA, travel, finance, templates,
feedback and LMS pages are unchanged. Linking them (e.g. "pick from catalogue" in the create form, provider
and trainer pickers, real training history in `RecipientSelector`) should happen once the endpoints are live,
because those screens write to the production backend.

## Reset the demo data
Clear these localStorage keys: `communeety_training_skills_v1`, `communeety_training_catalogue_v2`,
`communeety_training_providers_v1`, `communeety_training_sessions_v1`, `communeety_training_requests_v1`,
`communeety_training_needs_v1`.
