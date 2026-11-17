/**
 * Training Calendar (sessions) and Participant & Enrolment API hooks. The UI
 * keeps session identifiers while adapters map them to backend training IDs.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { mockApiError, mockId } from "./mock/mockStore";
import { courseById, needsStore, providersStore, requestsStore, sessionsStore, staffById } from "./mock/stores";
import { outcomeFromAttendance, sessionDays } from "./mock/trainingSessionsSeed";
import {
  asArray,
  getTrainingIdentity,
  mapTrainingAliases,
  postTraining,
  responseData,
  requireCompanyId,
  toNumber,
  useTrainingMutation,
  useTrainingQuery,
  withActor,
  withCompany,
} from "./trainingApi";
import {
  fillUnconfirmed,
  isSampleId,
  mergeSampleList,
  tagSample,
} from "./trainingSample";

const QUERY_ROOT = "training_sessions";
/** Participant statuses that hold a seat. */
const SEATED = ["NOMINATED", "CONFIRMED"];
const ACTIVE_ENROLMENT = [...SEATED, "WAITLISTED"];

const overlaps = (a, b) => !dayjs(a.START_DATE).isAfter(b.END_DATE, "day") && !dayjs(b.START_DATE).isAfter(a.END_DATE, "day");
const today = () => dayjs().startOf("day");
const nowStamp = () => dayjs().format("YYYY-MM-DD");

/** UPCOMING | IN_PROGRESS | AWAITING_CLOSE (ended, not closed) | COMPLETED | CANCELLED */
export function sessionPhase(session) {
  if (session.STATUS === "CANCELLED") return "CANCELLED";
  if (session.STATUS === "COMPLETED") return "COMPLETED";
  if (dayjs(session.START_DATE).isAfter(today(), "day")) return "UPCOMING";
  if (dayjs(session.END_DATE).isBefore(today(), "day")) return "AWAITING_CLOSE";
  return "IN_PROGRESS";
}

const trainerName = (id) => providersStore.get().trainers.find((t) => t.TRAINER_ID === id)?.FULL_NAME;
const providerNameOf = (id) => providersStore.get().providers.find((p) => p.PROVIDER_ID === id)?.PROVIDER_NAME ?? "";
const staffName = (s) => (s ? `${s.LAST_NAME} ${s.FIRST_NAME}` : "Unknown staff");

/** Clashes between `draft` and other live sessions: shared trainer, shared venue, shared participant. */
function findClashes(draft, sessions) {
  const others = sessions.filter(
    (s) => s.SESSION_ID !== draft.SESSION_ID && s.STATUS !== "CANCELLED" && s.STATUS !== "COMPLETED" && overlaps(s, draft),
  );
  const clashes = [];
  others.forEach((other) => {
    const label = `${courseById(other.COURSE_ID)?.COURSE_TITLE ?? "Another session"} (${dayjs(other.START_DATE).format("D MMM")}–${dayjs(other.END_DATE).format("D MMM")})`;
    (draft.TRAINER_IDS ?? [])
      .filter((id) => other.TRAINER_IDS.includes(id))
      .forEach((id) => clashes.push({ TYPE: "TRAINER", SESSION_ID: other.SESSION_ID, MESSAGE: `${trainerName(id) ?? "A trainer"} is also teaching ${label}.` }));
    if (draft.VENUE && other.VENUE && draft.VENUE.trim().toLowerCase() === other.VENUE.trim().toLowerCase() && draft.DELIVERY_METHOD !== "VIRTUAL") {
      clashes.push({ TYPE: "VENUE", SESSION_ID: other.SESSION_ID, MESSAGE: `${draft.VENUE} is booked for ${label}.` });
    }
    const shared = (draft.PARTICIPANTS ?? [])
      .filter((p) => SEATED.includes(p.STATUS))
      .filter((p) => other.PARTICIPANTS.some((o) => o.STAFF_ID === p.STAFF_ID && SEATED.includes(o.STATUS)));
    if (shared.length) {
      clashes.push({ TYPE: "PARTICIPANT", SESSION_ID: other.SESSION_ID, MESSAGE: `${shared.length} participant${shared.length === 1 ? " is" : "s are"} also enrolled in ${label}.` });
    }
  });
  return clashes;
}

/** Courses a staff member has completed (from closed sessions). */
function completedCourseIds(staffId, sessions) {
  return new Set(
    sessions
      .filter((s) => s.STATUS === "COMPLETED")
      .filter((s) => s.PARTICIPANTS.some((p) => p.STAFF_ID === staffId && p.OUTCOME === "COMPLETED"))
      .map((s) => s.COURSE_ID),
  );
}

