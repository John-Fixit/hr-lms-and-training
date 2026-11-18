/**
 * Demo seed for the Training Needs Assessment (TNA) UI prototype.
 * A closed 2026 round (needs approved and scheduled) and an open 2027 round with departments
 * at every stage. Needs reference catalogue courses, skills and departmental staff.
 * Remove once the real TNA endpoints are live.
 */
import dayjs from "dayjs";
import { buildCatalogueSeed } from "./trainingCatalogueSeed";
import { buildSkillsSeed } from "./trainingSkillsSeed";

const DEPARTMENT_COURSES = {
  "Aircraft Engineering": ["crs-saf101", "crs-saf210", "crs-saf201"],
  Licensing: ["crs-cmp101", "crs-ind110", "crs-saf101"],
  "Flight Operations": ["crs-saf201", "crs-cmp120", "crs-saf101"],
  "Personnel Licensing": ["crs-cmp110", "crs-ind110"],
  "Aerodrome Standards": ["crs-saf220", "crs-saf230"],
  "Air Navigation Services": ["crs-saf101", "crs-dig101"],
  "Human Resources": ["crs-ldp101", "crs-ldp120", "crs-cmp101"],
  Administration: ["crs-ind110", "crs-fin120", "crs-cmp101"],
  Finance: ["crs-fin101", "crs-fin110", "crs-dig101"],
  Accounts: ["crs-fin101", "crs-dig101"],
  ICT: ["crs-dig120", "crs-dig110", "crs-cmp110"],
  "Legal Services": ["crs-cmp120", "crs-ldp101"],
};

const PROPOSED = {
  ICT: { title: "Cloud Infrastructure Fundamentals", skills: ["sk-net", "sk-cyber"], cost: 450000 },
  "Legal Services": { title: "Aviation Law & Regulatory Drafting", skills: ["sk-report", "sk-psr"], cost: 380000 },
  "Air Navigation Services": { title: "Performance-Based Navigation Oversight", skills: ["sk-atm"], cost: 2600000 },
};

// 2027 round: department → submission status
const STATUS_2027 = {
  "Aircraft Engineering": "REVIEWED",
  Finance: "REVIEWED",
  "Human Resources": "REVIEWED",
  ICT: "SUBMITTED",
  "Flight Operations": "SUBMITTED",
  "Legal Services": "SUBMITTED",
  Administration: "RETURNED",
  Accounts: "DRAFT",
  "Air Navigation Services": "DRAFT",
  Licensing: "NOT_STARTED",
  "Personnel Licensing": "NOT_STARTED",
  "Aerodrome Standards": "NOT_STARTED",
};

const SOURCES = ["DEPARTMENT", "SKILL_GAP", "APPRAISAL", "COMPLIANCE", "STRATEGIC"];
const PRIORITIES = ["HIGH", "MEDIUM", "MEDIUM", "LOW"];
const JUSTIFICATIONS = [
  "Most of the unit has not had refresher training in over three years.",
  "Appraisal reports flagged this as a common development need in the department.",
  "Required to meet regulatory oversight obligations for the coming year.",
  "New staff joined the unit and need a common foundation.",
  "Supports the department's strategic objective for next year.",
];

/** Approved 2026 needs and the sessions they became (sessions seed ids). */
const SCHEDULED_2026 = { "crs-saf101": "ses-1", "crs-ldp101": "ses-4", "crs-dig101": "ses-3", "crs-fin110": "ses-5" };
/** 2027 needs already planned into an upcoming session. */
const SCHEDULED_2027 = { "crs-dig110": "ses-10", "crs-fin101": "ses-11" };

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

