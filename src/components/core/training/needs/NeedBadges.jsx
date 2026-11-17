import PropTypes from "prop-types";
import { NEED_STATUS, ROUND_STATUS, SUBMISSION_STATUS, getPriority } from "./needsConstants";

function Pill({ meta }) {
  if (!meta) return null;
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap" style={{ color: meta.color, backgroundColor: meta.bg }}>
      {meta.label}
    </span>
  );
}

Pill.propTypes = { meta: PropTypes.object };

export const RoundStatusBadge = ({ status }) => <Pill meta={ROUND_STATUS[status]} />;
RoundStatusBadge.propTypes = { status: PropTypes.string };

export const SubmissionStatusBadge = ({ status }) => <Pill meta={SUBMISSION_STATUS[status]} />;
SubmissionStatusBadge.propTypes = { status: PropTypes.string };

export const NeedStatusBadge = ({ status }) => <Pill meta={NEED_STATUS[status]} />;
NeedStatusBadge.propTypes = { status: PropTypes.string };

export const PriorityBadge = ({ priority }) => {
  const meta = getPriority(priority);
  return <Pill meta={{ ...meta, label: `${meta.label} priority` }} />;
};
PriorityBadge.propTypes = { priority: PropTypes.string };
