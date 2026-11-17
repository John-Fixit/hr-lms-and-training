/**
 * Demo seed for the Training Requests & Approvals UI prototype.
 * Approval routes are picked by location and cost; approvers are resolved from the
 * staff seed (line manager / head of department / director by grade).
 * Remove once the real requests endpoints are live.
 */
import dayjs from "dayjs";
import { buildCatalogueSeed } from "./trainingCatalogueSeed";
import { buildSkillsSeed } from "./trainingSkillsSeed";

export const APPROVAL_ROLES = [
  { value: "LINE_MANAGER", label: "Line manager" },
  { value: "HEAD_OF_DEPARTMENT", label: "Head of department" },
  { value: "DIRECTOR", label: "Director" },
  { value: "HR_TRAINING", label: "HR / Training" },
  { value: "FINANCE", label: "Finance" },
  { value: "CHIEF_EXECUTIVE", label: "Director General" },
];

const SEED_ROUTES = [
  {
    ROUTE_ID: "rt-local-std",
    ROUTE_NAME: "Local training up to ₦500,000",
    LOCATION: "LOCAL",
    MIN_COST: 0,
    MAX_COST: 500000,
    PRIORITY: 1,
    STEPS: ["LINE_MANAGER", "HEAD_OF_DEPARTMENT", "HR_TRAINING"],
    IS_ACTIVE: 1,
  },
  {
    ROUTE_ID: "rt-local-high",
    ROUTE_NAME: "Local training above ₦500,000",
    LOCATION: "LOCAL",
    MIN_COST: 500001,
    MAX_COST: null,
    PRIORITY: 2,
    STEPS: ["LINE_MANAGER", "HEAD_OF_DEPARTMENT", "HR_TRAINING", "FINANCE"],
    IS_ACTIVE: 1,
  },
  {
    ROUTE_ID: "rt-foreign",
    ROUTE_NAME: "Foreign training",
    LOCATION: "FOREIGN",
    MIN_COST: 0,
    MAX_COST: null,
    PRIORITY: 3,
    STEPS: ["LINE_MANAGER", "HEAD_OF_DEPARTMENT", "DIRECTOR", "HR_TRAINING", "FINANCE", "CHIEF_EXECUTIVE"],
    IS_ACTIVE: 1,
  },
];

/** First active route (by priority) whose location and cost band match. */
export function resolveRoute(routes, { location, cost }) {
  return [...routes]
    .filter((r) => r.IS_ACTIVE)
    .sort((a, b) => a.PRIORITY - b.PRIORITY)
    .find(
      (r) =>
        (r.LOCATION === "ANY" || r.LOCATION === location) &&
        cost >= (r.MIN_COST ?? 0) &&
        (r.MAX_COST === null || r.MAX_COST === undefined || cost <= r.MAX_COST),
    );
}

const fullName = (s) => `${s.LAST_NAME} ${s.FIRST_NAME}`;
const byGradeDesc = (a, b) => Number(b.GRADE) - Number(a.GRADE);

/**
 * Who acts on a step for this requester. `used` holds staff already given an earlier step,
 * so one person isn't asked to approve the same request twice when someone else can.
 */
export function resolveApprover(role, requester, staff, used = new Set()) {
  const others = staff.filter((s) => s.STAFF_ID !== requester.STAFF_ID);
  const pick = (list) => list.find((s) => !used.has(s.STAFF_ID)) ?? list[0];
  let person = null;
  if (role === "LINE_MANAGER") {
    // Nearest senior officer: same unit first, then same department.
    const above = others.filter((s) => Number(s.GRADE) > Number(requester.GRADE));
    const nearest = (list) => [...list].sort((a, b) => Number(a.GRADE) - Number(b.GRADE));
    person = pick(nearest(above.filter((s) => s.UNIT === requester.UNIT))) ?? pick(nearest(above.filter((s) => s.DEPARTMENT === requester.DEPARTMENT)));
  } else if (role === "HEAD_OF_DEPARTMENT") {
    person = pick(others.filter((s) => s.DEPARTMENT === requester.DEPARTMENT).sort(byGradeDesc));
  } else if (role === "DIRECTOR") {
    person = pick(others.filter((s) => s.DIRECTORATE === requester.DIRECTORATE).sort(byGradeDesc));
  } else if (role === "FINANCE") {
    person = pick(others.filter((s) => s.DEPARTMENT === "Finance").sort(byGradeDesc));
    if (person) {
      used.add(person.STAFF_ID);
      return { STAFF_ID: person.STAFF_ID, NAME: `${fullName(person)} (Finance)` };
    }
  }
  if (role === "CHIEF_EXECUTIVE") return { STAFF_ID: null, NAME: "Office of the Director General" };
  if (role === "HR_TRAINING") return { STAFF_ID: null, NAME: "HR Training Desk" };
  if (!person) return { STAFF_ID: null, NAME: "Not found — HR to assign" };
  used.add(person.STAFF_ID);
  return { STAFF_ID: person.STAFF_ID, NAME: fullName(person) };
}