export function buildNeedsSeed() {
  const rand = mulberry32(2027);
  const { staff } = buildSkillsSeed();
  const { courses } = buildCatalogueSeed();
  const departments = Object.keys(DEPARTMENT_COURSES);

  const rounds = [
    {
      TNA_ID: "tna-2026",
      TITLE: "2026 Training Needs Assessment",
      YEAR: 2026,
      DESCRIPTION: "Organisation-wide needs assessment feeding the 2026 training plan.",
      OBJECTIVES: "Identify priority training per department and focus the 2026 training budget.",
      START_DATE: "2025-10-01",
      DEADLINE: "2025-11-15",
      RESPONSIBLE_OFFICER: "Head, Training & Development",
      STATUS: "CLOSED",
      DEPARTMENTS: departments,
      CREATED_AT: "2025-09-20",
    },
    {
      TNA_ID: "tna-2027",
      TITLE: "2027 Training Needs Assessment",
      YEAR: 2027,
      DESCRIPTION: "Departments identify the training their staff need in 2027, with priorities and cost estimates.",
      OBJECTIVES: "Build the 2027 training plan from approved, prioritised needs, starting with regulatory and safety-critical gaps.",
      START_DATE: "2026-10-15",
      DEADLINE: "2026-11-30",
      RESPONSIBLE_OFFICER: "Head, Training & Development",
      STATUS: "OPEN",
      DEPARTMENTS: departments,
      CREATED_AT: "2026-10-10",
    },
  ];

  const submissions = [];
  const needs = [];
  let needNo = 1;

  const makeNeed = (round, submission, department, courseId, status, index) => {
    const course = courses.find((c) => c.COURSE_ID === courseId);
    const proposed = !course ? PROPOSED[department] : null;
    const deptStaff = staff
      .filter((s) => s.DEPARTMENT === department)
      .filter((s) => !course?.TARGET_GRADES?.length || course.TARGET_GRADES.includes(s.GRADE));
    const affected = [...deptStaff].sort(() => rand() - 0.5).slice(0, Math.max(1, Math.min(deptStaff.length, 2 + Math.floor(rand() * 4))));
    const participants = affected.length + Math.floor(rand() * 4);
    const unitCost = course?.DEFAULT_COST ?? proposed.cost;
    const scheduled = round.TNA_ID === "tna-2026" ? SCHEDULED_2026 : SCHEDULED_2027;
    needs.push({
      NEED_ID: `need-${needNo}`,
      TNA_ID: round.TNA_ID,
      SUBMISSION_ID: submission.SUBMISSION_ID,
      DEPARTMENT: department,
      COURSE_ID: course?.COURSE_ID ?? null,
      PROPOSED_TITLE: proposed?.title ?? "",
      SKILL_IDS: course ? course.SKILLS.map((s) => s.SKILL_ID) : proposed.skills,
      SOURCE: SOURCES[(index + needNo) % SOURCES.length],
      STAFF_IDS: affected.map((s) => s.STAFF_ID),
      PARTICIPANTS: participants,
      JUSTIFICATION: JUSTIFICATIONS[needNo % JUSTIFICATIONS.length],
      EXPECTED_OUTCOME: "Staff apply the skills on the job and the unit relies less on external support.",
      PRIORITY: PRIORITIES[(needNo + index) % PRIORITIES.length],
      ESTIMATED_COST: unitCost * participants,
      STATUS: status,
      HR_COMMENT: status === "DEFERRED" ? "Deferred to 2028 — budget." : status === "REJECTED" ? "Covered by the organisation-wide induction." : "",
      SESSION_IDS: status === "APPROVED" && course && scheduled[course.COURSE_ID] ? [scheduled[course.COURSE_ID]] : [],
    });
    needNo += 1;
  };

  rounds.forEach((round) => {
    departments.forEach((department, deptIndex) => {
      const status = round.TNA_ID === "tna-2026" ? "REVIEWED" : STATUS_2027[department];
      const head = staff
        .filter((s) => s.DEPARTMENT === department)
        .sort((a, b) => Number(b.GRADE) - Number(a.GRADE))[0];
      const submittedAt = dayjs(round.START_DATE).add(10 + deptIndex * 2, "day").format("YYYY-MM-DD");
      const submission = {
        SUBMISSION_ID: `sub-${round.YEAR}-${deptIndex + 1}`,
        TNA_ID: round.TNA_ID,
        DEPARTMENT: department,
        STATUS: status,
        SUBMITTED_BY: status === "NOT_STARTED" ? "" : head ? `${head.LAST_NAME} ${head.FIRST_NAME}` : "",
        SUBMITTED_AT: ["SUBMITTED", "REVIEWED", "RETURNED"].includes(status) ? submittedAt : null,
        REVIEW_COMMENT: status === "RETURNED" ? "Please add cost estimates and name the affected staff for each need." : "",
        REVIEWED_AT: status === "REVIEWED" ? dayjs(submittedAt).add(5, "day").format("YYYY-MM-DD") : null,
      };
      submissions.push(submission);
      if (status === "NOT_STARTED") return;

      const courseIds = DEPARTMENT_COURSES[department].slice(0, round.TNA_ID === "tna-2026" ? 2 : 3);
      const list = PROPOSED[department] && round.TNA_ID === "tna-2027" ? [...courseIds, null] : courseIds;
      list.forEach((courseId, i) => {
        let needStatus = "PROPOSED";
        if (status === "REVIEWED") needStatus = i === 2 ? "DEFERRED" : i === 3 ? "REJECTED" : "APPROVED";
        makeNeed(round, submission, department, courseId, needStatus, i);
      });
    });
  });

  return { rounds, submissions, needs };
}
