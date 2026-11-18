import PropTypes from "prop-types";
import { BookOpenCheck, FileText, FolderKanban, Sparkles } from "lucide-react";
import { useGetCatalogueOverview } from "../../../../API/trainingCatalogue";
import { StatTile, StatTileSkeleton } from "../shared/StatTile";

export default function CatalogueOverviewStrip({ onShowDrafts, onShowProgrammes }) {
  const { data, isPending } = useGetCatalogueOverview();

  if (isPending) return <StatTileSkeleton />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        icon={FolderKanban}
        label="Programmes"
        value={data.TOTAL_PROGRAMMES}
        sub="Across the catalogue"
        onClick={onShowProgrammes}
        actionLabel="View"
      />
      <StatTile
        icon={BookOpenCheck}
        label="Active courses"
        value={data.ACTIVE_COURSES}
        sub={`${data.MANDATORY_COURSES} mandatory`}
      />
      <StatTile
        icon={FileText}
        label="Draft courses"
        value={data.DRAFT_COURSES}
        sub="Not yet available for scheduling"
        onClick={data.DRAFT_COURSES ? onShowDrafts : undefined}
        actionLabel={data.DRAFT_COURSES ? "View drafts" : undefined}
      />
      <StatTile
        icon={Sparkles}
        label="Skills covered"
        value={data.SKILLS_COVERED ?? data.ARCHIVED_COURSES ?? 0}
        sub={data.COURSES_WITHOUT_SKILLS ? `${data.COURSES_WITHOUT_SKILLS} courses without skills` : "Linked from the skills library"}
      />
    </div>
  );
}

CatalogueOverviewStrip.propTypes = {
  onShowDrafts: PropTypes.func.isRequired,
  onShowProgrammes: PropTypes.func.isRequired,
};
