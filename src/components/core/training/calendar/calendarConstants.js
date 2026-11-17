import dayjs from "dayjs";

export const SESSION_PHASES = {
  UPCOMING: { label: "Upcoming", color: "#175CD3", bg: "#EFF8FF" },
  IN_PROGRESS: { label: "In progress", color: "#4F46E5", bg: "#E6FAFA" },
  AWAITING_CLOSE: { label: "Ended — close it", color: "#b45309", bg: "#FFFAEB" },
  COMPLETED: { label: "Completed", color: "#15803d", bg: "#ECFDF3" },
  CANCELLED: { label: "Cancelled", color: "#475569", bg: "#f1f5f9" },
};

export const PARTICIPANT_STATUS = {
  NOMINATED: { label: "Nominated", color: "#175CD3", bg: "#EFF8FF" },
  CONFIRMED: { label: "Confirmed", color: "#15803d", bg: "#ECFDF3" },
  WAITLISTED: { label: "Waitlisted", color: "#b45309", bg: "#FFFAEB" },
  WITHDRAWN: { label: "Withdrawn", color: "#475569", bg: "#f1f5f9" },
};

export const OUTCOMES = {
  COMPLETED: { label: "Completed", color: "#15803d", bg: "#ECFDF3" },
  INCOMPLETE: { label: "Incomplete", color: "#b45309", bg: "#FFFAEB" },
  NO_SHOW: { label: "No-show", color: "#be123c", bg: "#FEF3F2" },
};

export const PARTICIPANT_SOURCES = {
  HR_NOMINATION: "HR nomination",
  REQUEST: "Training request",
  TNA: "Training needs",
};

/** Cycle order when clicking an attendance cell. */
export const ATTENDANCE_CYCLE = [undefined, "PRESENT", "LATE", "ABSENT"];

export const ATTENDANCE = {
  PRESENT: { label: "Present", short: "P", color: "#15803d", bg: "#ECFDF3" },
  LATE: { label: "Late", short: "L", color: "#b45309", bg: "#FFFAEB" },
  ABSENT: { label: "Absent", short: "A", color: "#be123c", bg: "#FEF3F2" },
};

/** Attendance needed for a "Completed" outcome (mirrors the backend rule). */
export const COMPLETION_THRESHOLD = 75;

export const DEFAULT_SESSION_FILTERS = {
  search: "",
  programme_id: undefined,
  provider_id: undefined,
  phase: "active",
  clashes_only: false,
};

export const SEATED_STATUSES = ["NOMINATED", "CONFIRMED"];

/** "12–16 Jan 2027" style range. */
export function formatDateRange(start, end) {
  const a = dayjs(start);
  const b = dayjs(end);
  if (a.isSame(b, "day")) return a.format("D MMM YYYY");
  if (a.isSame(b, "month")) return `${a.format("D")}–${b.format("D MMM YYYY")}`;
  if (a.isSame(b, "year")) return `${a.format("D MMM")} – ${b.format("D MMM YYYY")}`;
  return `${a.format("D MMM YYYY")} – ${b.format("D MMM YYYY")}`;
}
