/**
 * Training Needs Assessment (TNA) API hooks. Backend request fields are adapted
 * here while the screens retain their existing data shape.
 */
import dayjs from "dayjs";
import { mockApiError, mockId } from "./mock/mockStore";
import { catalogueStore, courseById, needsStore, sessionsStore, skillsStore, staffById } from "./mock/stores";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  asArray,
  getTraining,
  getTrainingIdentity,
  postTraining,
  responseData,
  responseList,
  staffFullName,
  toNumber,
  trainingWritesAreLive,
  useTrainingMutation,
  useTrainingQuery,
  withActor,
  withCompany,
} from "./trainingApi";
import {
  fillUnconfirmed,
  isSampleId,
  sampleSparseList,
  tagSample,
} from "./trainingSample";

const QUERY_ROOT = "training_needs";
const now = () => dayjs().format("YYYY-MM-DD");
const SUBMITTED = ["SUBMITTED", "REVIEWED"];

function addDaysLeft(round) {
  if (!round || round.DAYS_LEFT !== undefined) return round;
  return {
    ...round,
    DAYS_LEFT: round.STATUS === "OPEN" && round.DEADLINE
      ? dayjs(round.DEADLINE).startOf("day").diff(dayjs().startOf("day"), "day")
      : null,
  };
}

function getRound(store, tnaId) {
  const round = store.rounds.find((r) => r.TNA_ID === tnaId);
  if (!round) throw mockApiError("Assessment not found.");
  return round;
}

function roundStats(store, round) {
  const subs = store.submissions.filter((s) => s.TNA_ID === round.TNA_ID);
  const needs = store.needs.filter((n) => n.TNA_ID === round.TNA_ID);
  const approved = needs.filter((n) => n.STATUS === "APPROVED");
  return {
    DEPARTMENT_COUNT: subs.length,
    SUBMITTED_COUNT: subs.filter((s) => SUBMITTED.includes(s.STATUS)).length,
    REVIEWED_COUNT: subs.filter((s) => s.STATUS === "REVIEWED").length,
    AWAITING_REVIEW: subs.filter((s) => s.STATUS === "SUBMITTED").length,
    NEED_COUNT: needs.length,
    APPROVED_COUNT: approved.length,
    PLANNED_COUNT: approved.filter((n) => n.SESSION_IDS?.length).length,
    APPROVED_COST: approved.reduce((sum, n) => sum + n.ESTIMATED_COST, 0),
    APPROVED_PARTICIPANTS: approved.reduce((sum, n) => sum + n.PARTICIPANTS, 0),
    DAYS_LEFT: round.STATUS === "OPEN" ? dayjs(round.DEADLINE).diff(dayjs().startOf("day"), "day") : null,
  };
}

function enrichNeed(need) {
  const course = need.COURSE_ID ? courseById(need.COURSE_ID) : null;
  const { sessions } = sessionsStore.get();
  return {
    ...need,
    TITLE: course?.COURSE_TITLE ?? (need.COURSE_TITLE || need.PROPOSED_TITLE),
    COURSE_CODE: course?.COURSE_CODE ?? need.COURSE_CODE ?? "",
    STAFF: need.STAFF_IDS.map((id) => {
      const s = staffById(id);
      if (s) return { STAFF_ID: id, NAME: `${s.LAST_NAME} ${s.FIRST_NAME}`, DESIGNATION: s.DESIGNATION ?? "" };
      // Live staff aren't in the sample directory; use the names captured when the need was saved.
      const known = need.STAFF_SNAPSHOT?.find((member) => String(member.STAFF_ID) === String(id));
      return { STAFF_ID: id, NAME: known?.NAME ?? "Unknown", DESIGNATION: known?.DESIGNATION ?? "" };
    }),
    SESSIONS: (need.SESSION_IDS ?? [])
      .map((id) => sessions.find((s) => s.SESSION_ID === id))
      .filter(Boolean)
      .map((s) => ({ SESSION_ID: s.SESSION_ID, START_DATE: s.START_DATE, END_DATE: s.END_DATE, STATUS: s.STATUS })),
  };
}

