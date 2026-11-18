import PropTypes from "prop-types";
import { BadgeCheck, Library, TrendingUp, Users } from "lucide-react";
import { useGetSkillsOverview } from "../../../../API/trainingSkills";
import { StatTile, StatTileSkeleton } from "../shared/StatTile";

export default function SkillsOverviewStrip({ onShowPending, onShowSkill }) {
  const { data, isPending } = useGetSkillsOverview();

  if (isPending) return <StatTileSkeleton />;

  const verified = data?.TOTAL_RECORDS
    ? Math.round((data.VERIFIED_RECORDS / data.TOTAL_RECORDS) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        icon={Library}
        label="Skills in library"
        value={data?.ACTIVE_SKILLS ?? 0}
        sub="Active skills"
      />
      <StatTile
        icon={Users}
        label="Staff with skills"
        value={data?.STAFF_WITH_SKILLS ?? 0}
        sub="Staff members"
      />
      <StatTile
        icon={BadgeCheck}
        label="Verified records"
        value={`${verified}%`}
        sub={`${data?.PENDING_RECORDS ?? 0} awaiting verification`}
        onClick={data?.PENDING_RECORDS ? onShowPending : undefined}
        actionLabel={data?.PENDING_RECORDS ? "Review" : undefined}
      />
      <StatTile
        icon={TrendingUp}
        label="Most common skill"
        value={data?.TOP_SKILL?.SKILL_NAME ?? "—"}
        sub={data?.TOP_SKILL ? `Held by ${data.TOP_SKILL.STAFF_COUNT} staff` : "No records yet"}
        onClick={data?.TOP_SKILL ? () => onShowSkill(data.TOP_SKILL.SKILL_ID) : undefined}
        actionLabel={data?.TOP_SKILL ? "View staff" : undefined}
      />
    </div>
  );
}

SkillsOverviewStrip.propTypes = {
  onShowPending: PropTypes.func.isRequired,
  onShowSkill: PropTypes.func.isRequired,
};
