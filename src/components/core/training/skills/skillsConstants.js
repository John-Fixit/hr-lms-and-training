export {
  TRAINING_PRIMARY as SKILLS_PRIMARY,
  TRAINING_THEME as SKILLS_THEME,
} from "../shared/trainingTheme";

export const PROFICIENCY_LEVELS = [
  { level: 1, name: "Beginner", description: "Basic awareness. Needs close supervision." },
  { level: 2, name: "Basic", description: "Handles simple tasks with guidance." },
  { level: 3, name: "Intermediate", description: "Works independently on routine tasks." },
  { level: 4, name: "Advanced", description: "Handles complex work and guides others." },
  { level: 5, name: "Expert", description: "Sets standards and mentors others." },
];

export const getLevelName = (level) =>
  PROFICIENCY_LEVELS.find((item) => item.level === Number(level))?.name ?? "—";

/** Heatmap colours for the Skills Matrix (level 1–5). Matches the slide legend. */
export const MATRIX_LEVELS = [
  { level: 1, name: "Training Required", caption: "Training Required", color: "#F4285C" },
  { level: 2, name: "Currently Trained", caption: "Currently Trained", color: "#2DC36A" },
  { level: 3, name: "Basic Complete", caption: "Basic Complete", color: "#F5A31A" },
  { level: 4, name: "Skilled Enough", caption: "Skilled Enough", color: "#6B2D91" },
  { level: 5, name: "Can Coach", caption: "Can Coach", color: "#E63E9D" },
];

export const getMatrixLevel = (level) =>
  MATRIX_LEVELS.find((item) => item.level === Number(level)) ?? null;

export const SKILL_SOURCES = [
  { value: "SELF", label: "Self-declared" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "HR", label: "HR" },
];

export const getSourceLabel = (source) =>
  SKILL_SOURCES.find((item) => item.value === source)?.label ?? source ?? "—";

export const VERIFICATION_STATUS = {
  VERIFIED: { label: "Verified", color: "#15803d", bg: "#ECFDF3" },
  PENDING: { label: "Pending", color: "#b45309", bg: "#FFFAEB" },
  REJECTED: { label: "Rejected", color: "#be123c", bg: "#FEF3F2" },
};

export const VERIFICATION_FILTERS = [
  { value: "any", label: "Any status" },
  { value: "verified", label: "Verified only" },
  { value: "pending", label: "Awaiting verification" },
];

const CATEGORY_COLORS = {
  "cat-technical": "#2563eb",
  "cat-leadership": "#6d28d9",
  "cat-communication": "#be123c",
  "cat-digital": "#0369a1",
  "cat-financial": "#15803d",
  "cat-compliance": "#b45309",
  "cat-behavioural": "#c2410c",
};

export const getCategoryColor = (categoryId) =>
  CATEGORY_COLORS[categoryId] ?? "#64748b";

export const DEFAULT_DIRECTORY_FILTERS = {
  skill_ids: [],
  min_level: 1,
  match: "any",
  verification: "any",
  search: "",
  directorate: undefined,
  department: undefined,
  unit: undefined,
  designation: undefined,
  grade: undefined,
  region: undefined,
};

export const staffFullName = (staff) =>
  `${staff?.LAST_NAME ?? ""} ${staff?.FIRST_NAME ?? ""}`.trim();

/** Skill <Select> options grouped by category. */
export const buildGroupedSkillOptions = (skills = [], { disabledIds = [] } = {}) => {
  const groups = new Map();
  skills
    .filter((skill) => skill.IS_ACTIVE)
    .forEach((skill) => {
      const key = skill.CATEGORY_NAME;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({
        value: skill.SKILL_ID,
        label: skill.SKILL_NAME,
        disabled: disabledIds.includes(skill.SKILL_ID),
      });
    });
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, options]) => ({ label, title: label, options }));
};
