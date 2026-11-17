/**
 * Demo seed for the Trainers & Providers UI prototype.
 * Provider IDs match DEFAULT_PROVIDER_ID in trainingCatalogueSeed.js; internal trainers are
 * real staff from trainingSkillsSeed.js; engagements reference catalogue courses.
 * Remove once the real training/providers endpoints are live.
 */
import dayjs from "dayjs";
import { buildCatalogueSeed } from "./trainingCatalogueSeed";
import { buildSkillsSeed } from "./trainingSkillsSeed";

const doc = (DOCUMENT_ID, DOCUMENT_NAME, DOCUMENT_TYPE, EXPIRY_DATE = null) => ({
  DOCUMENT_ID,
  DOCUMENT_NAME,
  DOCUMENT_TYPE,
  EXPIRY_DATE,
});

const provider = (fields) => ({
  LOCATION: "LOCAL",
  CITY: "Abuja",
  COUNTRY: "Nigeria",
  CONTACT_PERSON: "",
  EMAIL: "",
  PHONE: "",
  WEBSITE: "",
  ACCREDITATION: "",
  ACCREDITATION_EXPIRY: null,
  SERVICES: [],
  DOCUMENTS: [],
  NOTES: "",
  STATUS: "ACTIVE",
  CREATED_AT: "2026-01-15",
  ...fields,
});

