/**
 * Demo seed for the Skills & Competency UI prototype.
 * Generated deterministically so every browser sees the same data.
 * Remove once the real training/skills endpoints are live.
 */
import dayjs from "dayjs";

export const SEED_CATEGORIES = [
  { CATEGORY_ID: "cat-technical", CATEGORY_NAME: "Technical" },
  { CATEGORY_ID: "cat-leadership", CATEGORY_NAME: "Leadership" },
  { CATEGORY_ID: "cat-communication", CATEGORY_NAME: "Communication" },
  { CATEGORY_ID: "cat-digital", CATEGORY_NAME: "Digital" },
  { CATEGORY_ID: "cat-financial", CATEGORY_NAME: "Financial" },
  { CATEGORY_ID: "cat-compliance", CATEGORY_NAME: "Compliance" },
  { CATEGORY_ID: "cat-behavioural", CATEGORY_NAME: "Behavioural" },
];

const skill = (SKILL_ID, SKILL_NAME, CATEGORY_ID, DESCRIPTION, IS_ACTIVE = 1) => ({
  SKILL_ID,
  SKILL_NAME,
  CATEGORY_ID,
  DESCRIPTION,
  IS_ACTIVE,
  CREATED_AT: "2026-01-12",
});

export const SEED_SKILLS = [
  skill("sk-ai", "Airworthiness Inspection", "cat-technical", "Inspecting aircraft and records against airworthiness standards."),
  skill("sk-ac", "Aircraft Maintenance Oversight", "cat-technical", "Oversight of approved maintenance organisations and programmes."),
  skill("sk-sms", "Safety Management Systems (SMS)", "cat-technical", "Hazard identification, safety risk assessment and SMS audits."),
  skill("sk-atm", "Air Traffic Management", "cat-technical", "Oversight of air traffic services and airspace procedures."),
  skill("sk-ad", "Aerodrome Certification", "cat-technical", "Certifying and inspecting aerodromes against standards."),
  skill("sk-av", "Aviation Security", "cat-technical", "Screening, access control and security programme oversight."),
  skill("sk-net", "Network Administration", "cat-technical", "Managing LAN/WAN infrastructure, servers and connectivity."),
  skill("sk-cyber", "Cybersecurity", "cat-technical", "Protecting systems and data from digital threats."),
  skill("sk-lead", "Team Leadership", "cat-leadership", "Leading, motivating and developing a team."),
  skill("sk-strat", "Strategic Planning", "cat-leadership", "Setting direction, objectives and long-term plans."),
  skill("sk-pm", "Project Management", "cat-leadership", "Planning and delivering projects on time and budget."),
  skill("sk-change", "Change Management", "cat-leadership", "Guiding people and processes through organisational change."),
  skill("sk-report", "Report & Memo Writing", "cat-communication", "Clear official reports, memos and correspondence."),
  skill("sk-present", "Presentation Skills", "cat-communication", "Preparing and delivering effective presentations."),
  skill("sk-stake", "Stakeholder Engagement", "cat-communication", "Building relationships with internal and external stakeholders."),
  skill("sk-excel", "Advanced Excel", "cat-digital", "Formulas, pivot tables and data modelling in Excel."),
  skill("sk-data", "Data Analysis", "cat-digital", "Collecting, analysing and interpreting data for decisions."),
  skill("sk-pbi", "Power BI Reporting", "cat-digital", "Building dashboards and reports in Power BI."),
  skill("sk-lotus", "Lotus Notes Administration", "cat-digital", "Legacy mail system administration.", 0),
  skill("sk-budget", "Budgeting & Forecasting", "cat-financial", "Preparing budgets and financial forecasts."),
  skill("sk-ipsas", "IPSAS Financial Reporting", "cat-financial", "Public sector financial statements under IPSAS."),
  skill("sk-proc", "Public Procurement", "cat-financial", "Procurement planning and processes under the Procurement Act."),
  skill("sk-psr", "Public Service Rules", "cat-compliance", "Applying the Public Service Rules and financial regulations."),
  skill("sk-ndpa", "Data Protection (NDPA)", "cat-compliance", "Handling personal data in line with the Data Protection Act."),
  skill("sk-risk", "Risk Management", "cat-compliance", "Identifying, assessing and mitigating organisational risk."),
  skill("sk-audit", "Regulatory Auditing", "cat-compliance", "Planning and conducting regulatory and compliance audits."),
  skill("sk-cs", "Customer Service", "cat-behavioural", "Serving the public and stakeholders professionally."),
  skill("sk-conflict", "Conflict Resolution", "cat-behavioural", "Resolving workplace disagreements constructively."),
  skill("sk-ei", "Emotional Intelligence", "cat-behavioural", "Self-awareness and managing relationships effectively."),
];

