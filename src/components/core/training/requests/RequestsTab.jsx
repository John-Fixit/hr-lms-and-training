import { useMemo } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Button, Input, Segmented, Select, Table } from "antd";
import { Inbox, Search } from "lucide-react";
import { useGetTrainingRequests, approvalRoleLabel } from "../../../../API/trainingRequests";
import { CARD_CLASS } from "../shared/trainingTheme";
import { StaffAvatar } from "../skills/SkillBadges";
import { LOCATIONS, formatNaira } from "../catalogue/catalogueConstants";
import { DEFAULT_REQUEST_FILTERS, STATUS_TABS, getSourceLabel } from "./requestsConstants";
import { RequestStatusBadge, StepDots } from "./RequestBadges";

const inTab = (r, tab) => {
  const def = STATUS_TABS.find((t) => t.value === tab);
  if (!def || tab === "all") return true;
  return def.statuses ? def.statuses.includes(r.STATUS) : r.STATUS === tab;
};

export default function RequestsTab({ filters, onFiltersChange, onOpenRequest }) {
  const { data: requests = [], isPending } = useGetTrainingRequests();
  const update = (patch) => onFiltersChange((prev) => ({ ...prev, ...patch }));

  const counts = useMemo(
    () => Object.fromEntries(STATUS_TABS.map((t) => [t.value, requests.filter((r) => inTab(r, t.value)).length])),
    [requests],
  );

  const departments = [...new Set(requests.map((r) => r.DEPARTMENT).filter(Boolean))].sort();

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return requests.filter(
      (r) =>
        inTab(r, filters.tab) &&
        (!filters.department || r.DEPARTMENT === filters.department) &&
        (!filters.request_type || r.REQUEST_TYPE === filters.request_type) &&
        (!filters.location || r.LOCATION === filters.location) &&
        (!term || [r.REFERENCE_NO, r.STAFF_NAME, r.STAFF_NUMBER, r.TITLE].join(" ").toLowerCase().includes(term)),
    );
  }, [requests, filters]);

  const columns = [
    {
      title: "Request",
      key: "ref",
      sorter: (a, b) => (a.SUBMITTED_AT ?? a.CREATED_AT).localeCompare(b.SUBMITTED_AT ?? b.CREATED_AT),
      render: (_, r) => (
        <div>
          <p className="text-[13px] font-semibold text-[#0f172a]">{r.REFERENCE_NO}</p>
          <p className="text-xs text-[#64748b]">{r.SUBMITTED_AT ? `Sent ${dayjs(r.SUBMITTED_AT).format("D MMM YYYY")}` : "Not submitted"}</p>
        </div>
      ),
    },
    {
      title: "Staff",
      key: "staff",
      sorter: (a, b) => (a.STAFF_NAME ?? "").localeCompare(b.STAFF_NAME ?? ""),
      render: (_, r) => (
        <div className="flex items-center gap-2.5">
          <StaffAvatar firstName={r.FIRST_NAME} lastName={r.LAST_NAME} size={32} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold uppercase text-[#0f172a]">{r.STAFF_NAME}</p>
            <p className="truncate text-xs text-[#64748b]">{[r.DEPARTMENT, r.GRADE != null && r.GRADE !== "" ? `Grade ${r.GRADE}` : null].filter(Boolean).join(" · ") || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Training",
      key: "training",
      render: (_, r) => (
        <div className="max-w-[260px]">
          <p className="truncate text-[13px] text-[#0f172a]" title={r.TITLE}>{r.TITLE}</p>
          <p className="text-xs text-[#64748b]">
            {r.REQUEST_TYPE === "CATALOGUE" ? r.COURSE_CODE : "Not in catalogue"} · {r.LOCATION === "FOREIGN" ? "Foreign" : "Local"} · {getSourceLabel(r.SOURCE)}
          </p>
        </div>
      ),
    },
    {
      title: "Cost",
      key: "cost",
      align: "right",
      sorter: (a, b) => a.ESTIMATED_COST - b.ESTIMATED_COST,
      render: (_, r) => <span className="tabular-nums text-[13px] text-[#344054]">{formatNaira(r.ESTIMATED_COST)}</span>,
    },
    {
      title: "Approval",
      key: "approval",
      render: (_, r) =>
        r.STEPS.length ? (
          <div className="space-y-1">
            <StepDots steps={r.STEPS} />
            <p className="text-xs text-[#64748b]">
              {r.STATUS === "PENDING"
                ? [r.CURRENT_ROLE ? `With ${approvalRoleLabel(r.CURRENT_ROLE)}` : "Pending", r.DAYS_WAITING ? `${r.DAYS_WAITING}d` : ""].filter(Boolean).join(" · ")
                : `${r.STEPS_APPROVED}/${r.STEPS.length} approved`}
            </p>
          </div>
        ) : (
          <span className="text-xs text-[#94a3b8]">—</span>
        ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, r) => (
        <div className="space-y-0.5">
          <RequestStatusBadge status={r.STATUS} />
          {r.STATUS === "PENDING" && r.DAYS_WAITING > 5 && <p className="text-[11px] font-medium text-[#be123c]">Overdue</p>}
        </div>
      ),
    },
  ];

  const isFiltered = filters.search || filters.department || filters.request_type || filters.location;

  return (
    <div className="space-y-4">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <Segmented
          value={filters.tab}
          onChange={(tab) => update({ tab })}
          options={STATUS_TABS.map((t) => ({ value: t.value, label: `${t.label} ${counts[t.value] ?? 0}` }))}
        />
      </div>

      <section className={`${CARD_CLASS} grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4`}>
        <Input
          allowClear
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          placeholder="Reference, staff or training"
          prefix={<Search size={14} className="text-[#94a3b8]" />}
        />
        <Select allowClear showSearch virtual={false} placeholder="All departments" value={filters.department} onChange={(v) => update({ department: v })} options={departments.map((d) => ({ value: d, label: d }))} />
        <Select
          allowClear
          virtual={false}
          placeholder="Catalogue or new"
          value={filters.request_type}
          onChange={(v) => update({ request_type: v })}
          options={[
            { value: "CATALOGUE", label: "From the catalogue" },
            { value: "EXTERNAL", label: "Not in the catalogue" },
          ]}
        />
        <Select allowClear virtual={false} placeholder="Local or foreign" value={filters.location} onChange={(v) => update({ location: v })} options={LOCATIONS} />
      </section>

      <div className="flex items-center gap-2">
        <p className="text-sm text-[#344054]">
          <span className="text-lg font-bold tabular-nums text-[#0f172a]">{filtered.length}</span> request{filtered.length === 1 ? "" : "s"}
        </p>
        {isFiltered && (
          <Button type="link" size="small" className="!px-1" onClick={() => onFiltersChange({ ...DEFAULT_REQUEST_FILTERS, tab: filters.tab })}>
            Clear filters
          </Button>
        )}
      </div>

      <section className={`${CARD_CLASS} overflow-hidden`}>
        <Table
          rowKey="REQUEST_ID"
          columns={columns}
          dataSource={filtered}
          loading={isPending}
          scroll={{ x: 1060 }}
          onRow={(r) => ({ onClick: () => onOpenRequest(r.REQUEST_ID), className: "cursor-pointer" })}
          pagination={{ pageSize: 10, hideOnSinglePage: true, className: "!px-4" }}
          locale={{
            emptyText: (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]"><Inbox size={22} /></span>
                <p className="text-sm font-semibold text-[#0f172a]">Nothing here</p>
                <p className="text-xs text-[#64748b]">No requests match this tab and filters.</p>
              </div>
            ),
          }}
        />
      </section>
    </div>
  );
}

RequestsTab.propTypes = {
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onOpenRequest: PropTypes.func.isRequired,
};