/** Warnings shown when nominating a staff member to a session. */
function eligibilityFlags(staffId, session, sessions) {
  const member = staffById(staffId);
  const course = courseById(session.COURSE_ID);
  const done = completedCourseIds(staffId, sessions);
  const flags = [];
  if (course?.TARGET_GRADES?.length && member && !course.TARGET_GRADES.includes(member.GRADE)) {
    flags.push({ TYPE: "GRADE", MESSAGE: `Grade ${member.GRADE} is outside the course's target grades.` });
  }
  (course?.PREREQUISITE_IDS ?? [])
    .filter((id) => !done.has(id))
    .forEach((id) => flags.push({ TYPE: "PREREQUISITE", MESSAGE: `Hasn't completed ${courseById(id)?.COURSE_CODE ?? "a prerequisite"}.` }));
  if (done.has(session.COURSE_ID)) flags.push({ TYPE: "COMPLETED", MESSAGE: "Already completed this course." });
  sessions
    .filter((s) => s.SESSION_ID !== session.SESSION_ID && s.STATUS === "SCHEDULED" && overlaps(s, session))
    .filter((s) => s.PARTICIPANTS.some((p) => p.STAFF_ID === staffId && SEATED.includes(p.STATUS)))
    .forEach((s) => flags.push({ TYPE: "CLASH", MESSAGE: `Enrolled in ${courseById(s.COURSE_ID)?.COURSE_CODE} on the same dates.` }));
  return flags;
}

function enrichParticipant(participant, session, sessions) {
  const member = staffById(participant.STAFF_ID);
  const days = sessionDays(session.START_DATE, session.END_DATE);
  const markedDays = days.filter((d) => participant.ATTENDANCE[d]);
  const attended = markedDays.filter((d) => ["PRESENT", "LATE"].includes(participant.ATTENDANCE[d])).length;
  return {
    ...participant,
    FIRST_NAME: member?.FIRST_NAME ?? "",
    LAST_NAME: member?.LAST_NAME ?? "",
    STAFF_NUMBER: member?.STAFF_NUMBER ?? "",
    DESIGNATION: member?.DESIGNATION ?? "",
    DEPARTMENT: member?.DEPARTMENT ?? "",
    GRADE: member?.GRADE ?? "",
    ATTENDANCE_RATE: markedDays.length ? Math.round((attended / days.length) * 100) : null,
    FLAGS: ACTIVE_ENROLMENT.includes(participant.STATUS) ? eligibilityFlags(participant.STAFF_ID, session, sessions) : [],
  };
}

function summarise(session, sessions) {
  const course = courseById(session.COURSE_ID);
  const seated = session.PARTICIPANTS.filter((p) => SEATED.includes(p.STATUS));
  return {
    ...session,
    COURSE_TITLE: course?.COURSE_TITLE ?? "Unknown course",
    COURSE_CODE: course?.COURSE_CODE ?? "",
    PROGRAMME_ID: course?.PROGRAMME_ID ?? null,
    TRAINING_TYPE: course?.TRAINING_TYPE ?? null,
    PROVIDER_NAME: providerNameOf(session.PROVIDER_ID),
    TRAINER_NAMES: session.TRAINER_IDS.map(trainerName).filter(Boolean),
    ENROLLED: seated.length,
    CONFIRMED: seated.filter((p) => p.STATUS === "CONFIRMED").length,
    WAITLISTED: session.PARTICIPANTS.filter((p) => p.STATUS === "WAITLISTED").length,
    PHASE: sessionPhase(session),
    CLASHES: session.STATUS === "SCHEDULED" ? findClashes(session, sessions) : [],
  };
}

function getSession(store, sessionId) {
  const session = store.sessions.find((s) => s.SESSION_ID === sessionId);
  if (!session) throw mockApiError("Session not found.");
  return session;
}

function sessionFields(payload) {
  if (!payload?.course_id) throw mockApiError("Choose the catalogue course for this session.");
  if (!payload.start_date || !payload.end_date) throw mockApiError("Set the session dates.");
  if (dayjs(payload.end_date).isBefore(payload.start_date, "day")) throw mockApiError("The end date can't be before the start date.");
  const min = Number(payload.capacity_min ?? 0);
  const max = Number(payload.capacity_max ?? 0);
  if (max < 1) throw mockApiError("Maximum capacity must be at least 1.");
  if (min > max) throw mockApiError("Minimum participants can't be more than the maximum.");
  return {
    COURSE_ID: payload.course_id,
    PROVIDER_ID: payload.provider_id ?? null,
    TRAINER_IDS: payload.trainer_ids ?? [],
    START_DATE: payload.start_date,
    END_DATE: payload.end_date,
    START_TIME: payload.start_time ?? "09:00",
    END_TIME: payload.end_time ?? "16:00",
    DELIVERY_METHOD: payload.delivery_method,
    LOCATION: payload.location ?? "LOCAL",
    VENUE: payload.venue?.trim() ?? "",
    CITY: payload.city?.trim() ?? "",
    MEETING_LINK: payload.meeting_link?.trim() ?? "",
    CAPACITY_MIN: min,
    CAPACITY_MAX: max,
    COST_PER_PARTICIPANT: Number(payload.cost_per_participant ?? 0),
    NOTES: payload.notes?.trim() ?? "",
  };
}

