/**
 * Demo seed for the Training Catalogue UI prototype.
 * Skill IDs match src/API/mock/trainingSkillsSeed.js so courses link to the Skills Library.
 * Remove once the real training/catalogue endpoints are live.
 */

const programme = (PROGRAMME_ID, PROGRAMME_NAME, DESCRIPTION, OWNER, STATUS = "ACTIVE") => ({
  PROGRAMME_ID,
  PROGRAMME_NAME,
  DESCRIPTION,
  OWNER,
  STATUS,
  CREATED_AT: "2026-01-20",
});

const SEED_PROGRAMMES = [
  programme("prg-lead", "Leadership & Management Development", "Builds supervisory, managerial and executive capability from first-line supervisors to directors.", "Head, Training & Development"),
  programme("prg-safety", "Aviation Safety & Oversight", "Technical and regulatory training for inspectors and safety oversight staff.", "Director, Airworthiness Standards"),
  programme("prg-compliance", "Regulatory & Public Service Compliance", "Mandatory and compliance training on rules, regulations and data protection.", "Head, Legal Services"),
  programme("prg-digital", "Digital Skills & Transformation", "Productivity, data and cybersecurity skills for a digital workplace.", "Head, ICT"),
  programme("prg-finance", "Finance & Procurement Excellence", "Public financial management, budgeting and procurement.", "Director, Finance & Accounts"),
  programme("prg-induction", "Induction & Onboarding", "Introduces new staff to the organisation, its rules and service standards.", "Head, Human Resources"),
  programme("prg-records", "Records Management (Legacy)", "Paper-based records training, replaced by the digital records programme.", "Head, Administration", "ARCHIVED"),
];

const course = (fields) => ({
  DESCRIPTION: "",
  OBJECTIVES: "",
  LEARNING_OUTCOMES: [],
  TARGET_AUDIENCE: "",
  TARGET_GRADES: [],
  PREREQUISITE_IDS: [],
  IS_MANDATORY: 0,
  LOCATION: "LOCAL",
  LMS_COURSE_ID: null,
  SESSIONS_RUN: 0,
  STAFF_TRAINED: 0,
  STATUS: "ACTIVE",
  UPDATED_AT: "2026-09-14",
  ...fields,
});

const primary = (SKILL_ID, TARGET_LEVEL) => ({ SKILL_ID, TARGET_LEVEL, IS_PRIMARY: 1 });
const secondary = (SKILL_ID, TARGET_LEVEL) => ({ SKILL_ID, TARGET_LEVEL, IS_PRIMARY: 0 });
const grades = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));

