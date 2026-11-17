/**
 * Demo seed for the Training Calendar & Enrolment UI prototype.
 * Sessions are scheduled runs of catalogue courses; participants are staff from the skills seed,
 * trainers come from the providers seed. Includes deliberate trainer/venue clashes, a full session
 * with a waitlist, a cancelled session and one running today.
 * Remove once the real sessions endpoints are live.
 */
import dayjs from "dayjs";
import { buildCatalogueSeed } from "./trainingCatalogueSeed";
import { buildProvidersSeed } from "./trainingProvidersSeed";
import { buildSkillsSeed } from "./trainingSkillsSeed";
import { buildRequestsSeed } from "./trainingRequestsSeed";

// [courseId, startDate, venue, city, capacity, enrolTarget, status, extra]
const PLAN = [
  ["crs-saf101", "2026-06-15", "HQ Training Room A", "Abuja", 20, 16, "COMPLETED"],
  ["crs-cmp101", "2026-07-06", "HQ Auditorium", "Abuja", 40, 24, "COMPLETED"],
  ["crs-dig101", "2026-08-10", "Microsoft Teams", "", 25, 18, "COMPLETED", { MEETING_LINK: "https://teams.microsoft.com/l/meetup-join/demo-dig101" }],
  ["crs-ldp101", "2026-09-14", "Institute of Public Leadership", "Abuja", 20, 14, "COMPLETED"],
  ["crs-fin110", "2026-10-05", "HQ Training Room B", "Abuja", 15, 10, "COMPLETED"],
  ["crs-ind110", "2026-10-19", "Lagos Regional Office", "Lagos", 20, 12, "CANCELLED", { CANCEL_REASON: "Facilitator unavailable. Re-planned for February 2027." }],
  ["crs-ldp110", "2026-11-09", "HQ Training Room A", "Abuja", 20, 15, "SCHEDULED"],
  ["crs-saf201", "2026-11-16", "Regional Aviation Training Centre", "Nairobi", 8, 10, "SCHEDULED"],
  ["crs-cmp120", "2026-11-23", "HQ Training Room B", "Abuja", 18, 11, "SCHEDULED"],
  ["crs-dig110", "2026-11-24", "HQ Training Room B", "Abuja", 16, 9, "SCHEDULED", { MEETING_LINK: "https://teams.microsoft.com/l/meetup-join/demo-dig110" }],
  ["crs-fin101", "2026-12-01", "HQ Training Room A", "Abuja", 15, 8, "SCHEDULED"],
  ["crs-ldp201", "2026-12-07", "Institute of Public Leadership", "Abuja", 18, 12, "SCHEDULED"],
  ["crs-ldp101", "2026-12-08", "HQ Training Room A", "Abuja", 20, 7, "SCHEDULED"],
  ["crs-ind101", "2027-01-12", "HQ Auditorium", "Abuja", 30, 6, "SCHEDULED"],
  ["crs-saf210", "2027-01-18", "Maintenance hangar, Lagos", "Lagos", 6, 4, "SCHEDULED"],
  ["crs-dig120", "2027-02-01", "ICT Lab", "Abuja", 12, 5, "SCHEDULED"],
  ["crs-saf101", "2027-02-15", "HQ Training Room A", "Abuja", 20, 3, "SCHEDULED"],
  ["crs-ind110", "2027-02-22", "Lagos Regional Office", "Lagos", 20, 0, "SCHEDULED"],
  ["crs-cmp101", "2027-03-08", "HQ Auditorium", "Abuja", 40, 0, "SCHEDULED"],
  ["crs-fin120", "2027-03-15", "HQ Training Room B", "Abuja", 15, 0, "SCHEDULED"],
];

const SOURCES = ["HR_NOMINATION", "HR_NOMINATION", "HR_NOMINATION", "REQUEST", "TNA"];

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

export const sessionDays = (start, end) => {
  const days = [];
  for (let d = dayjs(start); !d.isAfter(dayjs(end), "day"); d = d.add(1, "day")) {
    days.push(d.format("YYYY-MM-DD"));
  }
  return days;
};

/** COMPLETED ≥ 75% attended, INCOMPLETE if some, NO_SHOW if none. */
export const outcomeFromAttendance = (attendance, days) => {
  const present = days.filter((d) => ["PRESENT", "LATE"].includes(attendance[d])).length;
  if (!present) return "NO_SHOW";
  return present / days.length >= 0.75 ? "COMPLETED" : "INCOMPLETE";
};