function needFields(payload) {
  const isCatalogue = Boolean(payload.course_id);
  if (!isCatalogue && !payload.proposed_title?.trim()) throw mockApiError("Choose a catalogue course or name the training needed.");
  if ((payload.justification?.trim().length ?? 0) < 15) throw mockApiError("Explain why this is needed (at least 15 characters).");
  const participants = Number(payload.participants ?? 0);
  if (participants < 1) throw mockApiError("Estimate at least one participant.");
  const course = isCatalogue ? courseById(payload.course_id) : null;
  return {
    // Live catalogue courses aren't in the sample catalogue, so keep the chosen id and its labels.
    COURSE_ID: course?.COURSE_ID ?? (isCatalogue ? payload.course_id : null),
    COURSE_TITLE: course ? "" : payload.course_title ?? "",
    COURSE_CODE: course ? "" : payload.course_code ?? "",
    PROPOSED_TITLE: isCatalogue ? "" : payload.proposed_title.trim(),
    SKILL_IDS: payload.skill_ids?.length ? payload.skill_ids : course?.SKILLS?.map((s) => s.SKILL_ID) ?? [],
    SOURCE: payload.source ?? "DEPARTMENT",
    STAFF_IDS: payload.staff_ids ?? [],
    STAFF_SNAPSHOT: payload.staff ?? [],
    PARTICIPANTS: participants,
    JUSTIFICATION: payload.justification.trim(),
    EXPECTED_OUTCOME: payload.expected_outcome?.trim() ?? "",
    PRIORITY: payload.priority ?? "MEDIUM",
    ESTIMATED_COST: Number(payload.estimated_cost ?? 0),
  };
}

function assertEditable(store, submission) {
  // A live round isn't in the sample store; the drawer already checks its live status.
  if (submission.IS_LIVE_COPY && !store.rounds.some((r) => r.TNA_ID === submission.TNA_ID)) return;
  const round = getRound(store, submission.TNA_ID);
  if (round.STATUS !== "OPEN") throw mockApiError("This assessment is closed.");
}

/**
 * Finds the submission in sample data. While writes are in sample mode, a live
 * department submission gets a local copy so its needs can be drafted against it.
 */
function findOrAdoptSubmission(store, payload) {
  const id = payload?.submission_id;
  const existing = store.submissions.find((s) => String(s.SUBMISSION_ID) === String(id));
  if (existing) return existing;
  if (id == null || id === "" || isSampleId(id) || !payload.department) {
    throw mockApiError("Submission not found.");
  }
  const copy = {
    SUBMISSION_ID: id,
    TNA_ID: payload.tna_id,
    DEPARTMENT: payload.department,
    DEPARTMENT_ID: payload.department_id,
    STATUS: "NOT_STARTED",
    SUBMITTED_BY: "",
    SUBMITTED_AT: null,
    REVIEW_COMMENT: "",
    REVIEWED_AT: null,
    IS_LIVE_COPY: true,
  };
  store.submissions.push(copy);
  return copy;
}

/** Fixed test record: the HUMAN RESOURCES submission always starts with this need in sample mode. */
const HR_TEST_DEPARTMENT = "HUMAN RESOURCES";
const HR_TEST_NEED = {
  COURSE_ID: "crs-cmp101",
  COURSE_TITLE: "Public Service Rules & Financial Regulations",
  COURSE_CODE: "CMP-101",
  PROPOSED_TITLE: "",
  SKILL_IDS: ["sk-psr"],
  SOURCE: "DEPARTMENT",
  STAFF_IDS: [],
  STAFF_SNAPSHOT: [],
  PARTICIPANTS: 1,
  ESTIMATED_COST: 80000,
  PRIORITY: "MEDIUM",
  JUSTIFICATION:
    "The officer regularly applies the Public Service Rules and Financial Regulations when advising on staff "
    + "welfare, discipline, leave and payments. Recent reviews showed inconsistent interpretation of some provisions. "
    + "This course will refresh the officer’s understanding of the current provisions, reduce compliance errors, and "
    + "ensure HR decisions and advice to the department are consistent with approved rules and procedures.",
  EXPECTED_OUTCOME:
    "The participant will correctly apply the Public Service Rules and Financial Regulations in HR processes, reduce "
    + "rule-related errors and audit queries, and advise management and colleagues with confidence. Within three "
    + "months of completion, the participant will share key learnings with the department.",
};

