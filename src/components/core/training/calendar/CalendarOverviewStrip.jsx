import PropTypes from "prop-types";
import { AlertTriangle, Armchair, CalendarClock, GraduationCap } from "lucide-react";
import { useGetSessionsOverview } from "../../../../API/trainingSessions";
import { StatTile, StatTileSkeleton } from "../shared/StatTile";

export default function CalendarOverviewStrip({ onShowClashes }) {
  const { data, isPending } = useGetSessionsOverview();
  if (isPending) return <StatTileSkeleton />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        icon={CalendarClock}
        label="Next 30 days"
        value={data.NEXT_30_DAYS ?? data.SCHEDULED ?? 0}
        sub={
          data.IN_PROGRESS != null
            ? `${data.IN_PROGRESS} running now · ${data.SESSIONS_THIS_YEAR ?? data.SCHEDULED ?? 0} this year`
            : data.YEAR ? `In ${data.YEAR}` : "On the calendar"
        }
      />
      <StatTile
        icon={Armchair}
        label="Seats filled"
        value={data.SEAT_FILL_RATE == null ? "—" : `${data.SEAT_FILL_RATE}%`}
        sub={data.UPCOMING_SEATS != null ? `Of ${data.UPCOMING_SEATS} upcoming seats` : `${data.PARTICIPANTS ?? 0} participants`}
      />
      <StatTile
        icon={AlertTriangle}
        label="Sessions with clashes"
        value={data.SESSIONS_WITH_CLASHES ?? 0}
        sub={data.SESSIONS_WITH_CLASHES ? "Trainer, venue or participant" : "No clashes"}
        onClick={data.SESSIONS_WITH_CLASHES ? onShowClashes : undefined}
        actionLabel={data.SESSIONS_WITH_CLASHES ? "Review" : undefined}
      />
      <StatTile
        icon={GraduationCap}
        label="Completion rate"
        value={data.COMPLETION_RATE == null ? `${data.COMPLETED ?? 0}` : `${data.COMPLETION_RATE}%`}
        sub={data.AWAITING_CLOSE ? `${data.AWAITING_CLOSE} ended, not closed` : "Of participants in closed sessions"}
      />
    </div>
  );
}

CalendarOverviewStrip.propTypes = {
  onShowClashes: PropTypes.func.isRequired,
};
