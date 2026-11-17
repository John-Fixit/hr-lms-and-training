import PropTypes from "prop-types";
import clsx from "clsx";
import dayjs from "dayjs";
import { Check, CornerUpLeft, Hourglass, Minus, X } from "lucide-react";
import { approvalRoleLabel } from "../../../../API/trainingRequests";
import { REQUEST_STATUS, STEP_STATUS } from "./requestsConstants";

export function RequestStatusBadge({ status }) {
  const meta = REQUEST_STATUS[status] ?? REQUEST_STATUS.DRAFT;
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap" style={{ color: meta.color, backgroundColor: meta.bg }}>
      {meta.label}
    </span>
  );
}

RequestStatusBadge.propTypes = { status: PropTypes.string };

const STEP_ICONS = { APPROVED: Check, REJECTED: X, RETURNED: CornerUpLeft, PENDING: Hourglass, SKIPPED: Minus };

/** Compact dot progress used in tables. */
export function StepDots({ steps }) {
  return (
    <div className="flex items-center gap-1" aria-label={steps.map((s) => `${approvalRoleLabel(s.ROLE)}: ${STEP_STATUS[s.STATUS]?.label}`).join(", ")}>
      {steps.map((s, i) => (
        <span
          key={`${s.ROLE}-${i}`}
          title={`${approvalRoleLabel(s.ROLE)} — ${STEP_STATUS[s.STATUS]?.label}`}
          className={clsx("h-2 rounded-full transition-all", s.STATUS === "PENDING" ? "w-5" : "w-2")}
          style={{ backgroundColor: s.STATUS === "WAITING" ? "#e2e8f0" : STEP_STATUS[s.STATUS]?.color }}
        />
      ))}
    </div>
  );
}

StepDots.propTypes = { steps: PropTypes.array.isRequired };

/** Vertical approval chain with each step's approver, decision and comment. */
export function ApprovalTimeline({ steps }) {
  if (!steps.length) return <p className="text-sm text-[#94a3b8]">The approval route is set when the request is submitted.</p>;
  return (
    <ol className="relative space-y-4">
      {steps.map((step, i) => {
        const meta = STEP_STATUS[step.STATUS];
        const Icon = STEP_ICONS[step.STATUS];
        const last = i === steps.length - 1;
        return (
          <li key={`${step.ROLE}-${i}`} className="relative flex gap-3">
            {!last && <span aria-hidden="true" className="absolute left-[13px] top-7 h-[calc(100%-4px)] w-0.5 bg-[#e2e8f0]" />}
            <span
              className={clsx("relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-white", step.STATUS === "PENDING" && "ring-4 ring-[#175CD3]/10")}
              style={{
                backgroundColor: ["WAITING", "SKIPPED"].includes(step.STATUS) ? "#fff" : meta.color,
                borderColor: step.STATUS === "WAITING" ? "#e2e8f0" : meta.color,
              }}
            >
              {Icon ? <Icon size={13} strokeWidth={3} color={step.STATUS === "SKIPPED" ? meta.color : undefined} /> : <span className="text-[11px] font-bold text-[#94a3b8]">{i + 1}</span>}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center justify-between gap-x-3">
                <p className="text-sm font-semibold text-[#0f172a]">{approvalRoleLabel(step.ROLE)}</p>
                <span className="text-xs font-medium" style={{ color: meta.color }}>
                  {meta.label}
                  {step.ACTED_AT ? ` · ${dayjs(step.ACTED_AT).format("D MMM")}` : ""}
                </span>
              </div>
              <p className="text-xs text-[#64748b]">{step.APPROVER_NAME}</p>
              {step.COMMENT && <p className="mt-1 rounded-md bg-[#F9FAFB] px-2.5 py-1.5 text-[13px] text-[#344054]">“{step.COMMENT}”</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

ApprovalTimeline.propTypes = { steps: PropTypes.array.isRequired };
