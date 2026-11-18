/** Visual tokens for HR Training — matches sidebar `dashboard-purple`. */
export const TRAINING_PRIMARY = "#6366F1";
export const TRAINING_PRIMARY_HOVER = "#4F46E5";
export const TRAINING_INK = "#0f172a";
export const TRAINING_MUTED = "#64748b";

export const TRAINING_THEME = {
  token: {
    colorPrimary: TRAINING_PRIMARY,
    colorText: TRAINING_INK,
    colorBorder: "#E2E8F0",
    fontFamily: 'Inter, "Segoe UI", sans-serif',
    borderRadius: 8,
    controlHeight: 36,
  },
};

export const CARD_CLASS =
  "rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

/** ARIA props for the panel that belongs to a TrainingPageTabs tab. */
export const tabPanelProps = (idPrefix, tabId) => ({
  role: "tabpanel",
  id: `${idPrefix}-panel-${tabId}`,
  "aria-labelledby": `${idPrefix}-tab-${tabId}`,
});

const ACCENTS = ["#4F46E5", "#6366F1", "#7C3AED", "#4338CA", "#818CF8"];

/** Stable accent colour for any id (programmes, etc.). */
export const accentFor = (id = "") => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
};
