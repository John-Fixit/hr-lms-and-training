export const REQUEST_STATUS = {
  DRAFT: { label: "Draft", color: "#475569", bg: "#f1f5f9" },
  PENDING: { label: "Pending approval", color: "#175CD3", bg: "#EFF8FF" },
  RETURNED: { label: "Returned", color: "#b45309", bg: "#FFFAEB" },
  APPROVED: { label: "Approved — to schedule", color: "#15803d", bg: "#ECFDF3" },
  SCHEDULED: { label: "Scheduled", color: "#4F46E5", bg: "#EEF2FF" },
  REJECTED: { label: "Rejected", color: "#be123c", bg: "#FEF3F2" },
  CANCELLED: { label: "Cancelled", color: "#475569", bg: "#f1f5f9" },
};

export const STATUS_TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "RETURNED", label: "Returned" },
  { value: "APPROVED", label: "To schedule" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "closed", label: "Rejected / cancelled", statuses: ["REJECTED", "CANCELLED"] },
  { value: "DRAFT", label: "Drafts" },
  { value: "all", label: "All" },
];

export const STEP_STATUS = {
  WAITING: { label: "Waiting", color: "#94a3b8" },
  PENDING: { label: "With approver", color: "#175CD3" },
  APPROVED: { label: "Approved", color: "#15803d" },
  RETURNED: { label: "Returned", color: "#b45309" },
  REJECTED: { label: "Rejected", color: "#be123c" },
  SKIPPED: { label: "Not needed", color: "#94a3b8" },
};

export const REQUEST_SOURCES = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "MANAGER", label: "Line manager" },
  { value: "HR", label: "HR" },
  { value: "TNA", label: "Training needs (TNA)" },
];

export const FUNDING_SOURCES = [
  { value: "TRAINING_BUDGET", label: "Training budget" },
  { value: "DEPARTMENT_BUDGET", label: "Departmental budget" },
  { value: "SPONSOR", label: "Sponsor / donor" },
  { value: "SELF", label: "Self-funded" },
];

const label = (list, value) => list.find((i) => i.value === value)?.label ?? value;
export const getSourceLabel = (v) => label(REQUEST_SOURCES, v);
export const getFundingLabel = (v) => label(FUNDING_SOURCES, v);

export const DEFAULT_REQUEST_FILTERS = {
  tab: "PENDING",
  search: "",
  department: undefined,
  request_type: undefined,
  location: undefined,
};
