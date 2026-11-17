import PropTypes from "prop-types";
import { COURSE_STATUS, getDeliveryMethod } from "./catalogueConstants";

export function CourseStatusBadge({ status }) {
  const meta = COURSE_STATUS[status] ?? COURSE_STATUS.DRAFT;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      {meta.label}
    </span>
  );
}

CourseStatusBadge.propTypes = {
  status: PropTypes.string,
};

export function DeliveryChip({ method }) {
  const meta = getDeliveryMethod(method);
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-[#475569]">
      <Icon size={13} className="text-[#94a3b8]" />
      {meta.label}
    </span>
  );
}

DeliveryChip.propTypes = {
  method: PropTypes.string,
};

export function MandatoryBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-[#FECDCA] bg-[#FEF3F2] px-2 py-0.5 text-[11px] font-medium text-[#be123c] whitespace-nowrap">
      Mandatory
    </span>
  );
}