/** Seeds HR_TEST_NEED once per HR submission; a tester can then edit, remove or submit it. */
function seedHrTestNeed(submission) {
  if (trainingWritesAreLive() || !submission?.SUBMISSION_ID) return;
  if (String(submission.DEPARTMENT ?? "").trim().toUpperCase() !== HR_TEST_DEPARTMENT) return;
  const store = needsStore.get();
  const copy = findOrAdoptSubmission(store, {
    submission_id: submission.SUBMISSION_ID,
    tna_id: submission.TNA_ID,
    department: submission.DEPARTMENT,
    department_id: submission.DEPARTMENT_ID,
  });
  if (copy.TEST_NEED_SEEDED) return; // seeded before — respect later edits or removal
  store.needs.push({
    NEED_ID: mockId("need"),
    TNA_ID: copy.TNA_ID,
    SUBMISSION_ID: copy.SUBMISSION_ID,
    DEPARTMENT: copy.DEPARTMENT,
    ...HR_TEST_NEED,
    STATUS: "PROPOSED",
    HR_COMMENT: "",
    SESSION_IDS: [],
  });
  copy.TEST_NEED_SEEDED = true;
  if (copy.STATUS === "NOT_STARTED") copy.STATUS = "DRAFT";
  needsStore.save();
}

/** Sample-mode needs and status saved against a live submission, for overlaying on live reads. */
function liveCopyOverlay({ submissionId, tnaId }) {
  const store = needsStore.get();
  const copies = store.submissions.filter((s) => s.IS_LIVE_COPY
    && (submissionId == null || String(s.SUBMISSION_ID) === String(submissionId))
    && (tnaId == null || String(s.TNA_ID) === String(tnaId)));
  const ids = new Set(copies.map((s) => String(s.SUBMISSION_ID)));
  return {
    submission: copies[0] ?? null,
    needs: tagSample(store.needs.filter((n) => ids.has(String(n.SUBMISSION_ID))).map(enrichNeed)),
  };
}

