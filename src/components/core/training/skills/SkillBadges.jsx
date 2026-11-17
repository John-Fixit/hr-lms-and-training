import PropTypes from "prop-types";
import clsx from "clsx";
import {
  SKILLS_PRIMARY,
  VERIFICATION_STATUS,
  getCategoryColor,
  getLevelName,
} from "./skillsConstants";

/** Five-segment proficiency bar. */
export function ProficiencyMeter({ level, showLabel = false, size = "md" }) {
  const value = Number(level) || 0;
  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={`Level ${value} of 5, ${getLevelName(value)}`}
    >
      <div className="flex gap-[3px]">
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={clsx(
              "rounded-full transition-colors",
              size === "sm" ? "h-1.5 w-3" : "h-2 w-5",
            )}
            style={{ backgroundColor: step <= value ? SKILLS_PRIMARY : "#e2e8f0" }}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-[#475569] whitespace-nowrap">
          L{value} · {getLevelName(value)}
        </span>
      )}
    </div>
  );
}

ProficiencyMeter.propTypes = {
  level: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  showLabel: PropTypes.bool,
  size: PropTypes.oneOf(["sm", "md"]),
};

export function CategoryTag({ categoryId, name }) {
  const color = getCategoryColor(categoryId);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap"
      style={{ color, backgroundColor: `${color}14` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}

CategoryTag.propTypes = {
  categoryId: PropTypes.string,
  name: PropTypes.string,
};

export function VerificationBadge({ status }) {
  const meta = VERIFICATION_STATUS[status] ?? VERIFICATION_STATUS.PENDING;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      {meta.label}
    </span>
  );
}

VerificationBadge.propTypes = {
  status: PropTypes.string,
};

const AVATAR_COLORS = ["#6366F1", "#6d28d9", "#2563eb", "#be123c", "#15803d", "#b45309"];

export function StaffAvatar({ firstName, lastName, size = 36 }) {
  const initials = `${lastName?.[0] ?? ""}${firstName?.[0] ?? ""}`.toUpperCase();
  const seed = (initials.charCodeAt(0) || 0) + (initials.charCodeAt(1) || 0);
  const color = AVATAR_COLORS[seed % AVATAR_COLORS.length];
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        color,
        backgroundColor: `${color}1A`,
      }}
    >
      {initials || "?"}
    </span>
  );
}

StaffAvatar.propTypes = {
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  size: PropTypes.number,
};

/** Horizontal bar list used by the directory insight cards. */
export function BarList({ items, total, onSelect, activeLabel, emptyText }) {
  if (!items?.length) {
    return <p className="py-6 text-center text-sm text-[#94a3b8]">{emptyText}</p>;
  }
  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((item) => {
        const isActive = activeLabel && item.label === activeLabel;
        const content = (
          <>
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <span
                className={clsx(
                  "truncate",
                  isActive ? "font-semibold text-[#0f172a]" : "text-[#344054]",
                )}
              >
                {item.label}
              </span>
              <span className="shrink-0 tabular-nums text-[#64748b]">
                {item.count}
                {total ? (
                  <span className="ml-1 text-[#94a3b8]">
                    ({Math.round((item.count / total) * 100)}%)
                  </span>
                ) : null}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${(item.count / max) * 100}%`,
                  backgroundColor: isActive ? "#4F46E5" : SKILLS_PRIMARY,
                }}
              />
            </div>
          </>
        );
        return (
          <li key={item.key ?? item.label}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="block w-full rounded-md text-left outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#6366F1]/40"
              >
                {content}
              </button>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}

BarList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      count: PropTypes.number.isRequired,
    }),
  ),
  total: PropTypes.number,
  onSelect: PropTypes.func,
  activeLabel: PropTypes.string,
  emptyText: PropTypes.string,
};