/** Fill free seats from the waitlist, oldest first. Returns how many were promoted. */
function promoteFromWaitlist(session) {
  let free = session.CAPACITY_MAX - session.PARTICIPANTS.filter((p) => SEATED.includes(p.STATUS)).length;
  let promoted = 0;
  session.PARTICIPANTS.filter((p) => p.STATUS === "WAITLISTED").forEach((p) => {
    if (free <= 0) return;
    p.STATUS = "NOMINATED";
    p.STATUS_NOTE = "Moved up from the waitlist.";
    free -= 1;
    promoted += 1;
  });
  return promoted;
}

/** When a session is created from a TNA need or an approved request, link them back. */
function linkOrigin(session, payload) {
  if (payload.need_id) {
    const ids = String(payload.need_id).split(",");
    const needs = needsStore.get().needs.filter((n) => ids.includes(n.NEED_ID));
    needs.forEach((need) => {
      need.SESSION_IDS = [...new Set([...(need.SESSION_IDS ?? []), session.SESSION_ID])];
    });
    if (needs.length) {
      needsStore.save();
      return needs.length > 1 ? ` and linked to ${needs.length} training needs` : " and linked to the training need";
    }
  }
  if (payload.request_id) {
    const request = requestsStore.get().requests.find((r) => r.REQUEST_ID === payload.request_id);
    if (request && request.STATUS === "APPROVED") {
      mockServer.addParticipants({ session_id: session.SESSION_ID, staff_ids: [request.STAFF_ID], source: "REQUEST", reference_id: request.REQUEST_ID });
      request.STATUS = "SCHEDULED";
      request.SESSION_ID = session.SESSION_ID;
      request.HISTORY.push({ ACTION: "SCHEDULED", BY: "HR Training Desk", AT: nowStamp(), COMMENT: "" });
      requestsStore.save();
      return ", with the requester enrolled";
    }
  }
  return "";
}

