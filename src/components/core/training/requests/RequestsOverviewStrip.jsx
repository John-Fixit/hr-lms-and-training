import PropTypes from "prop-types";
import { CalendarPlus, CornerUpLeft, Hourglass, Timer } from "lucide-react";
import { useGetRequestsOverview } from "../../../../API/trainingRequests";
import { StatTile, StatTileSkeleton } from "../shared/StatTile";

export default function RequestsOverviewStrip({ onShowTab }) {
  const { data, isPending } = useGetRequestsOverview();
  if (isPending) return <StatTileSkeleton />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        icon={Hourglass}
        label="Pending approval"
        value={data.PENDING ?? 0}
        sub={data.OVERDUE ? `${data.OVERDUE} waiting over 5 days` : "Awaiting an approver"}
        onClick={data.PENDING ? () => onShowTab("PENDING") : undefined}
        actionLabel={data.PENDING ? "Review" : undefined}
      />
      <StatTile
        icon={CalendarPlus}
        label="Approved, to schedule"
        value={data.AWAITING_SCHEDULING ?? 0}
        sub={data.SCHEDULED != null ? `${data.SCHEDULED} already scheduled` : "Fully approved"}
        onClick={data.AWAITING_SCHEDULING ? () => onShowTab("APPROVED") : undefined}
        actionLabel={data.AWAITING_SCHEDULING ? "Schedule" : undefined}
      />
      <StatTile
        icon={CornerUpLeft}
        label="Returned"
        value={data.RETURNED ?? 0}
        sub="Waiting on the requester"
        onClick={data.RETURNED ? () => onShowTab("RETURNED") : undefined}
        actionLabel={data.RETURNED ? "View" : undefined}
      />
      <StatTile
        icon={Timer}
        label="Average decision time"
        value={data.AVERAGE_DAYS_TO_DECIDE == null ? "—" : `${data.AVERAGE_DAYS_TO_DECIDE} days`}
        sub={data.APPROVAL_RATE == null ? "Decided requests" : `${data.APPROVAL_RATE}% approved`}
      />
    </div>
  );
}

RequestsOverviewStrip.propTypes = { onShowTab: PropTypes.func.isRequired };