const mockServer = {
  overview() {
    const store = needsStore.get();
    const open = store.rounds.find((r) => r.STATUS === "OPEN") ?? null;
    return { ACTIVE_ROUND: open ? { ...open, ...roundStats(store, open) } : null };
  },

  rounds() {
    const store = needsStore.get();
    return [...store.rounds]
      .sort((a, b) => b.YEAR - a.YEAR)
      .map((r) => ({ ...r, ...roundStats(store, r) }));
  },

  round(tnaId) {
    const store = needsStore.get();
    const round = getRound(store, tnaId);
    const submissions = store.submissions
      .filter((s) => s.TNA_ID === tnaId)
      .map((s) => {
        const needs = store.needs.filter((n) => n.SUBMISSION_ID === s.SUBMISSION_ID);
        return {
          ...s,
          NEED_COUNT: needs.length,
          HIGH_PRIORITY: needs.filter((n) => n.PRIORITY === "HIGH").length,
          ESTIMATED_COST: needs.reduce((sum, n) => sum + n.ESTIMATED_COST, 0),
          PARTICIPANTS: needs.reduce((sum, n) => sum + n.PARTICIPANTS, 0),
          APPROVED_COUNT: needs.filter((n) => n.STATUS === "APPROVED").length,
        };
      })
      .sort((a, b) => a.DEPARTMENT.localeCompare(b.DEPARTMENT));
    return { ...round, ...roundStats(store, round), SUBMISSIONS: submissions };
  },

  needs(tnaId) {
    return needsStore
      .get()
      .needs.filter((n) => n.TNA_ID === tnaId)
      .map(enrichNeed);
  },

  submission(submissionId) {
    const store = needsStore.get();
    const submission = store.submissions.find((s) => s.SUBMISSION_ID === submissionId);
    if (!submission) throw mockApiError("Submission not found.");
    return {
      ...submission,
      ROUND_STATUS: getRound(store, submission.TNA_ID).STATUS,
      NEEDS: store.needs.filter((n) => n.SUBMISSION_ID === submissionId).map(enrichNeed),
    };
  },

  /** Skills where many staff in the department sit at L1–L2, with a course that builds them. */
  skillGaps(department) {
    const skills = skillsStore.get();
    const courses = catalogueStore.get().courses.filter((c) => c.STATUS === "ACTIVE");
    const deptStaff = skills.staff.filter((s) => s.DEPARTMENT === department);
    const ids = new Set(deptStaff.map((s) => s.STAFF_ID));
    const bySkill = new Map();
    skills.staffSkills
      .filter((r) => ids.has(r.STAFF_ID) && r.LEVEL <= 2)
      .forEach((r) => {
        if (!bySkill.has(r.SKILL_ID)) bySkill.set(r.SKILL_ID, []);
        bySkill.get(r.SKILL_ID).push(r.STAFF_ID);
      });
    return [...bySkill.entries()]
      .map(([skillId, staffIds]) => {
        const course = courses
          .filter((c) => c.SKILLS.some((s) => s.SKILL_ID === skillId && s.TARGET_LEVEL >= 3))
          .sort((a, b) => b.SKILLS.find((s) => s.SKILL_ID === skillId).IS_PRIMARY - a.SKILLS.find((s) => s.SKILL_ID === skillId).IS_PRIMARY)[0];
        return {
          SKILL_ID: skillId,
          SKILL_NAME: skills.skills.find((s) => s.SKILL_ID === skillId)?.SKILL_NAME ?? skillId,
          STAFF_IDS: staffIds,
          STAFF_COUNT: staffIds.length,
          DEPARTMENT_SIZE: deptStaff.length,
          SUGGESTED_COURSE: course ? { COURSE_ID: course.COURSE_ID, COURSE_CODE: course.COURSE_CODE, COURSE_TITLE: course.COURSE_TITLE, DEFAULT_COST: course.DEFAULT_COST } : null,
        };
      })
      .sort((a, b) => b.STAFF_COUNT - a.STAFF_COUNT)
      .slice(0, 6);
  },

  createRound(payload) {
    const store = needsStore.get();
    if (!payload?.title?.trim()) throw mockApiError("Give the assessment a title.");
    if (!payload.departments?.length) throw mockApiError("Choose at least one department.");
    if (!payload.start_date || !payload.deadline) throw mockApiError("Set the start date and deadline.");
    if (dayjs(payload.deadline).isBefore(payload.start_date, "day")) throw mockApiError("The deadline can't be before the start date.");
    if (payload.status === "OPEN" && store.rounds.some((r) => r.STATUS === "OPEN")) {
      throw mockApiError("Another assessment is already open. Close it before opening a new one.");
    }
    const round = {
      TNA_ID: mockId("tna"),
      TITLE: payload.title.trim(),
      YEAR: Number(payload.year),
      DESCRIPTION: payload.description?.trim() ?? "",
      OBJECTIVES: payload.objectives?.trim() ?? "",
      START_DATE: payload.start_date,
      DEADLINE: payload.deadline,
      RESPONSIBLE_OFFICER: payload.responsible_officer?.trim() ?? "",
      STATUS: payload.status ?? "DRAFT",
      DEPARTMENTS: payload.departments,
      CREATED_AT: now(),
    };
    store.rounds.push(round);
    payload.departments.forEach((department) =>
      store.submissions.push({
        SUBMISSION_ID: mockId("sub"),
        TNA_ID: round.TNA_ID,
        DEPARTMENT: department,
        STATUS: "NOT_STARTED",
        SUBMITTED_BY: "",
        SUBMITTED_AT: null,
        REVIEW_COMMENT: "",
        REVIEWED_AT: null,
      }),
    );
    needsStore.save();
    return {
      message: round.STATUS === "OPEN" ? `${round.TITLE} is open. ${payload.departments.length} departments will be notified.` : `${round.TITLE} saved as draft.`,
      data: { TNA_ID: round.TNA_ID },
    };
  },

  setRoundStatus(payload) {
    const store = needsStore.get();
    const round = getRound(store, payload?.tna_id);
    if (payload.status === "OPEN" && store.rounds.some((r) => r.STATUS === "OPEN" && r.TNA_ID !== round.TNA_ID)) {
      throw mockApiError("Another assessment is already open. Close it first.");
    }
    round.STATUS = payload.status;
    needsStore.save();
    return { message: payload.status === "OPEN" ? "Assessment opened. Departments will be notified." : "Assessment closed. Departments can no longer submit." };
  },

  saveNeed(payload) {
    const store = needsStore.get();
    const submission = findOrAdoptSubmission(store, payload);
    assertEditable(store, submission);
    const fields = needFields(payload);
    if (payload.need_id) {
      const need = store.needs.find((n) => n.NEED_ID === payload.need_id);
      if (!need) throw mockApiError("Need not found.");
      Object.assign(need, fields);
    } else {
      store.needs.push({
        NEED_ID: mockId("need"),
        TNA_ID: submission.TNA_ID,
        SUBMISSION_ID: submission.SUBMISSION_ID,
        DEPARTMENT: submission.DEPARTMENT,
        ...fields,
        STATUS: "PROPOSED",
        HR_COMMENT: "",
        SESSION_IDS: [],
      });
      if (submission.STATUS === "NOT_STARTED") submission.STATUS = "DRAFT";
    }
    needsStore.save();
    return { message: payload.need_id ? "Need updated." : "Need added." };
  },

  deleteNeed(payload) {
    const store = needsStore.get();
    const need = store.needs.find((n) => n.NEED_ID === payload?.need_id);
    if (!need) throw mockApiError("Need not found.");
    if (need.SESSION_IDS?.length) throw mockApiError("This need is already planned into a session.");
    assertEditable(store, store.submissions.find((s) => s.SUBMISSION_ID === need.SUBMISSION_ID));
    store.needs = store.needs.filter((n) => n.NEED_ID !== need.NEED_ID);
    needsStore.save();
    return { message: "Need removed." };
  },

  submitSubmission(payload) {
    const store = needsStore.get();
    const submission = findOrAdoptSubmission(store, payload);
    assertEditable(store, submission);
    if (!store.needs.some((n) => n.SUBMISSION_ID === submission.SUBMISSION_ID)) {
      throw mockApiError("Add at least one need before submitting.");
    }
    submission.STATUS = "SUBMITTED";
    submission.SUBMITTED_AT = now();
    submission.SUBMITTED_BY = payload.submitted_by ?? "HR Training Desk (on behalf)";
    needsStore.save();
    return { message: `${submission.DEPARTMENT} submission sent to HR for review.` };
  },

  reviewSubmission(payload) {
    const store = needsStore.get();
    const submission = store.submissions.find((s) => s.SUBMISSION_ID === payload?.submission_id);
    if (!submission) throw mockApiError("Submission not found.");
    if (submission.STATUS !== "SUBMITTED") throw mockApiError("Only submitted departments can be reviewed.");
    if (payload.action === "RETURN") {
      if (!payload.comment?.trim()) throw mockApiError("Say what the department needs to change.");
      submission.STATUS = "RETURNED";
      submission.REVIEW_COMMENT = payload.comment.trim();
      needsStore.save();
      return { message: `Returned to ${submission.DEPARTMENT}.` };
    }
    const undecided = store.needs.filter((n) => n.SUBMISSION_ID === submission.SUBMISSION_ID && n.STATUS === "PROPOSED");
    if (undecided.length) throw mockApiError(`Decide on all ${undecided.length} remaining need${undecided.length === 1 ? "" : "s"} first.`);
    submission.STATUS = "REVIEWED";
    submission.REVIEWED_AT = now();
    submission.REVIEW_COMMENT = payload.comment?.trim() ?? "";
    needsStore.save();
    return { message: `${submission.DEPARTMENT} marked as reviewed.` };
  },

  decideNeeds(payload) {
    const store = needsStore.get();
    const ids = new Set(payload?.need_ids ?? []);
    if (!ids.size) throw mockApiError("Select at least one need.");
    if (["REJECTED", "DEFERRED"].includes(payload.status) && !payload.comment?.trim()) {
      throw mockApiError(payload.status === "REJECTED" ? "Give a reason for rejecting." : "Say why it's deferred.");
    }
    let changed = 0;
    store.needs.forEach((n) => {
      if (!ids.has(n.NEED_ID)) return;
      if (n.SESSION_IDS?.length && payload.status !== "APPROVED") return; // planned needs stay approved
      n.STATUS = payload.status;
      n.HR_COMMENT = payload.comment?.trim() ?? n.HR_COMMENT;
      changed += 1;
    });
    needsStore.save();
    const verb = { APPROVED: "approved", REJECTED: "rejected", DEFERRED: "deferred", PROPOSED: "reset to proposed" }[payload.status];
    return { message: `${changed} need${changed === 1 ? "" : "s"} ${verb}.` };
  },

  remind(payload) {
    const count = payload?.submission_ids?.length ?? 0;
    if (!count) throw mockApiError("No departments selected.");
    return { message: `Reminder sent to ${count} department${count === 1 ? "" : "s"}.` };
  },
};

