import PropTypes from "prop-types";
import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";

/** Underline tab bar. Pair panels with `tabPanelProps` (trainingTheme.js). */
export default function TrainingPageTabs({ tabs, active, onChange, idPrefix, label }) {
  const reduceMotion = useReducedMotion();
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex w-full gap-1 border-b border-slate-200"
    >
      {tabs.map((tab) => {
        const selected = active === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "relative flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium outline-none transition-colors sm:flex-none sm:px-4",
              "focus-visible:ring-2 focus-visible:ring-[#6366F1]/30",
              selected ? "text-[#4F46E5]" : "text-slate-500 hover:text-slate-900",
            )}
          >
            {Icon && <Icon size={15} strokeWidth={1.75} className="relative" />}
            <span className="relative">{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  "relative rounded-full px-1.5 text-[11px] tabular-nums",
                  selected ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-500",
                )}
              >
                {tab.count}
              </span>
            )}
            {selected && (
              <motion.span
                layoutId={reduceMotion ? undefined : `${idPrefix}-tab-line`}
                className="absolute inset-x-2 -bottom-px h-0.5 bg-[#6366F1]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

TrainingPageTabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      count: PropTypes.number,
    }),
  ).isRequired,
  active: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  idPrefix: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};
