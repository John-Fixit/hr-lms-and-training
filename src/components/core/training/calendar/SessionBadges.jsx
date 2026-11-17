import PropTypes from "prop-types";
import clsx from "clsx";
import { OUTCOMES, PARTICIPANT_STATUS, SESSION_PHASES } from "./calendarConstants";

function Pill({ meta }) {
  if (!meta) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      {meta.label}
    </span>
  );
}

Pill.propTypes = { meta: PropTypes.object };

export const PhaseBadge = ({ phase }) => <Pill meta={SESSION_PHASES[phase]} />;
PhaseBadge.propTypes = { phase: PropTypes.string };

export const ParticipantStatusBadge = ({ status }) => <Pill meta={PARTICIPANT_STATUS[status]} />;
ParticipantStatusBadge.propTypes = { status: PropTypes.string };

export const OutcomeBadge = ({ outcome }) => <Pill meta={OUTCOMES[outcome]} />;
OutcomeBadge.propTypes = { outcome: PropTypes.string };

/** Seats taken vs capacity, with a minimum marker. */
export function CapacityBar({ enrolled, max, min = 0, waitlisted = 0, compact = false }) {
  const pct = max ? Math.min(100, (enrolled / max) * 100) : 0;
  const full = enrolled >= max;
  const belowMin = enrolled < min;
  return (
    <div className={compact ? "w-28" : "w-full"}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="tabular-nums font-semibold text-[#0f172a]">
          {enrolled}/{max}
          <span className="ml-1 font-normal text-[#64748b]">seats</span>
        </span>
        {!compact && (
          <span className={clsx("text-[11px]", full ? "text-[#b45309]" : belowMin ? "text-[#be123c]" : "text-[#64748b]")}>
            {full ? `Full${waitlisted ? ` · ${waitlisted} waiting` : ""}` : belowMin ? `Needs ${min - enrolled} more to run` : `${max - enrolled} left`}
          </span>
        )}
      </div>
      <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, backgroundColor: full ? "#b45309" : belowMin ? "#F97066" : "#6366F1" }}
        />
        {min > 0 && min < max && (
          <span aria-hidden="true" className="absolute top-0 h-full w-px bg-[#475569]/40" style={{ left: `${(min / max) * 100}%` }} />
        )}
      </div>
    </div>
  );
}

CapacityBar.propTypes = {
  enrolled: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  min: PropTypes.number,
  waitlisted: PropTypes.number,
  compact: PropTypes.bool,
};