const MOCK_MUTATIONS = {
  "tna/create_round": (payload) => mockServer.createRound(payload),
  "tna/set_round_status": (payload) => mockServer.setRoundStatus(payload),
  "tna/save_need": (payload) => mockServer.saveNeed(payload),
  "tna/delete_need": (payload) => mockServer.deleteNeed(payload),
  "tna/submit": (payload) => mockServer.submitSubmission(payload),
  "tna/review": (payload) => mockServer.reviewSubmission(payload),
  "tna/decide_needs": (payload) => mockServer.decideNeeds(payload),
  "tna/remind": (payload) => mockServer.remind(payload),
};

function mapNeedStaff(member) {
  return {
    STAFF_ID: member.STAFF_ID,
    NAME: member.NAME || staffFullName(member),
    DESIGNATION: member.DESIGNATION ?? "",
  };
}

function mapNeed(need) {
  if (!need) return need;
  const staff = asArray(need.STAFF).map(mapNeedStaff);
  const proposedTitle = need.PROPOSED_TITLE ?? need.PROPOSED_COURSE ?? "";
  return {
    ...need,
    PROPOSED_TITLE: proposedTitle,
    EXPECTED_OUTCOME: need.EXPECTED_OUTCOME ?? need.EXPECTED_OUTCOMES ?? "",
    PARTICIPANTS: toNumber(need.PARTICIPANTS ?? need.EST_PARTICIPANTS),
    ESTIMATED_COST: toNumber(need.ESTIMATED_COST ?? need.EST_COST),
    HR_COMMENT: need.HR_COMMENT ?? need.HR_DECISION_COMMENT ?? "",
    TITLE: need.TITLE || need.COURSE_TITLE || proposedTitle,
    DEPARTMENT: need.DEPARTMENT ?? need.DEPARTMENT_NAME ?? "",
    COURSE_CODE: need.COURSE_CODE ?? "",
    STAFF: staff,
    STAFF_IDS: need.STAFF_IDS ?? staff.map((member) => member.STAFF_ID),
    SKILL_IDS: need.SKILL_IDS ?? asArray(need.SKILLS).map((skill) => skill.SKILL_ID),
    SESSIONS: need.SESSIONS ?? [],
  };
}

