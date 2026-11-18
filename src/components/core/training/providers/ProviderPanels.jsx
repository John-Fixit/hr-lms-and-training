import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Table } from "antd";
import { formatNaira } from "../catalogue/catalogueConstants";
import { RATING_CRITERIA } from "./providersConstants";
import { RatingValue } from "./ProviderBadges";

/** Average score per trainer question from the training feedback form. */
export function RatingBreakdown({ breakdown }) {
  const hasData = breakdown && Object.values(breakdown).some((v) => v !== null);
  if (!hasData) {
    return (
      <p className="text-sm text-[#94a3b8]">
        No feedback yet. Ratings come from the training feedback form participants fill after each training.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {RATING_CRITERIA.map(({ key, label }) => {
        const value = breakdown[key];
        return (
          <li key={key}>
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <span className="text-[#344054]">{label}</span>
              <span className="tabular-nums font-semibold text-[#0f172a]">{value ? value.toFixed(1) : "—"}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]">
              <div
                className="h-full rounded-full bg-[#FDB022] transition-[width] duration-500"
                style={{ width: `${((value ?? 0) / 5) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

RatingBreakdown.propTypes = {
  breakdown: PropTypes.object,
};

/** Past sessions delivered by a provider or trainer. */
export function EngagementHistory({ engagements, showProvider = false, showTrainers = true }) {
  const columns = [
    {
      title: "Course",
      key: "course",
      render: (_, e) => (
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[#0f172a]">{e.COURSE_TITLE}</p>
          <p className="text-xs text-[#64748b]">
            {dayjs(e.START_DATE).format("D MMM YYYY")}
            {e.END_DATE !== e.START_DATE ? ` – ${dayjs(e.END_DATE).format("D MMM YYYY")}` : ""}
          </p>
        </div>
      ),
    },
    showProvider && {
      title: "Provider",
      key: "provider",
      render: (_, e) => <span className="text-[13px] text-[#344054]">{e.PROVIDER_NAME}</span>,
    },
    showTrainers && {
      title: "Trainers",
      key: "trainers",
      render: (_, e) => (
        <span className="text-[13px] text-[#344054]">{e.TRAINER_NAMES.join(", ") || "—"}</span>
      ),
    },
    {
      title: "Staff",
      key: "participants",
      align: "center",
      render: (_, e) => <span className="tabular-nums text-[13px] text-[#344054]">{e.PARTICIPANTS}</span>,
    },
    {
      title: "Cost",
      key: "cost",
      align: "right",
      render: (_, e) => <span className="tabular-nums text-[13px] text-[#344054]">{formatNaira(e.TOTAL_COST)}</span>,
    },
    {
      title: "Rating",
      key: "rating",
      align: "right",
      render: (_, e) => <RatingValue value={e.RATING_OVERALL} size="sm" />,
    },
  ].filter(Boolean);

  return (
    <Table
      size="small"
      rowKey="ENGAGEMENT_ID"
      columns={columns}
      dataSource={engagements}
      scroll={{ x: 640 }}
      pagination={{ pageSize: 5, hideOnSinglePage: true, size: "small" }}
      locale={{ emptyText: <p className="py-6 text-sm text-[#94a3b8]">No sessions delivered yet.</p> }}
    />
  );
}

EngagementHistory.propTypes = {
  engagements: PropTypes.array.isRequired,
  showProvider: PropTypes.bool,
  showTrainers: PropTypes.bool,
};

/** Small stat block row used at the top of detail drawers. */
export function StatRow({ stats }) {
  return (
    <div className="grid grid-cols-2 divide-[#e2e8f0] rounded-lg bg-[#F9FAFB] sm:grid-cols-4 sm:divide-x">
      {stats.map((stat) => (
        <div key={stat.label} className="px-3 py-2.5 text-center">
          <div className="flex min-h-[28px] items-center justify-center text-lg font-bold tabular-nums text-[#0f172a]">
            {stat.value}
          </div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#64748b]">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

StatRow.propTypes = {
  stats: PropTypes.arrayOf(
    PropTypes.shape({ label: PropTypes.string.isRequired, value: PropTypes.node }),
  ).isRequired,
};