const SEED_COURSES = [
  course({
    COURSE_ID: "crs-ldp101", COURSE_CODE: "LDP-101", COURSE_TITLE: "Foundations of Supervision", PROGRAMME_ID: "prg-lead",
    TRAINING_TYPE: "WORKSHOP", DELIVERY_METHOD: "CLASSROOM", DURATION_DAYS: 3, DEFAULT_COST: 150000, DEFAULT_PROVIDER_ID: "prv-ipl",
    DESCRIPTION: "Practical introduction to supervising people and work for newly promoted officers.",
    OBJECTIVES: "Equip first-line supervisors to plan work, give feedback and handle common people issues.",
    LEARNING_OUTCOMES: ["Delegate tasks with clear expectations", "Give constructive feedback", "Handle minor conflicts early"],
    TARGET_AUDIENCE: "Newly promoted supervisors", TARGET_GRADES: grades(9, 12),
    SKILLS: [primary("sk-lead", 3), secondary("sk-conflict", 3), secondary("sk-report", 2)],
    SESSIONS_RUN: 4, STAFF_TRAINED: 86,
  }),
  course({
    COURSE_ID: "crs-ldp201", COURSE_CODE: "LDP-201", COURSE_TITLE: "Strategic Leadership for Senior Officers", PROGRAMME_ID: "prg-lead",
    TRAINING_TYPE: "SEMINAR", DELIVERY_METHOD: "CLASSROOM", DURATION_DAYS: 5, DEFAULT_COST: 350000, DEFAULT_PROVIDER_ID: "prv-ipl",
    DESCRIPTION: "Strategy, planning and leading change for officers moving into management.",
    OBJECTIVES: "Prepare senior officers to translate organisational goals into departmental plans.",
    LEARNING_OUTCOMES: ["Write a departmental strategic plan", "Lead a team through change", "Align KPIs to strategy"],
    TARGET_AUDIENCE: "Principal officers and above", TARGET_GRADES: grades(13, 17), PREREQUISITE_IDS: ["crs-ldp101"],
    SKILLS: [primary("sk-strat", 4), primary("sk-lead", 4), secondary("sk-change", 3)],
    SESSIONS_RUN: 2, STAFF_TRAINED: 41,
  }),
  course({
    COURSE_ID: "crs-ldp301", COURSE_CODE: "LDP-301", COURSE_TITLE: "Executive Leadership Fellowship", PROGRAMME_ID: "prg-lead",
    TRAINING_TYPE: "FELLOWSHIP", DELIVERY_METHOD: "CLASSROOM", LOCATION: "FOREIGN", DURATION_DAYS: 10, DEFAULT_COST: 4200000, DEFAULT_PROVIDER_ID: "prv-isg",
    DESCRIPTION: "International fellowship for directors on governance and executive leadership.",
    OBJECTIVES: "Develop executive-level strategic thinking and stakeholder leadership.",
    LEARNING_OUTCOMES: ["Lead cross-agency initiatives", "Engage senior stakeholders", "Benchmark against international regulators"],
    TARGET_AUDIENCE: "Directors and deputy directors", TARGET_GRADES: grades(15, 17), PREREQUISITE_IDS: ["crs-ldp201"],
    SKILLS: [primary("sk-strat", 5), secondary("sk-stake", 4)],
    SESSIONS_RUN: 1, STAFF_TRAINED: 6,
  }),
  course({
    COURSE_ID: "crs-ldp110", COURSE_CODE: "LDP-110", COURSE_TITLE: "Project Management Essentials", PROGRAMME_ID: "prg-lead",
    TRAINING_TYPE: "TRAINING", DELIVERY_METHOD: "BLENDED", DURATION_DAYS: 4, DEFAULT_COST: 220000, DEFAULT_PROVIDER_ID: "prv-hrtu",
    DESCRIPTION: "Plan, run and close projects using a simple, repeatable method.",
    LEARNING_OUTCOMES: ["Build a project plan and timeline", "Track risks and issues", "Report project status"],
    TARGET_AUDIENCE: "Officers who lead or support projects", TARGET_GRADES: grades(9, 14),
    SKILLS: [primary("sk-pm", 3), secondary("sk-excel", 2)],
    SESSIONS_RUN: 3, STAFF_TRAINED: 58,
  }),
  course({
    COURSE_ID: "crs-ldp120", COURSE_CODE: "LDP-120", COURSE_TITLE: "Managing Change in the Public Service", PROGRAMME_ID: "prg-lead",
    TRAINING_TYPE: "WORKSHOP", DELIVERY_METHOD: "CLASSROOM", DURATION_DAYS: 2, DEFAULT_COST: 120000, DEFAULT_PROVIDER_ID: "prv-ipl",
    DESCRIPTION: "Helping teams adopt new processes and systems.",
    TARGET_AUDIENCE: "Heads of unit and supervisors",
    SKILLS: [primary("sk-change", 3), secondary("sk-ei", 3)],
    STATUS: "DRAFT",
  }),
  course({
    COURSE_ID: "crs-saf101", COURSE_CODE: "SAF-101", COURSE_TITLE: "Safety Management Systems Fundamentals", PROGRAMME_ID: "prg-safety",
    TRAINING_TYPE: "TRAINING", DELIVERY_METHOD: "CLASSROOM", DURATION_DAYS: 5, DEFAULT_COST: 280000, DEFAULT_PROVIDER_ID: "prv-asa",
    DESCRIPTION: "Core SMS concepts: hazard identification, risk assessment and safety assurance.",
    OBJECTIVES: "Give every inspector a common foundation in SMS.",
    LEARNING_OUTCOMES: ["Explain the four SMS pillars", "Carry out a basic risk assessment", "Review an operator's SMS manual"],
    TARGET_AUDIENCE: "All inspectors", IS_MANDATORY: 1,
    SKILLS: [primary("sk-sms", 3), secondary("sk-risk", 2)],
    SESSIONS_RUN: 6, STAFF_TRAINED: 132,
  }),
  course({
    COURSE_ID: "crs-saf201", COURSE_CODE: "SAF-201", COURSE_TITLE: "SMS Auditing for Inspectors", PROGRAMME_ID: "prg-safety",
    TRAINING_TYPE: "TRAINING", DELIVERY_METHOD: "CLASSROOM", LOCATION: "FOREIGN", DURATION_DAYS: 10, DEFAULT_COST: 3100000, DEFAULT_PROVIDER_ID: "prv-ratc",
    DESCRIPTION: "Planning and conducting SMS audits of operators and service providers.",
    LEARNING_OUTCOMES: ["Plan a risk-based audit", "Write audit findings", "Verify corrective action plans"],
    TARGET_AUDIENCE: "Senior inspectors", TARGET_GRADES: grades(10, 15), PREREQUISITE_IDS: ["crs-saf101"],
    SKILLS: [primary("sk-sms", 4), primary("sk-audit", 4)],
    SESSIONS_RUN: 2, STAFF_TRAINED: 24,
  }),
  course({
    COURSE_ID: "crs-saf210", COURSE_CODE: "SAF-210", COURSE_TITLE: "Airworthiness Inspection Techniques", PROGRAMME_ID: "prg-safety",
    TRAINING_TYPE: "WORKSHOP", DELIVERY_METHOD: "ON_THE_JOB", DURATION_DAYS: 10, DEFAULT_COST: 0, DEFAULT_PROVIDER_ID: "prv-airw",
    DESCRIPTION: "Supervised on-the-job inspections alongside experienced inspectors.",
    TARGET_AUDIENCE: "Airworthiness inspectors in their first two years",
    SKILLS: [primary("sk-ai", 4), secondary("sk-ac", 3)],
    SESSIONS_RUN: 5, STAFF_TRAINED: 19,
  }),
  course({
    COURSE_ID: "crs-saf220", COURSE_CODE: "SAF-220", COURSE_TITLE: "Aerodrome Certification & Inspection", PROGRAMME_ID: "prg-safety",
    TRAINING_TYPE: "TRAINING", DELIVERY_METHOD: "CLASSROOM", LOCATION: "FOREIGN", DURATION_DAYS: 8, DEFAULT_COST: 2800000, DEFAULT_PROVIDER_ID: "prv-ratc",
    TARGET_AUDIENCE: "Aerodrome inspectors",
    SKILLS: [primary("sk-ad", 4), secondary("sk-sms", 3)],
    SESSIONS_RUN: 1, STAFF_TRAINED: 9,
  }),
  course({
    COURSE_ID: "crs-saf230", COURSE_CODE: "SAF-230", COURSE_TITLE: "Aviation Security Oversight", PROGRAMME_ID: "prg-safety",
    TRAINING_TYPE: "CONFERENCE", DELIVERY_METHOD: "CLASSROOM", LOCATION: "FOREIGN", DURATION_DAYS: 4, DEFAULT_COST: 1900000, DEFAULT_PROVIDER_ID: "prv-asa",
    TARGET_AUDIENCE: "Aviation security inspectors",
    SKILLS: [primary("sk-av", 3)],
    SESSIONS_RUN: 1, STAFF_TRAINED: 7,
  }),
  course({
    COURSE_ID: "crs-cmp101", COURSE_CODE: "CMP-101", COURSE_TITLE: "Public Service Rules & Financial Regulations", PROGRAMME_ID: "prg-compliance",
    TRAINING_TYPE: "SEMINAR", DELIVERY_METHOD: "CLASSROOM", DURATION_DAYS: 2, DEFAULT_COST: 80000, DEFAULT_PROVIDER_ID: "prv-hrtu",
    DESCRIPTION: "Key provisions of the Public Service Rules and Financial Regulations.",
    LEARNING_OUTCOMES: ["Apply leave, discipline and conduct rules", "Follow approval limits in the Financial Regulations"],
    TARGET_AUDIENCE: "All staff", IS_MANDATORY: 1,
    SKILLS: [primary("sk-psr", 3)],
    SESSIONS_RUN: 8, STAFF_TRAINED: 214,
  }),
  course({
    COURSE_ID: "crs-cmp110", COURSE_CODE: "CMP-110", COURSE_TITLE: "Data Protection (NDPA) Awareness", PROGRAMME_ID: "prg-compliance",
    TRAINING_TYPE: "TRAINING", DELIVERY_METHOD: "SELF_PACED", DURATION_DAYS: 1, DEFAULT_COST: 0, DEFAULT_PROVIDER_ID: "prv-elearn",
    DESCRIPTION: "Self-paced e-learning on handling personal data lawfully.",
    TARGET_AUDIENCE: "All staff", IS_MANDATORY: 1,
    SKILLS: [primary("sk-ndpa", 2)],
    SESSIONS_RUN: 1, STAFF_TRAINED: 167,
  }),
  course({
    COURSE_ID: "crs-cmp120", COURSE_CODE: "CMP-120", COURSE_TITLE: "Enterprise Risk Management", PROGRAMME_ID: "prg-compliance",
    TRAINING_TYPE: "WORKSHOP", DELIVERY_METHOD: "CLASSROOM", DURATION_DAYS: 3, DEFAULT_COST: 180000, DEFAULT_PROVIDER_ID: "prv-cri",
    TARGET_AUDIENCE: "Risk champions and heads of unit", TARGET_GRADES: grades(12, 16),
    SKILLS: [primary("sk-risk", 4), secondary("sk-audit", 2)],
    SESSIONS_RUN: 2, STAFF_TRAINED: 33,
  }),
  course({
    COURSE_ID: "crs-dig101", COURSE_CODE: "DIG-101", COURSE_TITLE: "Advanced Excel for Officers", PROGRAMME_ID: "prg-digital",
    TRAINING_TYPE: "TRAINING", DELIVERY_METHOD: "VIRTUAL", DURATION_DAYS: 3, DEFAULT_COST: 60000, DEFAULT_PROVIDER_ID: "prv-dsh",
    LEARNING_OUTCOMES: ["Use lookups and pivot tables", "Clean and summarise data", "Build simple dashboards"],
    TARGET_AUDIENCE: "Officers who work with data",
    SKILLS: [primary("sk-excel", 4), secondary("sk-data", 2)],
    SESSIONS_RUN: 5, STAFF_TRAINED: 97,
  }),
  course({
    COURSE_ID: "crs-dig110", COURSE_CODE: "DIG-110", COURSE_TITLE: "Data Analysis & Power BI", PROGRAMME_ID: "prg-digital",
    TRAINING_TYPE: "WORKSHOP", DELIVERY_METHOD: "BLENDED", DURATION_DAYS: 5, DEFAULT_COST: 250000, DEFAULT_PROVIDER_ID: "prv-dsh",
    TARGET_AUDIENCE: "Analysts and reporting officers", PREREQUISITE_IDS: ["crs-dig101"],
    SKILLS: [primary("sk-data", 4), primary("sk-pbi", 4)],
    SESSIONS_RUN: 2, STAFF_TRAINED: 31,
  }),
  course({
    COURSE_ID: "crs-dig120", COURSE_CODE: "DIG-120", COURSE_TITLE: "Cybersecurity Essentials for ICT Staff", PROGRAMME_ID: "prg-digital",
    TRAINING_TYPE: "TRAINING", DELIVERY_METHOD: "CLASSROOM", DURATION_DAYS: 5, DEFAULT_COST: 400000, DEFAULT_PROVIDER_ID: "prv-dsh",
    TARGET_AUDIENCE: "ICT department",
    SKILLS: [primary("sk-cyber", 4), secondary("sk-net", 3)],
    SESSIONS_RUN: 1, STAFF_TRAINED: 14,
  }),
  course({
    COURSE_ID: "crs-dig130", COURSE_CODE: "DIG-130", COURSE_TITLE: "Digital Workplace Basics", PROGRAMME_ID: "prg-digital",
    TRAINING_TYPE: "TRAINING", DELIVERY_METHOD: "SELF_PACED", DURATION_DAYS: 1, DEFAULT_COST: 0, DEFAULT_PROVIDER_ID: "prv-elearn",
    DESCRIPTION: "Email, shared drives and online meetings for staff new to digital tools.",
    TARGET_AUDIENCE: "All staff",
    SKILLS: [],
    STATUS: "DRAFT",
  }),
  course({
    COURSE_ID: "crs-fin101", COURSE_CODE: "FIN-101", COURSE_TITLE: "IPSAS Financial Reporting", PROGRAMME_ID: "prg-finance",
    TRAINING_TYPE: "TRAINING", DELIVERY_METHOD: "CLASSROOM", DURATION_DAYS: 4, DEFAULT_COST: 300000, DEFAULT_PROVIDER_ID: "prv-cfi",
    TARGET_AUDIENCE: "Finance & Accounts staff",
    SKILLS: [primary("sk-ipsas", 4), secondary("sk-budget", 2)],
    SESSIONS_RUN: 3, STAFF_TRAINED: 38,
  }),
  course({
    COURSE_ID: "crs-fin110", COURSE_CODE: "FIN-110", COURSE_TITLE: "Budget Preparation & Monitoring", PROGRAMME_ID: "prg-finance",
    TRAINING_TYPE: "WORKSHOP", DELIVERY_METHOD: "CLASSROOM", DURATION_DAYS: 3, DEFAULT_COST: 150000, DEFAULT_PROVIDER_ID: "prv-cfi",
    TARGET_AUDIENCE: "Budget officers and heads of department",
    SKILLS: [primary("sk-budget", 4), secondary("sk-excel", 3)],
    SESSIONS_RUN: 2, STAFF_TRAINED: 29,
  }),
  course({
    COURSE_ID: "crs-fin120", COURSE_CODE: "FIN-120", COURSE_TITLE: "Public Procurement Procedures", PROGRAMME_ID: "prg-finance",
    TRAINING_TYPE: "SEMINAR", DELIVERY_METHOD: "CLASSROOM", DURATION_DAYS: 3, DEFAULT_COST: 200000, DEFAULT_PROVIDER_ID: "prv-pti",
    TARGET_AUDIENCE: "Procurement and tenders board staff",
    SKILLS: [primary("sk-proc", 3), secondary("sk-psr", 2)],
    SESSIONS_RUN: 2, STAFF_TRAINED: 26,
  }),
  course({
    COURSE_ID: "crs-ind101", COURSE_CODE: "IND-101", COURSE_TITLE: "New Staff Induction Programme", PROGRAMME_ID: "prg-induction",
    TRAINING_TYPE: "TRAINING", DELIVERY_METHOD: "CLASSROOM", DURATION_DAYS: 5, DEFAULT_COST: 0, DEFAULT_PROVIDER_ID: "prv-hrtu",
    DESCRIPTION: "Organisation structure, mandate, rules and service standards for new staff.",
    LEARNING_OUTCOMES: ["Describe the organisation's mandate", "Know where to find key policies", "Meet service standards"],
    TARGET_AUDIENCE: "Staff in their first three months", IS_MANDATORY: 1,
    SKILLS: [primary("sk-psr", 2), secondary("sk-cs", 2), secondary("sk-report", 2)],
    SESSIONS_RUN: 4, STAFF_TRAINED: 73,
  }),
  course({
    COURSE_ID: "crs-ind110", COURSE_CODE: "IND-110", COURSE_TITLE: "Customer Service Excellence", PROGRAMME_ID: "prg-induction",
    TRAINING_TYPE: "WORKSHOP", DELIVERY_METHOD: "CLASSROOM", DURATION_DAYS: 2, DEFAULT_COST: 70000, DEFAULT_PROVIDER_ID: "prv-hrtu",
    TARGET_AUDIENCE: "Front-desk and licensing staff",
    SKILLS: [primary("sk-cs", 3), secondary("sk-conflict", 2)],
    SESSIONS_RUN: 3, STAFF_TRAINED: 52,
  }),
  course({
    COURSE_ID: "crs-rec101", COURSE_CODE: "REC-101", COURSE_TITLE: "Paper Records Management", PROGRAMME_ID: "prg-records",
    TRAINING_TYPE: "TRAINING", DELIVERY_METHOD: "CLASSROOM", DURATION_DAYS: 2, DEFAULT_COST: 50000, DEFAULT_PROVIDER_ID: "prv-admin",
    TARGET_AUDIENCE: "Registry staff",
    SKILLS: [],
    STATUS: "ARCHIVED", SESSIONS_RUN: 6, STAFF_TRAINED: 64, UPDATED_AT: "2025-03-02",
  }),
];

export function buildCatalogueSeed() {
  return {
    programmes: SEED_PROGRAMMES.map((item) => ({ ...item })),
    courses: SEED_COURSES.map((item) => ({ ...item, SKILLS: item.SKILLS.map((s) => ({ ...s })) })),
  };
}