const SEED_PROVIDERS = [
  provider({
    PROVIDER_ID: "prv-ipl", PROVIDER_NAME: "Institute of Public Leadership", PROVIDER_TYPE: "INSTITUTION",
    CONTACT_PERSON: "Mrs. Ifeoma Nnaji", EMAIL: "programmes@ipl.example.ng", PHONE: "+234 803 555 0142", WEBSITE: "https://ipl.example.ng",
    ACCREDITATION: "Federal Training Institution Licence FTI/0457", ACCREDITATION_EXPIRY: "2027-03-31",
    SERVICES: ["Leadership", "Management", "Change management"],
    DOCUMENTS: [doc("d-ipl-1", "Framework agreement 2026–2027", "CONTRACT", "2027-12-31"), doc("d-ipl-2", "Tax clearance certificate", "TAX", "2026-12-31")],
  }),
  provider({
    PROVIDER_ID: "prv-isg", PROVIDER_NAME: "International School of Governance", PROVIDER_TYPE: "INSTITUTION",
    LOCATION: "FOREIGN", CITY: "Geneva", COUNTRY: "Switzerland",
    CONTACT_PERSON: "Dr. Helen Brooks", EMAIL: "fellowships@isg.example.org", PHONE: "+41 22 555 0190", WEBSITE: "https://isg.example.org",
    ACCREDITATION: "European Quality Improvement System (EQUIS)", ACCREDITATION_EXPIRY: "2028-06-30",
    SERVICES: ["Executive education", "Public governance"],
    DOCUMENTS: [doc("d-isg-1", "Fellowship placement agreement", "CONTRACT", "2027-06-30")],
  }),
  provider({
    PROVIDER_ID: "prv-hrtu", PROVIDER_NAME: "HR Training Unit", PROVIDER_TYPE: "INTERNAL",
    CONTACT_PERSON: "Head, Training & Development", EMAIL: "training@hq.example.gov.ng", PHONE: "Ext. 2210",
    SERVICES: ["Induction", "Public Service Rules", "Soft skills"],
    NOTES: "Runs in-house courses in the HQ training rooms.",
  }),
  provider({
    PROVIDER_ID: "prv-airw", PROVIDER_NAME: "Airworthiness Standards (in-house)", PROVIDER_TYPE: "INTERNAL",
    CONTACT_PERSON: "Director, Airworthiness Standards", EMAIL: "airworthiness@hq.example.gov.ng",
    SERVICES: ["On-the-job inspection training"],
  }),
  provider({
    PROVIDER_ID: "prv-elearn", PROVIDER_NAME: "E-learning (LMS)", PROVIDER_TYPE: "INTERNAL",
    CONTACT_PERSON: "LMS Administrator", EMAIL: "lms@hq.example.gov.ng",
    SERVICES: ["Self-paced courses", "Compliance awareness"],
  }),
  provider({
    PROVIDER_ID: "prv-admin", PROVIDER_NAME: "Administration (in-house)", PROVIDER_TYPE: "INTERNAL",
    SERVICES: ["Records management"], STATUS: "INACTIVE",
    NOTES: "Paper records training was retired in 2025.",
  }),
  provider({
    PROVIDER_ID: "prv-asa", PROVIDER_NAME: "Aviation Safety Academy", PROVIDER_TYPE: "INSTITUTION", CITY: "Lagos",
    CONTACT_PERSON: "Capt. Tunde Bakare", EMAIL: "courses@asa.example.ng", PHONE: "+234 802 555 0118", WEBSITE: "https://asa.example.ng",
    ACCREDITATION: "ICAO TRAINAIR PLUS Associate Member", ACCREDITATION_EXPIRY: "2026-12-15",
    SERVICES: ["Safety management", "Aviation security", "Inspector training"],
    DOCUMENTS: [doc("d-asa-1", "Service agreement 2026", "CONTRACT", "2026-12-31"), doc("d-asa-2", "ICAO TRAINAIR PLUS certificate", "ACCREDITATION", "2026-12-15")],
  }),
  provider({
    PROVIDER_ID: "prv-ratc", PROVIDER_NAME: "Regional Aviation Training Centre", PROVIDER_TYPE: "INSTITUTION",
    LOCATION: "FOREIGN", CITY: "Nairobi", COUNTRY: "Kenya",
    CONTACT_PERSON: "Mr. Peter Mwangi", EMAIL: "registrar@ratc.example.org", PHONE: "+254 20 555 0175", WEBSITE: "https://ratc.example.org",
    ACCREDITATION: "ICAO TRAINAIR PLUS Full Member", ACCREDITATION_EXPIRY: "2028-02-28",
    SERVICES: ["SMS auditing", "Aerodrome certification", "Air navigation"],
    DOCUMENTS: [doc("d-ratc-1", "Memorandum of understanding", "CONTRACT", "2028-02-28")],
  }),
  provider({
    PROVIDER_ID: "prv-cri", PROVIDER_NAME: "Chartered Risk Institute", PROVIDER_TYPE: "INSTITUTION", CITY: "Lagos",
    CONTACT_PERSON: "Dr. Musa Garba", EMAIL: "training@cri.example.ng", PHONE: "+234 809 555 0163",
    ACCREDITATION: "Professional body charter", SERVICES: ["Risk management", "Internal control"],
    DOCUMENTS: [doc("d-cri-1", "Tax clearance certificate", "TAX", "2026-11-30")],
  }),
  provider({
    PROVIDER_ID: "prv-dsh", PROVIDER_NAME: "Digital Skills Hub", PROVIDER_TYPE: "CONSULTANT",
    CONTACT_PERSON: "Mr. Samuel Etim", EMAIL: "hello@dsh.example.ng", PHONE: "+234 701 555 0129", WEBSITE: "https://dsh.example.ng",
    SERVICES: ["Excel & data", "Power BI", "Cybersecurity"],
    DOCUMENTS: [doc("d-dsh-1", "Service agreement 2025–2026", "CONTRACT", "2026-10-01"), doc("d-dsh-2", "Company profile", "PROFILE")],
    NOTES: "Contract renewal in progress with Procurement.",
  }),
  provider({
    PROVIDER_ID: "prv-cfi", PROVIDER_NAME: "Chartered Finance Institute", PROVIDER_TYPE: "INSTITUTION",
    CONTACT_PERSON: "Mr. Chidi Okeke", EMAIL: "cpd@cfi.example.ng", PHONE: "+234 806 555 0187",
    ACCREDITATION: "CPD-accredited provider", ACCREDITATION_EXPIRY: "2027-09-30",
    SERVICES: ["IPSAS", "Budgeting", "Public financial management"],
  }),
  provider({
    PROVIDER_ID: "prv-pti", PROVIDER_NAME: "Procurement Training Institute", PROVIDER_TYPE: "INSTITUTION",
    CONTACT_PERSON: "Mrs. Bisi Alade", EMAIL: "info@pti.example.ng", PHONE: "+234 805 555 0151",
    SERVICES: ["Public procurement"],
    DOCUMENTS: [doc("d-pti-1", "Accreditation letter", "ACCREDITATION", "2027-01-31")],
  }),
  provider({
    PROVIDER_ID: "prv-okp", PROVIDER_NAME: "Okoro & Partners Consulting", PROVIDER_TYPE: "CONSULTANT", CITY: "Port Harcourt",
    CONTACT_PERSON: "Mr. Emeka Okoro", EMAIL: "emeka@okp.example.ng", PHONE: "+234 803 555 0199",
    SERVICES: ["Strategy workshops", "Facilitation"],
    NOTES: "Shortlisted in 2026 procurement; not yet engaged.",
  }),
];