export function buildSessionsSeed() {
  const rand = mulberry32(42027);
  const { courses } = buildCatalogueSeed();
  const { trainers } = buildProvidersSeed();
  const { staff } = buildSkillsSeed();
  const today = dayjs("2026-11-09");

  let participantNo = 1;
  const sessions = PLAN.map(([courseId, start, venue, city, capacity, target, status, extra = {}], index) => {
    const course = courses.find((c) => c.COURSE_ID === courseId);
    const end = dayjs(start).add(course.DURATION_DAYS - 1, "day").format("YYYY-MM-DD");
    const days = sessionDays(start, end);
    const pool = trainers.filter((t) => t.PROVIDER_ID === course.DEFAULT_PROVIDER_ID && t.STATUS === "ACTIVE");

    const eligible = staff
      .filter((s) => !course.TARGET_GRADES.length || course.TARGET_GRADES.includes(s.GRADE))
      .sort(() => rand() - 0.5);
    const isPast = status === "COMPLETED";
    const participants = eligible.slice(0, target).map((member, i) => {
      const overCapacity = i >= capacity;
      const attendance = {};
      if (isPast || (status === "SCHEDULED" && dayjs(start).isBefore(today.add(1, "day")))) {
        days
          .filter((d) => !dayjs(d).isAfter(today, "day"))
          .forEach((d) => {
            const r = rand();
            attendance[d] = r < 0.86 ? "PRESENT" : r < 0.93 ? "LATE" : "ABSENT";
          });
      }
      const withdrawn = !overCapacity && !isPast && rand() < 0.06;
      const participant = {
        PARTICIPANT_ID: `par-${participantNo}`,
        STAFF_ID: member.STAFF_ID,
        STATUS: overCapacity ? "WAITLISTED" : withdrawn ? "WITHDRAWN" : isPast || rand() < 0.7 ? "CONFIRMED" : "NOMINATED",
        SOURCE: SOURCES[Math.floor(rand() * SOURCES.length)],
        ATTENDANCE: attendance,
        OUTCOME: isPast ? outcomeFromAttendance(attendance, days) : null,
        STATUS_NOTE: withdrawn ? "On approved annual leave during the training." : "",
        ADDED_AT: dayjs(start).subtract(30 + (i % 10), "day").format("YYYY-MM-DD"),
      };
      participantNo += 1;
      return participant;
    });

    const createdAt = dayjs(start).subtract(60, "day").format("YYYY-MM-DD");
    const history = [{ TYPE: "CREATED", AT: createdAt, BY: "HR Training Desk", NOTE: "" }];
    if (index === 11) {
      history.push({ TYPE: "RESCHEDULED", AT: "2026-10-02", BY: "HR Training Desk", NOTE: "Moved from 23 Nov at the provider's request." });
    }
    if (status === "CANCELLED") history.push({ TYPE: "CANCELLED", AT: dayjs(start).subtract(5, "day").format("YYYY-MM-DD"), BY: "HR Training Desk", NOTE: extra.CANCEL_REASON });
    if (isPast) history.push({ TYPE: "COMPLETED", AT: dayjs(end).add(2, "day").format("YYYY-MM-DD"), BY: "HR Training Desk", NOTE: "" });

    return {
      SESSION_ID: `ses-${index + 1}`,
      COURSE_ID: courseId,
      PROVIDER_ID: course.DEFAULT_PROVIDER_ID,
      TRAINER_IDS: pool.slice(0, 1).map((t) => t.TRAINER_ID),
      START_DATE: start,
      END_DATE: end,
      START_TIME: "09:00",
      END_TIME: "16:00",
      DELIVERY_METHOD: course.DELIVERY_METHOD,
      LOCATION: course.LOCATION,
      VENUE: venue,
      CITY: city,
      MEETING_LINK: "",
      CAPACITY_MIN: Math.min(5, capacity),
      CAPACITY_MAX: capacity,
      COST_PER_PARTICIPANT: course.DEFAULT_COST,
      STATUS: status,
      CANCEL_REASON: "",
      NOTES: "",
      HISTORY: history,
      PARTICIPANTS: participants,
      ...extra,
    };
  });

  // Requesters whose approved requests were scheduled hold a seat in that session.
  buildRequestsSeed()
    .requests.filter((r) => r.STATUS === "SCHEDULED" && r.SESSION_ID)
    .forEach((request) => {
      const session = sessions.find((s) => s.SESSION_ID === request.SESSION_ID);
      if (!session || session.PARTICIPANTS.some((p) => p.STAFF_ID === request.STAFF_ID)) return;
      const days = sessionDays(session.START_DATE, session.END_DATE);
      const attendance =
        session.STATUS === "COMPLETED" ? Object.fromEntries(days.map((d) => [d, "PRESENT"])) : {};
      session.PARTICIPANTS.push({
        PARTICIPANT_ID: `par-${participantNo}`,
        STAFF_ID: request.STAFF_ID,
        STATUS: "CONFIRMED",
        SOURCE: "REQUEST",
        REFERENCE_ID: request.REQUEST_ID,
        ATTENDANCE: attendance,
        OUTCOME: session.STATUS === "COMPLETED" ? "COMPLETED" : null,
        STATUS_NOTE: `From request ${request.REFERENCE_NO}.`,
        ADDED_AT: request.SUBMITTED_AT,
      });
      participantNo += 1;
    });

  return { sessions, nextParticipantNo: participantNo };
}