const mockServer = {
  overview() {
    const { sessions } = sessionsStore.get();
    const live = sessions.filter((s) => s.STATUS === "SCHEDULED");
    const soon = live.filter((s) => !dayjs(s.START_DATE).isAfter(today().add(30, "day"), "day") && !dayjs(s.END_DATE).isBefore(today(), "day"));
    const upcoming = live.filter((s) => dayjs(s.START_DATE).isAfter(today(), "day"));
    const seats = upcoming.reduce((sum, s) => sum + s.CAPACITY_MAX, 0);
    const filled = upcoming.reduce((sum, s) => sum + s.PARTICIPANTS.filter((p) => SEATED.includes(p.STATUS)).length, 0);
    const closed = sessions.filter((s) => s.STATUS === "COMPLETED");
    const outcomes = closed.flatMap((s) => s.PARTICIPANTS.filter((p) => p.OUTCOME));
    return {
      NEXT_30_DAYS: soon.length,
      IN_PROGRESS: live.filter((s) => sessionPhase(s) === "IN_PROGRESS").length,
      SESSIONS_THIS_YEAR: sessions.filter((s) => s.STATUS !== "CANCELLED" && dayjs(s.START_DATE).year() === today().year()).length,
      SEAT_FILL_RATE: seats ? Math.round((filled / seats) * 100) : 0,
      UPCOMING_SEATS: seats,
      SESSIONS_WITH_CLASHES: live.filter((s) => findClashes(s, sessions).length).length,
      AWAITING_CLOSE: live.filter((s) => sessionPhase(s) === "AWAITING_CLOSE").length,
      COMPLETION_RATE: outcomes.length ? Math.round((outcomes.filter((p) => p.OUTCOME === "COMPLETED").length / outcomes.length) * 100) : null,
    };
  },

  sessions() {
    const { sessions } = sessionsStore.get();
    return sessions.map((s) => summarise(s, sessions)).sort((a, b) => a.START_DATE.localeCompare(b.START_DATE));
  },

  session(sessionId) {
    const store = sessionsStore.get();
    const session = getSession(store, sessionId);
    return {
      ...summarise(session, store.sessions),
      DAYS: sessionDays(session.START_DATE, session.END_DATE),
      PARTICIPANTS: session.PARTICIPANTS.map((p) => enrichParticipant(p, session, store.sessions)),
    };
  },

  checkClashes(draft) {
    const store = sessionsStore.get();
    const existing = draft.session_id ? store.sessions.find((s) => s.SESSION_ID === draft.session_id) : null;
    return findClashes(
      {
        SESSION_ID: draft.session_id,
        START_DATE: draft.start_date,
        END_DATE: draft.end_date,
        TRAINER_IDS: draft.trainer_ids ?? [],
        VENUE: draft.venue ?? "",
        DELIVERY_METHOD: draft.delivery_method,
        PARTICIPANTS: existing?.PARTICIPANTS ?? [],
      },
      store.sessions,
    );
  },

  createSession(payload) {
    const store = sessionsStore.get();
    const course = courseById(payload?.course_id);
    if (!course || course.STATUS !== "ACTIVE") throw mockApiError("Only active catalogue courses can be scheduled.");
    const session = {
      SESSION_ID: mockId("ses"),
      ...sessionFields(payload),
      STATUS: "SCHEDULED",
      CANCEL_REASON: "",
      HISTORY: [{ TYPE: "CREATED", AT: nowStamp(), BY: "HR Training Desk", NOTE: "" }],
      PARTICIPANTS: [],
    };
    store.sessions.push(session);
    sessionsStore.save();
    const linked = linkOrigin(session, payload);
    return { message: `${course.COURSE_TITLE} scheduled for ${dayjs(session.START_DATE).format("D MMM YYYY")}${linked}.`, data: { SESSION_ID: session.SESSION_ID } };
  },

  updateSession(payload) {
    const store = sessionsStore.get();
    const session = getSession(store, payload?.session_id);
    if (session.STATUS !== "SCHEDULED") throw mockApiError("Only scheduled sessions can be edited.");
    const fields = sessionFields({ ...payload, course_id: session.COURSE_ID });
    const moved = fields.START_DATE !== session.START_DATE || fields.END_DATE !== session.END_DATE;
    if (moved && !payload.reschedule_reason?.trim()) throw mockApiError("Give a reason for changing the dates.");
    const seated = session.PARTICIPANTS.filter((p) => SEATED.includes(p.STATUS)).length;
    if (fields.CAPACITY_MAX < seated) {
      throw mockApiError(`${seated} participants already hold seats. Withdraw some before lowering capacity to ${fields.CAPACITY_MAX}.`);
    }
    if (moved) {
      session.HISTORY.push({
        TYPE: "RESCHEDULED",
        AT: nowStamp(),
        BY: "HR Training Desk",
        NOTE: `${dayjs(session.START_DATE).format("D MMM")} → ${dayjs(fields.START_DATE).format("D MMM YYYY")}. ${payload.reschedule_reason.trim()}`,
      });
      // Attendance taken for dropped days no longer applies.
      const days = new Set(sessionDays(fields.START_DATE, fields.END_DATE));
      session.PARTICIPANTS.forEach((p) => {
        p.ATTENDANCE = Object.fromEntries(Object.entries(p.ATTENDANCE).filter(([d]) => days.has(d)));
      });
    }
    Object.assign(session, fields);
    const promoted = promoteFromWaitlist(session);
    sessionsStore.save();
    return {
      message: `${moved ? "Session rescheduled. Participants will be notified." : "Session updated."}${promoted ? ` ${promoted} moved up from the waitlist.` : ""}`,
    };
  },

  cancelSession(payload) {
    const store = sessionsStore.get();
    const session = getSession(store, payload?.session_id);
    if (!payload.reason?.trim()) throw mockApiError("Give a reason for cancelling.");
    session.STATUS = "CANCELLED";
    session.CANCEL_REASON = payload.reason.trim();
    session.HISTORY.push({ TYPE: "CANCELLED", AT: nowStamp(), BY: "HR Training Desk", NOTE: session.CANCEL_REASON });
    sessionsStore.save();
    return { message: "Session cancelled. Participants will be notified." };
  },

  completeSession(payload) {
    const store = sessionsStore.get();
    const session = getSession(store, payload?.session_id);
    if (dayjs(session.START_DATE).isAfter(today(), "day")) throw mockApiError("A session can't be closed before it starts.");
    const days = sessionDays(session.START_DATE, session.END_DATE);
    const seated = session.PARTICIPANTS.filter((p) => SEATED.includes(p.STATUS));
    seated.forEach((p) => {
      p.OUTCOME = outcomeFromAttendance(p.ATTENDANCE, days);
    });
    session.PARTICIPANTS.filter((p) => p.STATUS === "WAITLISTED").forEach((p) => {
      p.STATUS = "WITHDRAWN";
      p.STATUS_NOTE = "Session closed while on the waitlist.";
    });
    session.STATUS = "COMPLETED";
    session.HISTORY.push({ TYPE: "COMPLETED", AT: nowStamp(), BY: "HR Training Desk", NOTE: "" });
    sessionsStore.save();
    const completed = seated.filter((p) => p.OUTCOME === "COMPLETED").length;
    return { message: `Session closed. ${completed} of ${seated.length} participants completed. Feedback forms will be sent.` };
  },

  addParticipants(payload) {
    const store = sessionsStore.get();
    const session = getSession(store, payload?.session_id);
    if (session.STATUS !== "SCHEDULED") throw mockApiError("Participants can only be added to scheduled sessions.");
    const ids = [...new Set(payload.staff_ids ?? [])];
    if (!ids.length) throw mockApiError("Choose at least one staff member.");
    let added = 0;
    let waitlisted = 0;
    let skipped = 0;
    ids.forEach((staffId) => {
      const existing = session.PARTICIPANTS.find((p) => p.STAFF_ID === staffId);
      if (existing && ACTIVE_ENROLMENT.includes(existing.STATUS)) {
        skipped += 1;
        return;
      }
      const full = session.PARTICIPANTS.filter((p) => SEATED.includes(p.STATUS)).length >= session.CAPACITY_MAX;
      const record = {
        PARTICIPANT_ID: mockId("par"),
        STAFF_ID: staffId,
        STATUS: full ? "WAITLISTED" : "NOMINATED",
        SOURCE: payload.source ?? "HR_NOMINATION",
        REFERENCE_ID: payload.reference_id ?? null,
        ATTENDANCE: {},
        OUTCOME: null,
        STATUS_NOTE: "",
        ADDED_AT: nowStamp(),
      };
      if (existing) {
        // Re-nominating a withdrawn participant reuses their record.
        Object.assign(existing, { ...record, PARTICIPANT_ID: existing.PARTICIPANT_ID });
      } else {
        session.PARTICIPANTS.push(record);
      }
      if (full) waitlisted += 1;
      else added += 1;
    });
    sessionsStore.save();
    const parts = [];
    if (added) parts.push(`${added} nominated`);
    if (waitlisted) parts.push(`${waitlisted} added to the waitlist (session full)`);
    if (skipped) parts.push(`${skipped} already enrolled`);
    return { message: `${parts.join(", ")}.`, data: { added, waitlisted, skipped } };
  },

  setParticipantStatus(payload) {
    const store = sessionsStore.get();
    const session = getSession(store, payload?.session_id);
    const participant = session.PARTICIPANTS.find((p) => p.PARTICIPANT_ID === payload.participant_id);
    if (!participant) throw mockApiError("Participant not found.");
    const name = staffName(staffById(participant.STAFF_ID));

    if (payload.status === "WITHDRAWN") {
      if (!payload.reason?.trim()) throw mockApiError("Give a reason for withdrawing this participant.");
      participant.STATUS = "WITHDRAWN";
      participant.STATUS_NOTE = payload.reason.trim();
      const promoted = promoteFromWaitlist(session);
      sessionsStore.save();
      return { message: `${name} withdrawn.${promoted ? ` ${promoted} moved up from the waitlist.` : ""}` };
    }
    if (payload.status === "NOMINATED" && participant.STATUS === "WAITLISTED") {
      const seated = session.PARTICIPANTS.filter((p) => SEATED.includes(p.STATUS)).length;
      if (seated >= session.CAPACITY_MAX) throw mockApiError("The session is full. Withdraw someone or raise capacity first.");
    }
    participant.STATUS = payload.status;
    participant.STATUS_NOTE = payload.reason?.trim() ?? participant.STATUS_NOTE;
    sessionsStore.save();
    const verbs = { CONFIRMED: "confirmed", NOMINATED: "given a seat", WAITLISTED: "moved to the waitlist" };
    return { message: `${name} ${verbs[payload.status] ?? "updated"}.` };
  },

  replaceParticipant(payload) {
    const store = sessionsStore.get();
    const session = getSession(store, payload?.session_id);
    const participant = session.PARTICIPANTS.find((p) => p.PARTICIPANT_ID === payload.participant_id);
    if (!participant) throw mockApiError("Participant not found.");
    if (!payload.staff_id) throw mockApiError("Choose the replacement.");
    if (session.PARTICIPANTS.some((p) => p.STAFF_ID === payload.staff_id && ACTIVE_ENROLMENT.includes(p.STATUS))) {
      throw mockApiError("The replacement is already enrolled in this session.");
    }
    const replacement = staffById(payload.staff_id);
    const wasStatus = SEATED.includes(participant.STATUS) ? "NOMINATED" : participant.STATUS;
    participant.STATUS = "WITHDRAWN";
    participant.STATUS_NOTE = `Replaced by ${staffName(replacement)}. ${payload.reason?.trim() ?? ""}`.trim();
    session.PARTICIPANTS.push({
      PARTICIPANT_ID: mockId("par"),
      STAFF_ID: payload.staff_id,
      STATUS: wasStatus,
      SOURCE: "HR_NOMINATION",
      REFERENCE_ID: null,
      ATTENDANCE: {},
      OUTCOME: null,
      STATUS_NOTE: `Replacing ${staffName(staffById(participant.STAFF_ID))}.`,
      ADDED_AT: nowStamp(),
    });
    sessionsStore.save();
    return { message: `${staffName(replacement)} takes the seat.` };
  },

  setAttendance(payload) {
    const store = sessionsStore.get();
    const session = getSession(store, payload?.session_id);
    if (session.STATUS === "CANCELLED") throw mockApiError("This session was cancelled.");
    if (dayjs(payload.date).isAfter(today(), "day")) throw mockApiError("Attendance can't be taken for a future day.");
    const targets = payload.participant_id
      ? session.PARTICIPANTS.filter((p) => p.PARTICIPANT_ID === payload.participant_id)
      : session.PARTICIPANTS.filter((p) => SEATED.includes(p.STATUS) && !p.ATTENDANCE[payload.date]);
    targets.forEach((p) => {
      if (payload.value) p.ATTENDANCE[payload.date] = payload.value;
      else delete p.ATTENDANCE[payload.date];
    });
    if (session.STATUS === "COMPLETED") {
      const days = sessionDays(session.START_DATE, session.END_DATE);
      targets.forEach((p) => {
        p.OUTCOME = outcomeFromAttendance(p.ATTENDANCE, days);
      });
    }
    sessionsStore.save();
    return { message: payload.participant_id ? "Attendance saved." : `Marked ${targets.length} present.` };
  },

  staffHistory(staffId) {
    const { sessions } = sessionsStore.get();
    return sessions
      .filter((s) => s.PARTICIPANTS.some((p) => p.STAFF_ID === staffId))
      .map((s) => {
        const p = s.PARTICIPANTS.find((x) => x.STAFF_ID === staffId);
        const course = courseById(s.COURSE_ID);
        return {
          SESSION_ID: s.SESSION_ID,
          COURSE_TITLE: course?.COURSE_TITLE,
          COURSE_CODE: course?.COURSE_CODE,
          START_DATE: s.START_DATE,
          END_DATE: s.END_DATE,
          SESSION_STATUS: s.STATUS,
          PARTICIPANT_STATUS: p.STATUS,
          OUTCOME: p.OUTCOME,
        };
      })
      .sort((a, b) => b.START_DATE.localeCompare(a.START_DATE));
  },

  eligibility(payload) {
    const store = sessionsStore.get();
    const session = getSession(store, payload?.session_id);
    return Object.fromEntries(
      (payload.staff_ids ?? []).map((id) => {
        const existing = session.PARTICIPANTS.find((p) => p.STAFF_ID === id);
        return [
          id,
          {
            ENROLMENT_STATUS: existing && ACTIVE_ENROLMENT.includes(existing.STATUS) ? existing.STATUS : null,
            FLAGS: eligibilityFlags(id, session, store.sessions),
          },
        ];
      }),
    );
  },
};

