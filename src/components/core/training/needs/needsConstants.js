export const ROUND_STATUS = {
  DRAFT: { label: "Draft", color: "#475569", bg: "#f1f5f9" },
  OPEN: { label: "Open", color: "#15803d", bg: "#ECFDF3" },
  CLOSED: { label: "Closed", color: "#475569", bg: "#f1f5f9" },
};

export const SUBMISSION_STATUS = {
  NOT_STARTED: { label: "Not started", color: "#be123c", bg: "#FEF3F2" },
  DRAFT: { label: "In progress", color: "#b45309", bg: "#FFFAEB" },
  SUBMITTED: { label: "Awaiting review", color: "#175CD3", bg: "#EFF8FF" },
  RETURNED: { label: "Returned", color: "#b45309", bg: "#FFFAEB" },
  REVIEWED: { label: "Reviewed", color: "#15803d", bg: "#ECFDF3" },
};

export const NEED_STATUS = {
  PROPOSED: { label: "Proposed", color: "#175CD3", bg: "#EFF8FF" },
  APPROVED: { label: "Approved", color: "#15803d", bg: "#ECFDF3" },
  DEFERRED: { label: "Deferred", color: "#b45309", bg: "#FFFAEB" },
  REJECTED: { label: "Rejected", color: "#be123c", bg: "#FEF3F2" },
};

export const PRIORITIES = [
  { value: "HIGH", label: "High", color: "#be123c", bg: "#FEF3F2" },
  { value: "MEDIUM", label: "Medium", color: "#b45309", bg: "#FFFAEB" },
  { value: "LOW", label: "Low", color: "#475569", bg: "#f1f5f9" },
];

export const NEED_SOURCES = [
  { value: "DEPARTMENT", label: "Department request" },
  { value: "SKILL_GAP", label: "Skills gap" },
  { value: "APPRAISAL", label: "Appraisal (APER)" },
  { value: "COMPLIANCE", label: "Regulatory / compliance" },
  { value: "STRATEGIC", label: "Strategic objective" },
];

export const getNeedSourceLabel = (v) => NEED_SOURCES.find((s) => s.value === v)?.label ?? v;
export const getPriority = (v) => PRIORITIES.find((p) => p.value === v) ?? PRIORITIES[1];

/** Submissions HR can still chase. */
export const REMINDABLE = ["NOT_STARTED", "DRAFT", "RETURNED"];

export const DEFAULT_NEED_FILTERS = {
  search: "",
  department: undefined,
  priority: undefined,
  status: undefined,
  source: undefined,
};