const EXTERNAL_TRAINERS = [
  ["trn-amina", "Dr. Amina Yusuf", "prv-asa", "Lead SMS Instructor", ["sk-sms", "sk-risk", "sk-audit"], ["PhD Aviation Safety", "ICAO SMS Instructor"], 18],
  ["trn-tunde", "Capt. Tunde Bakare", "prv-asa", "Chief Flight Safety Instructor", ["sk-sms", "sk-av"], ["ATPL", "ICAO TRAINAIR PLUS Instructor"], 25],
  ["trn-grace", "Engr. Grace Okon", "prv-ratc", "Senior Instructor, Aerodromes", ["sk-ad", "sk-sms"], ["M.Eng Civil Engineering", "ICAO Aerodrome Inspector"], 14],
  ["trn-peter", "Mr. Peter Mwangi", "prv-ratc", "Audit Programme Lead", ["sk-audit", "sk-sms"], ["MSc Quality Management", "IRCA Lead Auditor"], 16],
  ["trn-kunle", "Prof. Kunle Adebayo", "prv-ipl", "Faculty, Public Leadership", ["sk-strat", "sk-lead", "sk-change"], ["PhD Public Administration"], 22],
  ["trn-ifeoma", "Mrs. Ifeoma Nnaji", "prv-ipl", "Programme Facilitator", ["sk-lead", "sk-conflict", "sk-ei"], ["MBA", "Certified Executive Coach"], 12],
  ["trn-helen", "Dr. Helen Brooks", "prv-isg", "Director of Fellowships", ["sk-strat", "sk-stake"], ["DPhil Public Policy"], 20],
  ["trn-samuel", "Mr. Samuel Etim", "prv-dsh", "Data & BI Trainer", ["sk-excel", "sk-data", "sk-pbi"], ["Microsoft Certified Trainer", "PL-300 Power BI Analyst"], 9],
  ["trn-ruth", "Ms. Ruth Danladi", "prv-dsh", "Cybersecurity Trainer", ["sk-cyber", "sk-net"], ["CISSP", "CompTIA Security+"], 8],
  ["trn-chidi", "Mr. Chidi Okeke", "prv-cfi", "IPSAS Facilitator", ["sk-ipsas", "sk-budget"], ["FCA", "IPSAS Certificate"], 15],
  ["trn-bisi", "Mrs. Bisi Alade", "prv-pti", "Procurement Specialist", ["sk-proc", "sk-psr"], ["MCIPS"], 17],
  ["trn-musa", "Dr. Musa Garba", "prv-cri", "Risk Management Lead", ["sk-risk", "sk-audit"], ["PhD Risk Management", "CRMA"], 19],
];

/** Internal trainers: one senior staff member from each of these departments. */
const INTERNAL_TRAINER_PICKS = [
  ["Human Resources", "prv-hrtu", ["sk-psr", "sk-cs", "sk-report"]],
  ["Human Resources", "prv-hrtu", ["sk-conflict", "sk-ei", "sk-lead"]],
  ["Aircraft Engineering", "prv-airw", ["sk-ai", "sk-ac"]],
  ["ICT", "prv-elearn", ["sk-ndpa", "sk-data"]],
];

const RATING_KEYS = ["PRESENTATION", "KNOWLEDGE", "TRAINING_AIDS", "INTERACTION"];