/** Plain (non-hook) enrolment used by other mock modules, e.g. scheduling an approved request. */
export const mockEnrolStaff = (payload) => mockServer.addParticipants(payload);

const MOCK_MUTATIONS = {
  "sessions/create": (payload) => mockServer.createSession(payload),
  "sessions/update": (payload) => mockServer.updateSession(payload),
  "sessions/cancel": (payload) => mockServer.cancelSession(payload),
  "sessions/complete": (payload) => mockServer.completeSession(payload),
  "sessions/add_participants": (payload) => mockServer.addParticipants(payload),
  "sessions/participant_status": (payload) => mockServer.setParticipantStatus(payload),
  "sessions/replace_participant": (payload) => mockServer.replaceParticipant(payload),
  "sessions/attendance": (payload) => mockServer.setAttendance(payload),
};

const SESSION_ALIASES = { TRAINING_ID: "SESSION_ID", TRAINING_TITLE: "COURSE_TITLE" };

function sessionDayList(start, end) {
  if (!start || !end) return [];
  const days = [];
  let cursor = dayjs(start).startOf("day");
  const last = dayjs(end).startOf("day");
  while (!cursor.isAfter(last, "day")) {
    days.push(cursor.format("YYYY-MM-DD"));
    cursor = cursor.add(1, "day");
  }
  return days;
}