const ORG = [
  {
    directorate: "Airworthiness Standards",
    departments: [
      { name: "Aircraft Engineering", role: "Airworthiness Inspector", units: ["Maintenance Oversight", "Aircraft Registry"], core: ["sk-ai", "sk-ac", "sk-sms", "sk-audit", "sk-report"] },
      { name: "Licensing", role: "Licensing Officer", units: ["AME Licensing", "Examinations"], core: ["sk-ai", "sk-audit", "sk-psr", "sk-report", "sk-cs"] },
    ],
  },
  {
    directorate: "Operations & Licensing",
    departments: [
      { name: "Flight Operations", role: "Flight Ops Inspector", units: ["Operator Certification", "Cabin Safety"], core: ["sk-sms", "sk-audit", "sk-risk", "sk-report", "sk-present"] },
      { name: "Personnel Licensing", role: "Licensing Officer", units: ["Pilot Licensing", "Medicals"], core: ["sk-audit", "sk-cs", "sk-psr", "sk-ndpa"] },
    ],
  },
  {
    directorate: "Aerodrome & Airspace Standards",
    departments: [
      { name: "Aerodrome Standards", role: "Aerodrome Inspector", units: ["Aerodrome Inspection", "Rescue & Firefighting"], core: ["sk-ad", "sk-sms", "sk-av", "sk-risk", "sk-audit"] },
      { name: "Air Navigation Services", role: "ANS Inspector", units: ["ATM Oversight", "CNS Oversight"], core: ["sk-atm", "sk-sms", "sk-risk", "sk-data"] },
    ],
  },
  {
    directorate: "Human Resources & Administration",
    departments: [
      { name: "Human Resources", role: "HR Officer", units: ["Training & Development", "Staff Welfare"], core: ["sk-psr", "sk-conflict", "sk-ei", "sk-report", "sk-stake", "sk-change"] },
      { name: "Administration", role: "Admin Officer", units: ["General Services", "Records"], core: ["sk-psr", "sk-cs", "sk-report", "sk-proc"] },
    ],
  },
  {
    directorate: "Finance & Accounts",
    departments: [
      { name: "Finance", role: "Accountant", units: ["Budget", "Treasury"], core: ["sk-budget", "sk-ipsas", "sk-excel", "sk-data", "sk-risk"] },
      { name: "Accounts", role: "Accountant", units: ["Payables", "Revenue"], core: ["sk-ipsas", "sk-excel", "sk-budget", "sk-proc"] },
    ],
  },
  {
    directorate: "Corporate Services",
    departments: [
      { name: "ICT", role: "Systems Analyst", units: ["Infrastructure", "Applications"], core: ["sk-net", "sk-cyber", "sk-data", "sk-pbi", "sk-pm", "sk-ndpa"] },
      { name: "Legal Services", role: "Legal Officer", units: ["Regulations", "Litigation"], core: ["sk-psr", "sk-ndpa", "sk-report", "sk-stake", "sk-risk"] },
    ],
  },
];

const GENERAL_SKILLS = [
  "sk-lead", "sk-strat", "sk-pm", "sk-change", "sk-report", "sk-present", "sk-stake",
  "sk-excel", "sk-data", "sk-cs", "sk-conflict", "sk-ei", "sk-psr",
];

const FIRST_NAMES = [
  "Adaeze", "Babatunde", "Chinedu", "Damilola", "Emeka", "Fatima", "Garba", "Halima", "Ifeanyi",
  "Jumoke", "Kehinde", "Ladi", "Musa", "Ngozi", "Olumide", "Patience", "Rasheed", "Sadiq",
  "Temitope", "Uche", "Victoria", "Yusuf", "Zainab", "Aisha", "Bolaji", "Chiamaka", "Ibrahim",
  "Funmilayo", "Hassan", "Nkechi",
];
const LAST_NAMES = [
  "Okafor", "Adeyemi", "Bello", "Eze", "Ogunleye", "Abubakar", "Nwosu", "Danjuma", "Ibekwe",
  "Afolabi", "Usman", "Okonkwo", "Balogun", "Lawal", "Chukwu", "Mohammed", "Oyelaran", "Adamu",
  "Obi", "Salami", "Ekwueme", "Yakubu",
];
const REGIONS = ["Abuja HQ", "Lagos", "Kano", "Port Harcourt", "Enugu"];
const GRADES = [7, 8, 9, 10, 10, 12, 12, 13, 13, 14, 14, 15, 16, 17];