function mapSubmission(submission, needs = []) {
  if (!submission) return submission;
  const mappedNeeds = asArray(submission.NEEDS).map(mapNeed);
  const theirs = needs.length
    ? needs.filter((need) => String(need.SUBMISSION_ID) === String(submission.SUBMISSION_ID))
    : mappedNeeds;
  return {
    ...submission,
    DEPARTMENT: submission.DEPARTMENT ?? submission.DEPARTMENT_NAME ?? "",
    REVIEW_COMMENT: submission.REVIEW_COMMENT ?? submission.HR_COMMENT ?? "",
    NEED_COUNT: submission.NEED_COUNT ?? theirs.length,
    HIGH_PRIORITY: submission.HIGH_PRIORITY ?? theirs.filter((need) => need.PRIORITY === "HIGH").length,
    ESTIMATED_COST: submission.ESTIMATED_COST ?? theirs.reduce((sum, need) => sum + need.ESTIMATED_COST, 0),
    PARTICIPANTS: submission.PARTICIPANTS ?? theirs.reduce((sum, need) => sum + need.PARTICIPANTS, 0),
    APPROVED_COUNT: submission.APPROVED_COUNT ?? theirs.filter((need) => need.STATUS === "APPROVED").length,
    NEEDS: mappedNeeds,
  };
}

function statsFrom(submissions, needs) {
  const approved = needs.filter((need) => need.STATUS === "APPROVED");
  return {
    DEPARTMENT_COUNT: submissions.length,
    SUBMITTED_COUNT: submissions.filter((item) => SUBMITTED.includes(item.STATUS)).length,
    REVIEWED_COUNT: submissions.filter((item) => item.STATUS === "REVIEWED").length,
    AWAITING_REVIEW: submissions.filter((item) => item.STATUS === "SUBMITTED").length,
    NEED_COUNT: needs.length,
    APPROVED_COUNT: approved.length,
    PLANNED_COUNT: approved.filter((need) => need.SESSIONS.length).length,
    APPROVED_COST: approved.reduce((sum, need) => sum + need.ESTIMATED_COST, 0),
    APPROVED_PARTICIPANTS: approved.reduce((sum, need) => sum + need.PARTICIPANTS, 0),
  };
}

function mapRound(round, needs = []) {
  if (!round) return round;
  const submissions = asArray(round.SUBMISSIONS).map((item) => mapSubmission(item, needs));
  return addDaysLeft({
    ...round,
    SUBMISSIONS: submissions,
    ...statsFrom(submissions, needs),
  });
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** Proposed: POST training/tna/overview */
export const useGetNeedsOverview = () =>
  useQuery({
    queryKey: [QUERY_ROOT, "overview"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const overview = responseData(await postTraining("tna/overview", withCompany()));
      const rounds = responseList(await postTraining("tna/rounds", withCompany())).map(addDaysLeft);
      const sample = mockServer.overview();
      return fillUnconfirmed({
        ...overview,
        ACTIVE_ROUND: rounds.find((round) => round.STATUS === "OPEN") ?? null,
      }, sample);
    },
  });

/** Proposed: POST training/tna/rounds */
export const useGetTnaRounds = () =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "rounds"],
    endpoint: "tna/rounds",
    list: true,
    transform: (rounds) => sampleSparseList(
      rounds.map(addDaysLeft),
      mockServer.rounds(),
      (row) => row.TNA_ID,
    ),
  });