export function buildProvidersSeed() {
  const { courses } = buildCatalogueSeed();
  const { staff } = buildSkillsSeed();

  const trainers = EXTERNAL_TRAINERS.map(([id, name, providerId, title, skills, quals, years]) => ({
    TRAINER_ID: id,
    TRAINER_TYPE: "EXTERNAL",
    STAFF_ID: null,
    FULL_NAME: name,
    PROVIDER_ID: providerId,
    TITLE: title,
    DEPARTMENT: "",
    EMAIL: `${id.replace("trn-", "")}@example.org`,
    PHONE: "",
    EXPERTISE_SKILL_IDS: skills,
    QUALIFICATIONS: quals,
    YEARS_EXPERIENCE: years,
    BIO: "",
    STATUS: "ACTIVE",
  }));

  const used = new Set();
  INTERNAL_TRAINER_PICKS.forEach(([department, providerId, skills], index) => {
    const member = staff
      .filter((s) => s.DEPARTMENT === department && Number(s.GRADE) >= 12 && !used.has(s.STAFF_ID))
      .sort((a, b) => Number(b.GRADE) - Number(a.GRADE))[0];
    if (!member) return;
    used.add(member.STAFF_ID);
    trainers.push({
      TRAINER_ID: `trn-int-${index + 1}`,
      TRAINER_TYPE: "INTERNAL",
      STAFF_ID: member.STAFF_ID,
      FULL_NAME: `${member.LAST_NAME} ${member.FIRST_NAME}`,
      PROVIDER_ID: providerId,
      TITLE: member.DESIGNATION,
      DEPARTMENT: member.DEPARTMENT,
      EMAIL: `${member.FIRST_NAME.toLowerCase()}.${member.LAST_NAME.toLowerCase()}@hq.example.gov.ng`,
      PHONE: "",
      EXPERTISE_SKILL_IDS: skills,
      QUALIFICATIONS: [],
      YEARS_EXPERIENCE: 6 + index * 3,
      BIO: "",
      STATUS: "ACTIVE",
    });
  });
  trainers.push({
    TRAINER_ID: "trn-retired",
    TRAINER_TYPE: "EXTERNAL",
    STAFF_ID: null,
    FULL_NAME: "Mr. Olu Fashola",
    PROVIDER_ID: "prv-dsh",
    TITLE: "Former Excel Trainer",
    DEPARTMENT: "",
    EMAIL: "olu@example.org",
    PHONE: "",
    EXPERTISE_SKILL_IDS: ["sk-excel"],
    QUALIFICATIONS: [],
    YEARS_EXPERIENCE: 6,
    BIO: "",
    STATUS: "INACTIVE",
  });

  // One engagement per past session of each catalogue course, newest last.
  const engagements = [];
  let n = 1;
  courses.forEach((course, courseIndex) => {
    const pool = trainers.filter(
      (t) => t.PROVIDER_ID === course.DEFAULT_PROVIDER_ID && t.STATUS === "ACTIVE",
    );
    const sessions = Math.min(course.SESSIONS_RUN, 4);
    for (let s = 0; s < sessions; s += 1) {
      const start = dayjs("2026-10-20").subtract(courseIndex * 23 + s * 97, "day");
      const seed = (courseIndex * 7 + s * 3) % 10;
      const base = 3.4 + seed * 0.15;
      const ratings = Object.fromEntries(
        RATING_KEYS.map((key, k) => [key, Math.min(5, Math.round((base + ((k + seed) % 3) * 0.2 - 0.2) * 10) / 10)]),
      );
      engagements.push({
        ENGAGEMENT_ID: `eng-${n}`,
        PROVIDER_ID: course.DEFAULT_PROVIDER_ID,
        TRAINER_IDS: pool.slice(0, s % 2 === 0 ? 1 : 2).map((t) => t.TRAINER_ID),
        COURSE_ID: course.COURSE_ID,
        COURSE_TITLE: course.COURSE_TITLE,
        START_DATE: start.format("YYYY-MM-DD"),
        END_DATE: start.add(course.DURATION_DAYS - 1, "day").format("YYYY-MM-DD"),
        PARTICIPANTS: Math.max(4, Math.round(course.STAFF_TRAINED / Math.max(1, course.SESSIONS_RUN))),
        TOTAL_COST: course.DEFAULT_COST * Math.max(4, Math.round(course.STAFF_TRAINED / Math.max(1, course.SESSIONS_RUN))),
        RESPONSES: 6 + seed,
        RATING_OVERALL: Math.min(5, Math.round(base * 10) / 10),
        RATINGS: ratings,
      });
      n += 1;
    }
  });

  return { providers: SEED_PROVIDERS.map((p) => ({ ...p })), trainers, engagements };
}