function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function designationFor(grade, role) {
  if (grade >= 17) return "Director";
  if (grade === 16) return "Deputy Director";
  if (grade === 15) return "Assistant Director";
  if (grade === 14) return `Chief ${role}`;
  if (grade === 13) return `Assistant Chief ${role}`;
  if (grade === 12) return `Principal ${role}`;
  if (grade >= 9) return `Senior ${role}`;
  return role;
}

export function buildSkillsSeed() {
  const rand = mulberry32(20261109);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const between = (min, max) => min + Math.floor(rand() * (max - min + 1));
  const sample = (list, count) =>
    [...list].sort(() => rand() - 0.5).slice(0, Math.max(0, count));

  const departments = ORG.flatMap((d) =>
    d.departments.map((dep) => ({ ...dep, directorate: d.directorate })),
  );

  const staff = [];
  const staffSkills = [];
  let recordNo = 1;

  for (let i = 0; i < 72; i += 1) {
    const dep = departments[i % departments.length];
    const grade = pick(GRADES);
    const firstName = FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 5 + 3) % LAST_NAMES.length];
    const member = {
      STAFF_ID: `${3001 + i}`,
      STAFF_NUMBER: `STF/${String(4100 + i * 3).padStart(5, "0")}`,
      FIRST_NAME: firstName,
      LAST_NAME: lastName,
      FILE_NAME: null,
      DESIGNATION: designationFor(grade, dep.role),
      DIRECTORATE: dep.directorate,
      DEPARTMENT: dep.name,
      UNIT: pick(dep.units),
      GRADE: String(grade),
      STEP: String(between(1, 9)),
      REGION: pick(REGIONS),
    };
    staff.push(member);

    // Roughly 1 in 9 staff have no skills recorded yet.
    if (rand() < 0.11) continue;

    const coreSkills = sample(dep.core, between(2, 4));
    const extraSkills = sample(
      GENERAL_SKILLS.filter((id) => !coreSkills.includes(id)),
      between(1, 3),
    );

    [...coreSkills, ...extraSkills].forEach((skillId) => {
      const roll = rand();
      let level = roll < 0.12 ? 1 : roll < 0.35 ? 2 : roll < 0.68 ? 3 : roll < 0.9 ? 4 : 5;
      if (grade >= 14 && level < 5 && rand() < 0.3) level += 1;

      const sourceRoll = rand();
      const source = sourceRoll < 0.4 ? "SELF" : sourceRoll < 0.82 ? "SUPERVISOR" : "HR";
      const status =
        source === "SELF" ? (rand() < 0.55 ? "PENDING" : "VERIFIED") : "VERIFIED";
      const updatedAt = dayjs("2026-11-01").subtract(between(3, 420), "day");
      const assessor =
        source === "SELF"
          ? `${lastName} ${firstName}`
          : source === "HR"
            ? "HR Training Desk"
            : `${pick(LAST_NAMES)} ${pick(FIRST_NAMES)}`;

      const history =
        level > 1 && rand() < 0.35
          ? [
              {
                LEVEL: level - 1,
                SOURCE: "SUPERVISOR",
                STATUS: "VERIFIED",
                ASSESSED_BY: `${pick(LAST_NAMES)} ${pick(FIRST_NAMES)}`,
                ASSESSED_AT: updatedAt.subtract(between(180, 500), "day").format("YYYY-MM-DD"),
                NOTE: "",
              },
            ]
          : [];

      staffSkills.push({
        STAFF_SKILL_ID: `ss-${recordNo}`,
        STAFF_ID: member.STAFF_ID,
        SKILL_ID: skillId,
        LEVEL: level,
        YEARS_EXPERIENCE: between(0, 14),
        SOURCE: source,
        STATUS: status,
        EVIDENCE_NAME: rand() < 0.28 ? "certificate.pdf" : null,
        NOTE: "",
        ASSESSED_BY: assessor,
        ASSESSED_AT: updatedAt.format("YYYY-MM-DD"),
        HISTORY: history,
      });
      recordNo += 1;
    });
  }

  return {
    categories: SEED_CATEGORIES,
    skills: SEED_SKILLS,
    staff,
    staffSkills,
    nextRecordNo: recordNo,
  };
}