/** Proposed: GET training/tna/round/:tna_id — round + department submissions */
export const useGetTnaRound = (tnaId) =>
  useQuery({
    queryKey: [QUERY_ROOT, "round", tnaId],
    enabled: Boolean(tnaId),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (isSampleId(tnaId)) return tagSample(mapRound(mockServer.round(tnaId), mockServer.needs(tnaId)));
      const round = responseData(await getTraining(`tna/round/${tnaId}`));
      const needs = responseList(await postTraining("tna/needs", withCompany({ tna_id: tnaId }))).map(mapNeed);
      mapRound(round, needs).SUBMISSIONS
        ?.filter((item) => !needs.some((need) => String(need.SUBMISSION_ID) === String(item.SUBMISSION_ID)))
        .forEach((item) => seedHrTestNeed({ ...item, TNA_ID: item.TNA_ID ?? tnaId }));
      // Include needs drafted in sample mode (and the HR test need) in the round's counts.
      const mapped = mapRound(round, [...needs, ...liveCopyOverlay({ tnaId }).needs]);
      mapped.SUBMISSIONS = mapped.SUBMISSIONS?.map((item) => {
        const local = liveCopyOverlay({ submissionId: item.SUBMISSION_ID });
        if (!local.submission) return item;
        const all = [
          ...needs.filter((need) => String(need.SUBMISSION_ID) === String(item.SUBMISSION_ID)),
          ...local.needs,
        ];
        return {
          ...item,
          STATUS: local.submission.STATUS !== "NOT_STARTED" ? local.submission.STATUS : item.STATUS,
          NEED_COUNT: all.length,
          HIGH_PRIORITY: all.filter((need) => need.PRIORITY === "HIGH").length,
          ESTIMATED_COST: all.reduce((sum, need) => sum + need.ESTIMATED_COST, 0),
          PARTICIPANTS: all.reduce((sum, need) => sum + need.PARTICIPANTS, 0),
        };
      });
      const sample = mockServer.round("tna-2027");
      if (mapped.SUBMISSIONS?.length) return mapped;
      return fillUnconfirmed(mapped, {
        SUBMISSIONS: tagSample(sample.SUBMISSIONS),
        DEPARTMENT_COUNT: sample.DEPARTMENT_COUNT,
        SUBMITTED_COUNT: sample.SUBMITTED_COUNT,
        REVIEWED_COUNT: sample.REVIEWED_COUNT,
        AWAITING_REVIEW: sample.AWAITING_REVIEW,
        NEED_COUNT: sample.NEED_COUNT,
        APPROVED_COUNT: sample.APPROVED_COUNT,
        PLANNED_COUNT: sample.PLANNED_COUNT,
        APPROVED_COST: sample.APPROVED_COST,
        APPROVED_PARTICIPANTS: sample.APPROVED_PARTICIPANTS,
      });
    },
  });

/** Proposed: POST training/tna/needs — { tna_id } the needs register */
export const useGetTnaNeeds = (tnaId) =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "needs", tnaId],
    endpoint: "tna/needs",
    payload: { tna_id: tnaId },
    list: true,
    enabled: Boolean(tnaId),
    mockWhen: () => isSampleId(tnaId),
    mockHandler: () => mockServer.needs(tnaId),
    transform: (needs) => {
      const mapped = [...needs.map(mapNeed), ...liveCopyOverlay({ tnaId }).needs];
      if (mapped.length) return mapped;
      return tagSample(mockServer.needs("tna-2027"));
    },
  });

/** Proposed: GET training/tna/submission/:submission_id */
export const useGetTnaSubmission = (submissionId) =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "submission", submissionId],
    endpoint: `tna/submission/${submissionId}`,
    method: "GET",
    enabled: Boolean(submissionId),
    mockWhen: () => isSampleId(submissionId),
    mockHandler: () => tagSample(mockServer.submission(submissionId)),
    transform: (submission) => {
      const mapped = mapSubmission({
        ...submission,
        NEEDS: asArray(submission?.NEEDS),
      });
      if (!mapped.NEEDS.length) seedHrTestNeed({ ...mapped, SUBMISSION_ID: mapped.SUBMISSION_ID ?? submissionId });
      // Needs drafted in sample mode against this live submission (writes not live yet).
      const local = liveCopyOverlay({ submissionId });
      if (!local.submission) return mapped;
      const needs = [...mapped.NEEDS, ...local.needs];
      return {
        ...mapped,
        STATUS: local.submission.STATUS !== "NOT_STARTED" ? local.submission.STATUS : mapped.STATUS,
        SUBMITTED_AT: local.submission.SUBMITTED_AT ?? mapped.SUBMITTED_AT,
        NEEDS: needs,
        NEED_COUNT: needs.length,
        SAMPLE_FIELDS: [...(mapped.SAMPLE_FIELDS ?? []), "NEEDS", "STATUS"],
      };
    },
  });

