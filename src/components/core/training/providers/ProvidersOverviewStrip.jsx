import PropTypes from "prop-types";
import { Building2, FileWarning, Star, UserSquare2 } from "lucide-react";
import { useGetProvidersOverview } from "../../../../API/trainingProviders";
import { StatTile, StatTileSkeleton } from "../shared/StatTile";

export default function ProvidersOverviewStrip({ onShowAlerts, onShowTrainers }) {
  const { data, isPending } = useGetProvidersOverview();
  if (isPending) return <StatTileSkeleton />;

  const providerSub = [data.EXTERNAL_PROVIDERS != null && `${data.EXTERNAL_PROVIDERS} external`, data.INTERNAL_PROVIDERS != null && `${data.INTERNAL_PROVIDERS} internal`]
    .filter(Boolean)
    .join(" · ");
  const trainerSub = [data.INTERNAL_TRAINERS != null && `${data.INTERNAL_TRAINERS} staff`, data.EXTERNAL_TRAINERS != null && `${data.EXTERNAL_TRAINERS} external`]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        icon={Building2}
        label="Active providers"
        value={data.ACTIVE_PROVIDERS ?? 0}
        sub={providerSub || "On the directory"}
      />
      <StatTile
        icon={UserSquare2}
        label="Trainers"
        value={data.ACTIVE_TRAINERS ?? 0}
        sub={trainerSub || "On the directory"}
        onClick={onShowTrainers}
        actionLabel="View"
      />
      <StatTile
        icon={Star}
        label="Average rating"
        value={data.AVERAGE_RATING == null ? "—" : `${Number(data.AVERAGE_RATING).toFixed(1)} / 5`}
        sub={`From ${data.RATED_ENGAGEMENTS ?? 0} rated sessions`}
      />
      <StatTile
        icon={FileWarning}
        label="Document alerts"
        value={data.DOCUMENT_ALERTS ?? 0}
        sub={data.DOCUMENT_ALERTS ? "Expired or expiring in 60 days" : "All documents in date"}
        onClick={data.DOCUMENT_ALERTS ? onShowAlerts : undefined}
        actionLabel={data.DOCUMENT_ALERTS ? "Review" : undefined}
      />
    </div>
  );
}

ProvidersOverviewStrip.propTypes = {
  onShowAlerts: PropTypes.func.isRequired,
  onShowTrainers: PropTypes.func.isRequired,
};
