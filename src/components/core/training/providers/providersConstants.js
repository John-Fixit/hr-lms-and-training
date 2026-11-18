export const PROVIDER_TYPES = [
  { value: "INSTITUTION", label: "Training institution", color: "#2563eb" },
  { value: "CONSULTANT", label: "Consultant / firm", color: "#6d28d9" },
  { value: "INTERNAL", label: "Internal unit", color: "#4F46E5" },
];

export const getProviderType = (value) =>
  PROVIDER_TYPES.find((t) => t.value === value) ?? { label: value, color: "#64748b" };

export const TRAINER_TYPES = [
  { value: "INTERNAL", label: "Internal (staff)", color: "#4F46E5" },
  { value: "EXTERNAL", label: "External", color: "#6d28d9" },
];

export const getTrainerType = (value) =>
  TRAINER_TYPES.find((t) => t.value === value) ?? { label: value, color: "#64748b" };

export const DOCUMENT_TYPES = [
  { value: "CONTRACT", label: "Contract / agreement" },
  { value: "ACCREDITATION", label: "Accreditation" },
  { value: "TAX", label: "Tax clearance" },
  { value: "PROFILE", label: "Company profile" },
  { value: "OTHER", label: "Other" },
];

export const getDocumentTypeLabel = (value) =>
  DOCUMENT_TYPES.find((t) => t.value === value)?.label ?? value;

/** Trainer questions from the existing training feedback form (TrainingFeedbackReviewForm). */
export const RATING_CRITERIA = [
  { key: "PRESENTATION", label: "Presentation" },
  { key: "KNOWLEDGE", label: "Knowledge & command of subject" },
  { key: "TRAINING_AIDS", label: "Use of training aids" },
  { key: "INTERACTION", label: "Participation & group interaction" },
];

export const EXPIRY_META = {
  EXPIRED: { label: "Expired", color: "#be123c", bg: "#FEF3F2" },
  EXPIRING: { label: "Expiring soon", color: "#b45309", bg: "#FFFAEB" },
  VALID: { label: "Valid", color: "#15803d", bg: "#ECFDF3" },
};

export const DEFAULT_PROVIDER_FILTERS = {
  search: "",
  provider_type: undefined,
  location: undefined,
  status: "ACTIVE",
  alerts_only: false,
};

export const DEFAULT_TRAINER_FILTERS = {
  search: "",
  trainer_type: "all",
  provider_id: undefined,
  skill_id: undefined,
  status: "ACTIVE",
};

export const providerInitials = (name = "") =>
  name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word) && !["of", "and", "&"].includes(word.toLowerCase()))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

/** "Capt. Tunde Bakare" → { first: "Tunde", last: "Bakare" } for avatar initials. */
export const splitTrainerName = (fullName = "") => {
  const parts = fullName.replace(/^(Dr|Prof|Capt|Engr|Mr|Mrs|Ms)\.?\s+/i, "").split(/\s+/);
  return { first: parts[0] ?? "", last: parts[parts.length - 1] ?? "" };
};