export function buildSteps(route, requester, staff) {
  const used = new Set();
  return route.STEPS.map((role) => {
    const approver = resolveApprover(role, requester, staff, used);
    return {
      ROLE: role,
      APPROVER_ID: approver.STAFF_ID,
      APPROVER_NAME: approver.NAME,
      STATUS: "WAITING",
      ACTED_AT: null,
      COMMENT: "",
    };
  });
}

const COMMENTS = {
  APPROVED: ["Supported. Relevant to current duties.", "Approved.", "Recommended — aligns with the unit's work plan.", ""],
  RETURNED: ["Please attach the provider's brochure and confirm the dates.", "Justification is too brief — explain how this links to your KPIs."],
  REJECTED: ["Not in this year's training plan. Re-submit during the next TNA.", "Similar course already attended in 2025."],
};

// [staffIndex, courseId | external spec, status, stepsApproved, daysAgo, source]
const SPECS = [
  [2, "crs-saf201", "PENDING", 1, 4, "EMPLOYEE"],
  [5, "crs-ldp201", "PENDING", 2, 6, "MANAGER"],
  [9, "crs-dig110", "PENDING", 0, 1, "EMPLOYEE"],
  [14, { title: "ICAO Safety Oversight Inspector Course", provider: "ICAO Global Aviation Training", location: "FOREIGN", cost: 5200000, days: 10, type: "TRAINING", skills: ["sk-sms", "sk-audit"] }, "PENDING", 3, 9, "EMPLOYEE"],
  [21, "crs-fin101", "PENDING", 1, 3, "TNA"],
  [26, { title: "Certified Data Protection Officer (CDPO)", provider: "Data Privacy Institute", location: "LOCAL", cost: 650000, days: 5, type: "TRAINING", skills: ["sk-ndpa"] }, "PENDING", 3, 12, "EMPLOYEE"],
  [30, "crs-cmp120", "RETURNED", 1, 8, "EMPLOYEE"],
  [33, { title: "Advanced Airport Rescue & Firefighting", provider: "Fire Service Training School", location: "LOCAL", cost: 420000, days: 6, type: "WORKSHOP", skills: ["sk-ad"] }, "RETURNED", 0, 5, "EMPLOYEE"],
  [38, "crs-ldp110", "APPROVED", 3, 15, "EMPLOYEE"],
  [41, "crs-dig120", "APPROVED", 3, 20, "MANAGER"],
  [45, "crs-saf201", "APPROVED", 6, 25, "EMPLOYEE"],
  [48, "crs-ldp101", "SCHEDULED", 3, 40, "EMPLOYEE"],
  [52, "crs-fin110", "SCHEDULED", 3, 70, "TNA"],
  [55, { title: "Executive MBA module: Public Value", provider: "Business School Abroad", location: "FOREIGN", cost: 7800000, days: 14, type: "FELLOWSHIP", skills: ["sk-strat"] }, "REJECTED", 2, 30, "EMPLOYEE"],
  [59, "crs-dig101", "REJECTED", 1, 45, "EMPLOYEE"],
  [63, "crs-ind110", "DRAFT", 0, 0, "EMPLOYEE"],
  [66, "crs-cmp101", "CANCELLED", 1, 50, "EMPLOYEE"],
];

/** Sessions (from trainingSessionsSeed PLAN order) that the SCHEDULED seed requests were placed in. */
export const SCHEDULED_REQUEST_SESSIONS = { "crs-ldp101": "ses-13", "crs-fin110": "ses-5" };

const JUSTIFICATIONS = [
  "My unit now leads this area of oversight and I need the skills to carry out inspections independently.",
  "Identified in my last appraisal as a development area. The course covers the gaps my supervisor noted.",
  "New responsibilities after redeployment. This training is required before I can sign off reports.",
  "Requested to support the department's work plan for next year and reduce reliance on external consultants.",
];