function sessionStatusOf(session) {
  if (session.SESSION_STATUS) return session.SESSION_STATUS;
  if (["SCHEDULED", "COMPLETED", "CANCELLED"].includes(session.STATUS)) return session.STATUS;
  if (session.IS_COMPLETED) return "COMPLETED";
  return "SCHEDULED";
}

function mapParticipant(participant) {
  return {
    ...participant,
    FIRST_NAME: String(participant.FIRST_NAME ?? "").trim(),
    LAST_NAME: String(participant.LAST_NAME ?? "").trim(),
    PARTICIPANT_ID: participant.PARTICIPANT_ID ?? participant.PARTICIPANT_EXT_ID,
    STATUS: participant.STATUS ?? participant.PARTICIPANT_STATUS,
    ATTENDANCE: participant.ATTENDANCE ?? {},
    FLAGS: participant.FLAGS ?? [],
    DEPARTMENT: participant.DEPARTMENT ?? participant.DEPARTMENT_ID ?? "",
    STAFF_NUMBER: participant.STAFF_NUMBER ?? "",
    DESIGNATION: participant.DESIGNATION ?? "",
  };
}

function mapSession(session) {
  if (!session) return session;
  const aliased = mapTrainingAliases(session, SESSION_ALIASES);
  const trainers = asArray(aliased.TRAINERS);
  const participants = asArray(aliased.PARTICIPANTS).map(mapParticipant);
  const status = sessionStatusOf(aliased);
  const seated = participants.filter((p) => ["NOMINATED", "CONFIRMED"].includes(p.STATUS)).length;
  const trainerNames = aliased.TRAINER_NAMES
    ?? trainers.map((trainer) => trainer.FULL_NAME).filter(Boolean);
  return {
    ...aliased,
    COURSE_TITLE: aliased.COURSE_TITLE || aliased.TRAINING_TITLE || "",
    STATUS: status,
    PHASE: aliased.PHASE || sessionPhase({ ...aliased, STATUS: status }),
    ENROLLED: aliased.ENROLLED ?? (participants.length ? seated : toNumber(aliased.PARTICIPANT_COUNT)),
    CONFIRMED: aliased.CONFIRMED ?? participants.filter((p) => p.STATUS === "CONFIRMED").length,
    WAITLISTED: aliased.WAITLISTED ?? participants.filter((p) => p.STATUS === "WAITLISTED").length,
    TRAINER_NAMES: trainerNames,
    TRAINER_IDS: aliased.TRAINER_IDS ?? trainers.map((trainer) => trainer.TRAINER_ID),
    PARTICIPANTS: participants,
    DAYS: aliased.DAYS ?? sessionDayList(aliased.START_DATE, aliased.END_DATE),
    CLASHES: aliased.CLASHES ?? [],
    HISTORY: aliased.HISTORY ?? [],
    COST_PER_PARTICIPANT: toNumber(aliased.COST_PER_PARTICIPANT),
  };
}

