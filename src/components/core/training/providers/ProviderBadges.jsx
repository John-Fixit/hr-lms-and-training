import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Star } from "lucide-react";
import { expiryStatus } from "../../../../API/trainingProviders";
import {
  EXPIRY_META,
  getProviderType,
  getTrainerType,
  providerInitials,
} from "./providersConstants";

export function RatingValue({ value, count, size = "md" }) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-[#94a3b8]">No ratings yet</span>;
  }
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap"
      aria-label={`Rated ${value} out of 5${count ? ` from ${count} sessions` : ""}`}
    >
      <Star size={size === "sm" ? 13 : 15} className="fill-[#FDB022] text-[#FDB022]" />
      <span className={`font-semibold tabular-nums text-[#0f172a] ${size === "sm" ? "text-xs" : "text-sm"}`}>
        {Number(value).toFixed(1)}
      </span>
      {count ? <span className="text-xs text-[#94a3b8]">({count})</span> : null}
    </span>
  );
}

RatingValue.propTypes = {
  value: PropTypes.number,
  count: PropTypes.number,
  size: PropTypes.oneOf(["sm", "md"]),
};

function SoftBadge({ label, color, bg }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
      style={{ color, backgroundColor: bg ?? `${color}14` }}
    >
      {label}
    </span>
  );
}

SoftBadge.propTypes = {
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  bg: PropTypes.string,
};

export function ProviderTypeBadge({ type }) {
  const meta = getProviderType(type);
  return <SoftBadge label={meta.label} color={meta.color} />;
}

ProviderTypeBadge.propTypes = { type: PropTypes.string };

export function TrainerTypeBadge({ type }) {
  const meta = getTrainerType(type);
  return <SoftBadge label={type === "INTERNAL" ? "Internal" : "External"} color={meta.color} />;
}

TrainerTypeBadge.propTypes = { type: PropTypes.string };

export function ActiveBadge({ status }) {
  return status === "ACTIVE" ? null : <SoftBadge label="Inactive" color="#475569" bg="#f1f5f9" />;
}

ActiveBadge.propTypes = { status: PropTypes.string };

/** Expiry status for a date, with the date itself. */
export function ExpiryBadge({ date, showDate = true }) {
  const status = expiryStatus(date);
  if (!status) return <span className="text-xs text-[#94a3b8]">No expiry</span>;
  const meta = EXPIRY_META[status];
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <SoftBadge label={meta.label} color={meta.color} bg={meta.bg} />
      {showDate && <span className="text-xs text-[#64748b]">{dayjs(date).format("D MMM YYYY")}</span>}
    </span>
  );
}

ExpiryBadge.propTypes = {
  date: PropTypes.string,
  showDate: PropTypes.bool,
};

export function DocumentAlertBadge({ alert }) {
  if (!alert) return null;
  const meta = EXPIRY_META[alert];
  return (
    <SoftBadge
      label={alert === "EXPIRED" ? "Document expired" : "Document expiring"}
      color={meta.color}
      bg={meta.bg}
    />
  );
}

DocumentAlertBadge.propTypes = { alert: PropTypes.string };

export function ProviderLogo({ name, type, size = 40 }) {
  const { color } = getProviderType(type);
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-lg font-bold"
      style={{ width: size, height: size, fontSize: size * 0.34, color, backgroundColor: `${color}14` }}
    >
      {providerInitials(name) || "?"}
    </span>
  );
}

ProviderLogo.propTypes = {
  name: PropTypes.string,
  type: PropTypes.string,
  size: PropTypes.number,
};