export function buildRequestsSeed() {
  const { staff } = buildSkillsSeed();
  const { courses } = buildCatalogueSeed();
  const base = dayjs("2026-11-09");

  const requests = SPECS.map(([staffIndex, courseSpec, status, approvedSteps, daysAgo, source], index) => {
    const requester = staff[staffIndex];
    const course = typeof courseSpec === "string" ? courses.find((c) => c.COURSE_ID === courseSpec) : null;
    const external = typeof courseSpec === "object" ? courseSpec : null;
    const location = course?.LOCATION ?? external.location;
    const cost = course?.DEFAULT_COST ?? external.cost;
    const route = resolveRoute(SEED_ROUTES, { location, cost });
    const steps = buildSteps(route, requester, staff);
    const submittedAt = base.subtract(daysAgo, "day");
    const history = [];
    if (status !== "DRAFT") history.push({ ACTION: "SUBMITTED", BY: `${requester.LAST_NAME} ${requester.FIRST_NAME}`, AT: submittedAt.format("YYYY-MM-DD"), COMMENT: "" });

    steps.forEach((step, i) => {
      if (status === "DRAFT") return;
      const actedAt = submittedAt.add(i + 1, "day").format("YYYY-MM-DD");
      if (i < approvedSteps) {
        step.STATUS = "APPROVED";
        step.ACTED_AT = actedAt;
        step.COMMENT = COMMENTS.APPROVED[(index + i) % COMMENTS.APPROVED.length];
        history.push({ ACTION: "APPROVED", BY: step.APPROVER_NAME, AT: actedAt, COMMENT: step.COMMENT, ROLE: step.ROLE });
      } else if (i === approvedSteps && ["PENDING", "RETURNED", "REJECTED", "CANCELLED"].includes(status)) {
        if (status === "PENDING") step.STATUS = "PENDING";
        if (status === "RETURNED" || status === "REJECTED") {
          step.STATUS = status;
          step.ACTED_AT = actedAt;
          step.COMMENT = COMMENTS[status][index % COMMENTS[status].length];
          history.push({ ACTION: status, BY: step.APPROVER_NAME, AT: actedAt, COMMENT: step.COMMENT, ROLE: step.ROLE });
        }
      }
    });
    if (status === "CANCELLED") history.push({ ACTION: "CANCELLED", BY: `${requester.LAST_NAME} ${requester.FIRST_NAME}`, AT: submittedAt.add(3, "day").format("YYYY-MM-DD"), COMMENT: "No longer needed — course moved to next year." });
    if (status === "SCHEDULED") history.push({ ACTION: "SCHEDULED", BY: "HR Training Desk", AT: submittedAt.add(steps.length + 2, "day").format("YYYY-MM-DD"), COMMENT: "" });

    const preferredStart = base.add(10 + index * 6, "day");
    const days = course?.DURATION_DAYS ?? external.days;
    return {
      REQUEST_ID: `req-${index + 1}`,
      REFERENCE_NO: `TR/2026/${String(140 + index).padStart(4, "0")}`,
      STAFF_ID: requester.STAFF_ID,
      SOURCE: source,
      REQUEST_TYPE: course ? "CATALOGUE" : "EXTERNAL",
      COURSE_ID: course?.COURSE_ID ?? null,
      PROPOSED_TITLE: external?.title ?? "",
      PROPOSED_PROVIDER: external?.provider ?? "",
      TRAINING_TYPE: course?.TRAINING_TYPE ?? external.type,
      LOCATION: location,
      DURATION_DAYS: days,
      PREFERRED_START: preferredStart.format("YYYY-MM-DD"),
      PREFERRED_END: preferredStart.add(days - 1, "day").format("YYYY-MM-DD"),
      ESTIMATED_COST: cost,
      FUNDING_SOURCE: location === "FOREIGN" ? "TRAINING_BUDGET" : index % 3 === 0 ? "DEPARTMENT_BUDGET" : "TRAINING_BUDGET",
      JUSTIFICATION: JUSTIFICATIONS[index % JUSTIFICATIONS.length],
      EXPECTED_OUTCOME: "Apply the skills on the job within three months and share learning with the unit.",
      SKILL_IDS: course ? course.SKILLS.map((s) => s.SKILL_ID) : external.skills,
      ATTACHMENT_NAME: external ? "provider-brochure.pdf" : null,
      TNA_NEED_ID: null,
      STATUS: status,
      ROUTE_ID: route.ROUTE_ID,
      ROUTE_NAME: route.ROUTE_NAME,
      STEPS: steps,
      HISTORY: history,
      SESSION_ID: status === "SCHEDULED" ? SCHEDULED_REQUEST_SESSIONS[course?.COURSE_ID] ?? null : null,
      SUBMITTED_AT: status === "DRAFT" ? null : submittedAt.format("YYYY-MM-DD"),
      CREATED_AT: submittedAt.subtract(1, "day").format("YYYY-MM-DD"),
    };
  });

  return { routes: SEED_ROUTES.map((r) => ({ ...r, STEPS: [...r.STEPS] })), requests, nextReferenceNo: 140 + SPECS.length };
}