function clashMessage(warning) {
  if (warning.MESSAGE) return warning.MESSAGE;
  const detail = warning.DETAIL ?? {};
  const title = detail.TRAINING_TITLE || "another session";
  const range = [detail.START_DATE, detail.END_DATE].filter(Boolean)
    .map((value) => dayjs(value).format("D MMM YYYY"))
    .join(" – ");
  const when = range ? ` (${range})` : "";
  if (warning.TYPE === "TRAINER") return `This trainer is also assigned to ${title}${when}.`;
  if (warning.TYPE === "VENUE") return `${detail.VENUE || "This venue"} is also booked for ${title}${when}.`;
  if (warning.TYPE === "PARTICIPANT") return `A participant is also enrolled in ${title}${when}.`;
  return `${warning.TYPE || "Clash"} with ${title}${when}`;
}

function mapClashes(data) {
  if (Array.isArray(data)) return data;
  return asArray(data?.WARNINGS ?? data?.CLASHES).map((warning) => {
    const detail = warning.DETAIL ?? {};
    return {
      TYPE: warning.TYPE,
      SESSION_ID: detail.TRAINING_ID ?? detail.SESSION_ID,
      MESSAGE: clashMessage(warning),
      BLOCKING: data?.BLOCKING,
    };
  });
}

function mapEligibility(data) {
  if (data && typeof data === "object" && !Array.isArray(data) && ("ELIGIBLE" in data || "ISSUES" in data)) {
    return {
      ENROLMENT_STATUS: data.ENROLMENT_STATUS ?? null,
      FLAGS: asArray(data.ISSUES ?? data.FLAGS).map((issue) => (
        typeof issue === "string" ? { TYPE: "ISSUE", MESSAGE: issue } : issue
      )),
      ELIGIBLE: data.ELIGIBLE,
    };
  }
  return data;
}

function mapHistoryRow(row) {
  const aliased = mapTrainingAliases(row, SESSION_ALIASES);
  return {
    ...aliased,
    COURSE_TITLE: aliased.COURSE_TITLE || aliased.TRAINING_TITLE || "",
    SESSION_STATUS: aliased.SESSION_STATUS ?? (aliased.IS_COMPLETED ? "COMPLETED" : "SCHEDULED"),
  };
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** Proposed: POST training/sessions/overview */
export const useGetSessionsOverview = () =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "overview"],
    endpoint: "sessions/overview",
    transform: (data = {}) => fillUnconfirmed({
      ...data,
      SCHEDULED: toNumber(data.SCHEDULED),
      COMPLETED: toNumber(data.COMPLETED),
      CANCELLED: toNumber(data.CANCELLED),
      PARTICIPANTS: toNumber(data.PARTICIPANTS),
      YEAR: data.YEAR,
    }, mockServer.overview()),
  });

/** Proposed: POST training/sessions/list — add date-range params once data grows. */
export const useGetSessions = () =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "list"],
    endpoint: "sessions/list",
    list: true,
    transform: (rows) => mergeSampleList(
      rows.map(mapSession),
      mockServer.sessions().filter((session) => ["ses-1", "ses-7", "ses-8"].includes(session.SESSION_ID)),
      (row) => row.SESSION_ID,
    ),
  });

/** Proposed: GET training/sessions/detail/:session_id */
export const useGetSession = (sessionId) =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "detail", sessionId],
    endpoint: `sessions/detail/${sessionId}`,
    method: "GET",
    enabled: Boolean(sessionId),
    mockWhen: () => isSampleId(sessionId),
    mockHandler: () => tagSample(mockServer.session(sessionId)),
    transform: mapSession,
  });

