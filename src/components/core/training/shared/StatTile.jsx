import PropTypes from "prop-types";
import clsx from "clsx";

/** Compact SaaS metric card. Becomes a button when `onClick` is passed. */
export function StatTile({ icon: Icon, label, value, sub, onClick, actionLabel, selected = false }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>
        {Icon && (
          <span
            className={clsx(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              selected
                ? "bg-[#6366F1] text-white"
                : "bg-slate-50 text-slate-400",
            )}
          >
            <Icon size={15} strokeWidth={2} />
          </span>
        )}
      </div>
      <p className="mt-4 text-[1.85rem] font-semibold leading-none tracking-[-0.04em] text-slate-900">
        <span className="tabular-nums">{value}</span>
      </p>
      {(sub || actionLabel) && (
        <p className="mt-2 truncate text-[12px] leading-5 text-slate-500">
          {sub}
          {actionLabel && (
            <span className="ml-1 font-medium text-[#4F46E5] group-hover:underline">
              {actionLabel}
            </span>
          )}
        </p>
      )}
    </>
  );

  const className = clsx(
    "group relative min-w-0 overflow-hidden rounded-2xl border bg-white p-5 text-left transition-all",
    "shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
    selected
      ? "border-indigo-200 ring-1 ring-indigo-100"
      : "border-slate-200/90 hover:border-slate-300 hover:shadow-[0_10px_30px_-20px_rgba(15,23,42,0.28)]",
  );

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx(
        className,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/30",
      )}
    >
      {selected && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-0.5 bg-[#6366F1]"
        />
      )}
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}

StatTile.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  sub: PropTypes.node,
  onClick: PropTypes.func,
  actionLabel: PropTypes.string,
  selected: PropTypes.bool,
};

export function StatTileSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, key) => (
        <div
          key={key}
          className="h-[116px] animate-pulse rounded-2xl border border-slate-200/90 bg-white"
        />
      ))}
    </div>
  );
}

StatTileSkeleton.propTypes = {
  count: PropTypes.number,
};
