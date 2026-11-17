import { Laptop, Layers, MonitorPlay, School, Wrench } from "lucide-react";

/** Same values as the existing create-training form, so a catalogue course maps onto `training_type`. */
export const TRAINING_TYPES = [
  { value: "SEMINAR", label: "Seminar" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "CONFERENCE", label: "Conference" },
  { value: "FELLOWSHIP", label: "Fellowship" },
  { value: "TRAINING", label: "Training" },
];

export const DELIVERY_METHODS = [
  { value: "CLASSROOM", label: "Classroom", icon: School },
  { value: "VIRTUAL", label: "Virtual (live)", icon: MonitorPlay },
  { value: "BLENDED", label: "Blended", icon: Layers },
  { value: "SELF_PACED", label: "Self-paced e-learning", icon: Laptop },
  { value: "ON_THE_JOB", label: "On-the-job", icon: Wrench },
];

/** Same values as the create-training form's location field. */
export const LOCATIONS = [
  { value: "LOCAL", label: "Local" },
  { value: "FOREIGN", label: "Foreign" },
];

export const COURSE_STATUS = {
  DRAFT: { label: "Draft", color: "#475569", bg: "#f1f5f9" },
  ACTIVE: { label: "Active", color: "#15803d", bg: "#ECFDF3" },
  ARCHIVED: { label: "Archived", color: "#93370D", bg: "#FFFAEB" },
};

export const COURSE_STATUS_FILTERS = [
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "all", label: "All" },
];

export const GRADE_OPTIONS = Array.from({ length: 17 }, (_, i) => ({
  value: String(i + 1),
  label: `Grade ${i + 1}`,
}));

export const DEFAULT_COURSE_FILTERS = {
  search: "",
  programme_id: undefined,
  training_type: undefined,
  delivery_method: undefined,
  skill_id: undefined,
  status: "ACTIVE",
  mandatory_only: false,
  without_skills: false,
};

const findLabel = (list, value) => list.find((item) => item.value === value)?.label ?? value ?? "—";
export const getTrainingTypeLabel = (value) => findLabel(TRAINING_TYPES, value);
export const getDeliveryMethod = (value) => DELIVERY_METHODS.find((item) => item.value === value);
export const getLocationLabel = (value) => findLabel(LOCATIONS, value);

export const formatNaira = (amount) =>
  Number(amount) > 0 ? `₦${Number(amount).toLocaleString("en-NG")}` : "No fee";

export const formatDuration = (days) => `${days} day${Number(days) === 1 ? "" : "s"}`;

/** Compact grade range label, e.g. ["13","14","15"] → "Grades 13–15". */
export const formatGrades = (grades = []) => {
  if (!grades.length) return "All grades";
  const sorted = grades.map(Number).sort((a, b) => a - b);
  const contiguous = sorted.every((g, i) => i === 0 || g === sorted[i - 1] + 1);
  if (sorted.length === 1) return `Grade ${sorted[0]}`;
  return contiguous
    ? `Grades ${sorted[0]}–${sorted[sorted.length - 1]}`
    : `Grades ${sorted.join(", ")}`;
};