/** Proposed: POST training/sessions/check_clashes — live warnings while scheduling. */
export const useCheckSessionClashes = (draft, enabled) =>
  useQuery({
    queryKey: [QUERY_ROOT, "clashes", draft],
    queryFn: async () => mapClashes(responseData(await postTraining("sessions/check_clashes", withCompany({
      start_date: draft.start_date,
      end_date: draft.end_date,
      trainer_ids: draft.trainer_ids ?? [],
      venue: draft.venue ?? "",
    })))),
    enabled: Boolean(enabled),
    placeholderData: keepPreviousData,
  });

/** Proposed: POST training/sessions/eligibility — { session_id, staff_ids } → flags per staff */
export const useGetEnrolmentEligibility = (session, staffIds) =>
  useQuery({
    queryKey: [QUERY_ROOT, "eligibility", session?.SESSION_ID, staffIds],
    queryFn: async () => {
      if (!session?.COURSE_ID) return {};
      const companyId = requireCompanyId();
      const results = await Promise.all(staffIds.map(async (staffId) => {
        const envelope = await postTraining("sessions/eligibility", {
          company_id: companyId,
          staff_id: staffId,
          course_id: session.COURSE_ID,
        });
        const data = responseData(envelope);
        return [staffId, mapEligibility(data?.[staffId] ?? data)];
      }));
      return Object.fromEntries(results);
    },
    enabled: Boolean(session?.SESSION_ID && session?.COURSE_ID && staffIds?.length),
    placeholderData: keepPreviousData,
  });

/** Proposed: GET training/sessions/staff_history/:staff_id — replaces the dummy history in RecipientSelector. */
export const useGetStaffTrainingHistory = (staffId) =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "history", staffId],
    endpoint: `sessions/staff_history/${staffId}`,
    method: "GET",
    enabled: Boolean(staffId),
    list: true,
    transform: (rows) => rows.map(mapHistoryRow),
  });

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

const useSessionsMutation = (endpoint, mapPayload) =>
  useTrainingMutation({
    endpoint,
    mapPayload,
    invalidate: [[QUERY_ROOT], ["training_requests"], ["training_needs"]],
    mockHandler: MOCK_MUTATIONS[endpoint],
  });

/** Proposed: POST training/sessions/create */
export const useCreateSession = () =>
  useSessionsMutation("sessions/create", (payload) => ({
    ...payload,
    need_ids: payload.need_ids ?? (payload.need_id ? [payload.need_id] : undefined),
    created_by: payload.created_by ?? getTrainingIdentity().staff_id,
  }));
/** Proposed: POST training/sessions/update — `reschedule_reason` required when dates change */
export const useUpdateSession = () =>
  useSessionsMutation("sessions/update", (payload) => ({
    ...payload,
    training_id: payload.training_id ?? payload.session_id,
    reason: payload.reason ?? payload.reschedule_reason,
    updated_by: payload.updated_by ?? getTrainingIdentity().staff_id,
  }));
/** Proposed: POST training/sessions/cancel — { session_id, reason } */
export const useCancelSession = () =>
  useSessionsMutation("sessions/cancel", (payload) => withActor({
    ...payload,
    training_id: payload.training_id ?? payload.session_id,
  }));
/** Proposed: POST training/sessions/complete — { session_id } closes it and sets outcomes */
export const useCompleteSession = () =>
  useSessionsMutation("sessions/complete", (payload) => ({
    ...payload,
    training_id: payload.training_id ?? payload.session_id,
  }));
/** Proposed: POST training/sessions/add_participants — { session_id, staff_ids, source, reference_id } */
export const useAddSessionParticipants = () =>
  useSessionsMutation("sessions/add_participants", (payload) => ({
    ...payload,
    training_id: payload.training_id ?? payload.session_id,
  }));
/** Proposed: POST training/sessions/participant_status — { session_id, participant_id, status, reason } */
export const useSetParticipantStatus = () =>
  useSessionsMutation("sessions/participant_status", (payload) => ({
    ...payload,
    training_id: payload.training_id ?? payload.session_id,
    participant_status: payload.participant_status ?? payload.status,
  }));
/** Proposed: POST training/sessions/replace_participant — { session_id, participant_id, staff_id, reason } */
export const useReplaceParticipant = () =>
  useSessionsMutation("sessions/replace_participant", (payload) => ({
    ...payload,
    training_id: payload.training_id ?? payload.session_id,
    old_staff_id: payload.old_staff_id,
    new_staff_id: payload.new_staff_id ?? payload.staff_id,
  }));
/** Proposed: POST training/sessions/attendance — { session_id, date, participant_id?, value } (no participant = mark all unmarked present) */
export const useSetAttendance = () =>
  useSessionsMutation("sessions/attendance", (payload) => ({
    training_id: payload.training_id ?? payload.session_id,
    recorded_by: getTrainingIdentity().staff_id,
    records: payload.records?.map((record) => ({
      staff_id: record.staff_id,
      status: record.status ?? record.value,
      attendance_date: record.attendance_date ?? payload.date,
      notes: record.notes,
    })) ?? (payload.staff_id ? [{
      staff_id: payload.staff_id,
      status: payload.value,
      attendance_date: payload.date,
      notes: payload.notes,
    }] : []),
  }));