/** Proposed: POST training/tna/skill_gaps — { department } (built from Skills & Competency data) */
export const useGetDepartmentSkillGaps = (department) =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "skill_gaps", department],
    endpoint: "tna/skill_gaps",
    payload: { department_id: department },
    list: true,
    enabled: Boolean(department),
    transform: (rows) => (rows.length ? rows : tagSample(mockServer.skillGaps(department))),
  });

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

const useNeedsMutation = (endpoint, mapPayload) =>
  useTrainingMutation({
    endpoint,
    mapPayload,
    invalidate: [[QUERY_ROOT], ["training_sessions"]],
    mockHandler: MOCK_MUTATIONS[endpoint],
    // The TNA mocks read the screen's field names (submission_id, need_ids, participants…).
    mockReceivesRawPayload: true,
  });

/** Proposed: POST training/tna/create_round — { title, year, description, objectives, start_date, deadline, responsible_officer, departments, status } */
export const useCreateTnaRound = () =>
  useNeedsMutation("tna/create_round", (payload) => ({
    company_id: payload.company_id,
    title: payload.title,
    year: payload.year,
    description: payload.description,
    objectives: payload.objectives,
    start_date: payload.start_date,
    deadline: payload.deadline,
    departments: payload.departments,
    responsible_officer: payload.responsible_officer_staff_id ?? payload.responsible_officer,
    status: payload.status,
    created_by: payload.created_by ?? getTrainingIdentity().staff_id,
  }));
/** Proposed: POST training/tna/set_round_status — { tna_id, status: OPEN | CLOSED } */
export const useSetTnaRoundStatus = () => useNeedsMutation("tna/set_round_status");
/** Proposed: POST training/tna/save_need — { need_id?, submission_id, ...need fields } */
export const useSaveTnaNeed = () =>
  useNeedsMutation("tna/save_need", (payload) => ({
    need_id: payload.need_id,
    tna_id: payload.tna_id ?? payload.TNA_ID,
    department_id: payload.department_id ?? payload.DEPARTMENT_ID,
    course_id: payload.course_id,
    proposed_course: payload.proposed_course ?? payload.proposed_title,
    source: payload.source,
    justification: payload.justification,
    expected_outcomes: payload.expected_outcomes ?? payload.expected_outcome,
    est_participants: payload.est_participants ?? payload.participants,
    est_cost: payload.est_cost ?? payload.estimated_cost,
    priority: payload.priority,
    skill_ids: payload.skill_ids,
    staff_ids: payload.staff_ids,
    created_by: payload.created_by ?? getTrainingIdentity().staff_id,
  }));
/** Proposed: POST training/tna/delete_need — { need_id } */
export const useDeleteTnaNeed = () => useNeedsMutation("tna/delete_need");
/** Proposed: POST training/tna/submit — { submission_id } */
export const useSubmitTnaSubmission = () =>
  useNeedsMutation("tna/submit", (payload) => withActor(payload, "submitted_by"));
/** Proposed: POST training/tna/review — { submission_id, action: ACCEPT | RETURN, comment } */
export const useReviewTnaSubmission = () =>
  useNeedsMutation("tna/review", (payload) => withActor({
    ...payload,
    action: payload.action === "ACCEPT" ? "REVIEWED" : payload.action,
    hr_comment: payload.hr_comment ?? payload.comment,
  }, "acted_by"));
/** Proposed: POST training/tna/decide_needs — { need_ids, status: APPROVED | DEFERRED | REJECTED | PROPOSED, comment } */
export const useDecideTnaNeeds = () =>
  useNeedsMutation("tna/decide_needs", (payload) => ({
    decided_by: payload.decided_by ?? getTrainingIdentity().staff_id,
    decisions: payload.decisions ?? (payload.need_ids ?? []).map((need_id) => ({
      need_id,
      status: payload.status,
      comment: payload.comment,
    })),
  }));
/** Proposed: POST training/tna/remind — { submission_ids } */
export const useRemindTnaDepartments = () =>
  useNeedsMutation("tna/remind", (payload) => ({
    tna_id: payload.tna_id ?? payload.TNA_ID,
  }));
