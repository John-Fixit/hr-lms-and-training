import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { Button, Input, Modal, Segmented, Select, Table, Tooltip } from "antd";
import { CalendarPlus, Download, Layers, List, Search } from "lucide-react";
import { useDecideTnaNeeds, useGetTnaNeeds } from "../../../../API/trainingNeeds";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { CARD_CLASS } from "../shared/trainingTheme";
import { formatNaira } from "../catalogue/catalogueConstants";
import { NeedStatusBadge, PriorityBadge } from "./NeedBadges";
import { DEFAULT_NEED_FILTERS, NEED_SOURCES, NEED_STATUS, PRIORITIES, getNeedSourceLabel } from "./needsConstants";

const PRIORITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export default function NeedsRegisterTab({ round, onOpenSubmission }) {
  const navigate = useNavigate();
  const { data: needs = [], isPending } = useGetTnaNeeds(round.TNA_ID);
  const { mutateAsync: decide, isPending: deciding } = useDecideTnaNeeds();
  const [filters, setFilters] = useState(DEFAULT_NEED_FILTERS);
  const [view, setView] = useState("need");
  const [selected, setSelected] = useState([]);
  const [dialog, setDialog] = useState(null); // status needing a comment
  const [comment, setComment] = useState("");
  const update = (patch) => setFilters((prev) => ({ ...prev, ...patch }));
  const reviewable = round.STATUS === "OPEN";

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return needs
      .filter(
        (n) =>
          (!filters.department || n.DEPARTMENT === filters.department) &&
          (!filters.priority || n.PRIORITY === filters.priority) &&
          (!filters.status || n.STATUS === filters.status) &&
          (!filters.source || n.SOURCE === filters.source) &&
          (!term || [n.TITLE, n.COURSE_CODE, n.DEPARTMENT, n.JUSTIFICATION].join(" ").toLowerCase().includes(term)),
      )
      .sort((a, b) => PRIORITY_RANK[a.PRIORITY] - PRIORITY_RANK[b.PRIORITY] || a.DEPARTMENT.localeCompare(b.DEPARTMENT));
  }, [needs, filters]);

  /** Same course (or same proposed title) requested across departments. */
  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((n) => {
      const key = n.COURSE_ID ?? `proposed:${(n.TITLE ?? "").toLowerCase()}`;
      if (!map.has(key)) map.set(key, { key, COURSE_ID: n.COURSE_ID, TITLE: n.TITLE, COURSE_CODE: n.COURSE_CODE, needs: [] });
      map.get(key).needs.push(n);
    });
    return [...map.values()]
      .map((g) => ({
        ...g,
        DEPARTMENTS: [...new Set(g.needs.map((n) => n.DEPARTMENT))],
        PARTICIPANTS: g.needs.reduce((s, n) => s + n.PARTICIPANTS, 0),
        COST: g.needs.reduce((s, n) => s + n.ESTIMATED_COST, 0),
        APPROVED: g.needs.filter((n) => n.STATUS === "APPROVED"),
        TOP_PRIORITY: g.needs.reduce((p, n) => (PRIORITY_RANK[n.PRIORITY] < PRIORITY_RANK[p] ? n.PRIORITY : p), "LOW"),
        PLANNED: g.needs.flatMap((n) => n.SESSIONS),
      }))
      .sort((a, b) => b.DEPARTMENTS.length - a.DEPARTMENTS.length || b.PARTICIPANTS - a.PARTICIPANTS);
  }, [filtered]);

  const totals = useMemo(() => {
    const approved = needs.filter((n) => n.STATUS === "APPROVED");
    return {
      approvedCost: approved.reduce((s, n) => s + n.ESTIMATED_COST, 0),
      approvedParticipants: approved.reduce((s, n) => s + n.PARTICIPANTS, 0),
      proposed: needs.filter((n) => n.STATUS === "PROPOSED").length,
    };
  }, [needs]);

  const run = async (promise) => {
    try {
      const res = await promise;
      successToast(res?.message);
      return true;
    } catch (err) {
      errorToast(err?.response?.data?.message ?? err?.message);
      return false;
    }
  };

  const bulk = async (status) => {
    if (status === "APPROVED") {
      if (await run(decide({ need_ids: selected, status }))) setSelected([]);
      return;
    }
    setComment("");
    setDialog(status);
  };

  const confirmDialog = async () => {
    if (await run(decide({ need_ids: selected, status: dialog, comment }))) {
      setSelected([]);
      setDialog(null);
    }
  };

  /** One session can serve several departments' needs for the same course. */
  const plan = (list) => navigate(`/people/hr/training/calendar?course=${list[0].COURSE_ID}&need=${list.map((n) => n.NEED_ID).join(",")}`);

  const exportToExcel = () => {
    const rows = filtered.map((n, i) => ({
      "S/N": i + 1,
      Department: n.DEPARTMENT,
      Training: n.TITLE,
      Code: n.COURSE_CODE,
      Source: getNeedSourceLabel(n.SOURCE),
      Priority: n.PRIORITY,
      Participants: n.PARTICIPANTS,
      "Estimated cost": n.ESTIMATED_COST,
      Status: NEED_STATUS[n.STATUS]?.label,
      "Planned session": n.SESSIONS[0] ? n.SESSIONS[0].START_DATE : "",
      Justification: n.JUSTIFICATION,
    }));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), "Needs register");
    XLSX.writeFile(book, `${round.TITLE.replace(/\s+/g, "-").toLowerCase()}-needs.xlsx`);
  };

  const planButton = (need) =>
    need.SESSIONS.length ? (
      <Tooltip title="Open the planned session">
        <Button size="small" type="link" className="!px-0" onClick={() => navigate(`/people/hr/training/calendar?session=${need.SESSIONS[0].SESSION_ID}`)}>
          {dayjs(need.SESSIONS[0].START_DATE).format("D MMM YYYY")}
        </Button>
      </Tooltip>
    ) : need.STATUS === "APPROVED" && need.COURSE_ID ? (
      <Button size="small" icon={<CalendarPlus size={13} />} onClick={() => plan([need])}>Plan session</Button>
    ) : need.STATUS === "APPROVED" ? (
      <span className="text-[11px] text-[#64748b]">Add to catalogue first</span>
    ) : (
      <span className="text-xs text-[#94a3b8]">—</span>
    );

  const needColumns = [
    {
      title: "Training need",
      key: "need",
      render: (_, n) => (
        <div className="max-w-[280px]">
          <p className="truncate text-[13px] font-semibold text-[#0f172a]" title={n.TITLE}>{n.TITLE}</p>
          <p className="text-xs text-[#64748b]">{n.COURSE_CODE || "New training"} · {getNeedSourceLabel(n.SOURCE)}</p>
        </div>
      ),
    },
    {
      title: "Department",
      key: "dept",
      sorter: (a, b) => (a.DEPARTMENT ?? "").localeCompare(b.DEPARTMENT ?? ""),
      render: (_, n) => (
        <button type="button" className="text-left text-[13px] text-[#4F46E5] hover:underline" onClick={() => onOpenSubmission(n.SUBMISSION_ID)}>
          {n.DEPARTMENT}
        </button>
      ),
    },
    { title: "Priority", key: "priority", sorter: (a, b) => PRIORITY_RANK[a.PRIORITY] - PRIORITY_RANK[b.PRIORITY], render: (_, n) => <PriorityBadge priority={n.PRIORITY} /> },
    { title: "Staff", key: "participants", align: "center", sorter: (a, b) => a.PARTICIPANTS - b.PARTICIPANTS, render: (_, n) => <span className="tabular-nums text-[13px]">{n.PARTICIPANTS}</span> },
    { title: "Cost", key: "cost", align: "right", sorter: (a, b) => a.ESTIMATED_COST - b.ESTIMATED_COST, render: (_, n) => <span className="tabular-nums text-[13px]">{formatNaira(n.ESTIMATED_COST)}</span> },
    { title: "Status", key: "status", render: (_, n) => <NeedStatusBadge status={n.STATUS} /> },
    { title: "Session", key: "plan", render: (_, n) => planButton(n) },
  ];

  const groupColumns = [
    {
      title: "Training",
      key: "training",
      render: (_, g) => (
        <div className="max-w-[300px]">
          <p className="truncate text-[13px] font-semibold text-[#0f172a]">{g.TITLE}</p>
          <p className="text-xs text-[#64748b]">{g.COURSE_CODE || "New training (not in catalogue)"}</p>
        </div>
      ),
    },
    {
      title: "Requested by",
      key: "departments",
      render: (_, g) => (
        <div className="max-w-[260px]">
          <p className="text-[13px] font-medium text-[#0f172a]">{g.DEPARTMENTS.length} department{g.DEPARTMENTS.length === 1 ? "" : "s"}</p>
          <p className="truncate text-xs text-[#64748b]" title={g.DEPARTMENTS.join(", ")}>{g.DEPARTMENTS.join(", ")}</p>
        </div>
      ),
    },
    { title: "Highest priority", key: "priority", render: (_, g) => <PriorityBadge priority={g.TOP_PRIORITY} /> },
    { title: "Staff", key: "participants", align: "center", render: (_, g) => <span className="tabular-nums text-[13px]">{g.PARTICIPANTS}</span> },
    { title: "Cost", key: "cost", align: "right", render: (_, g) => <span className="tabular-nums text-[13px]">{formatNaira(g.COST)}</span> },
    {
      title: "Approved",
      key: "approved",
      align: "center",
      render: (_, g) => <span className="tabular-nums text-[13px]">{g.APPROVED.length}/{g.needs.length}</span>,
    },
    {
      title: "Session",
      key: "plan",
      render: (_, g) =>
        g.PLANNED.length ? (
          <span className="text-xs font-medium text-[#4F46E5]">Planned · {dayjs(g.PLANNED[0].START_DATE).format("D MMM")}</span>
        ) : g.APPROVED.length && g.COURSE_ID ? (
          <Tooltip title="One session for every department that asked for it">
            <Button size="small" icon={<CalendarPlus size={13} />} onClick={() => plan(g.APPROVED.filter((n) => !n.SESSIONS.length))}>Plan combined session</Button>
          </Tooltip>
        ) : (
          <span className="text-xs text-[#94a3b8]">—</span>
        ),
    },
  ];

  const departments = [...new Set(needs.map((n) => n.DEPARTMENT))].sort();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Awaiting a decision", value: totals.proposed },
          { label: "Approved participants", value: totals.approvedParticipants },
          { label: "Approved cost", value: formatNaira(totals.approvedCost) },
        ].map((t) => (
          <div key={t.label} className={`${CARD_CLASS} px-4 py-3`}>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#64748b]">{t.label}</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-[#0f172a]">{t.value}</p>
          </div>
        ))}
      </div>

      <section className={`${CARD_CLASS} grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5`}>
        <Input allowClear value={filters.search} onChange={(e) => update({ search: e.target.value })} placeholder="Search needs" prefix={<Search size={14} className="text-[#94a3b8]" />} />
        <Select allowClear showSearch virtual={false} placeholder="All departments" value={filters.department} onChange={(v) => update({ department: v })} options={departments.map((d) => ({ value: d, label: d }))} />
        <Select allowClear virtual={false} placeholder="Any priority" value={filters.priority} onChange={(v) => update({ priority: v })} options={PRIORITIES.map(({ value, label }) => ({ value, label }))} />
        <Select allowClear virtual={false} placeholder="Any status" value={filters.status} onChange={(v) => update({ status: v })} options={Object.entries(NEED_STATUS).map(([value, m]) => ({ value, label: m.label }))} />
        <Select allowClear virtual={false} placeholder="Any source" value={filters.source} onChange={(v) => update({ source: v })} options={NEED_SOURCES} />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={view}
            onChange={(next) => {
              setView(next);
              setSelected([]);
            }}
            options={[
              { value: "need", label: <span className="inline-flex items-center gap-1.5"><List size={14} />By need</span> },
              { value: "course", label: <span className="inline-flex items-center gap-1.5"><Layers size={14} />By course</span> },
            ]}
          />
          {view === "need" && selected.length > 0 && reviewable && (
            <>
              <span className="text-xs text-[#64748b]">{selected.length} selected</span>
              <Button size="small" type="primary" loading={deciding} onClick={() => bulk("APPROVED")}>Approve</Button>
              <Button size="small" onClick={() => bulk("DEFERRED")}>Defer</Button>
              <Button size="small" danger onClick={() => bulk("REJECTED")}>Reject</Button>
            </>
          )}
        </div>
        <Button icon={<Download size={14} />} onClick={exportToExcel} disabled={!filtered.length}>Export</Button>
      </div>

      <section className={`${CARD_CLASS} overflow-hidden`}>
        {view === "need" ? (
          <Table
            rowKey="NEED_ID"
            columns={needColumns}
            dataSource={filtered}
            loading={isPending}
            scroll={{ x: 1000 }}
            pagination={{ pageSize: 12, hideOnSinglePage: true, className: "!px-4" }}
            rowSelection={
              reviewable
                ? {
                    selectedRowKeys: selected,
                    onChange: setSelected,
                    getCheckboxProps: (n) => ({ disabled: n.SESSIONS.length > 0, "aria-label": `Select ${n.TITLE} for ${n.DEPARTMENT}` }),
                  }
                : undefined
            }
            locale={{ emptyText: <p className="py-8 text-sm text-[#94a3b8]">No needs match these filters.</p> }}
          />
        ) : (
          <Table
            rowKey="key"
            columns={groupColumns}
            dataSource={groups}
            loading={isPending}
            scroll={{ x: 1000 }}
            pagination={{ pageSize: 12, hideOnSinglePage: true, className: "!px-4" }}
            locale={{ emptyText: <p className="py-8 text-sm text-[#94a3b8]">No needs match these filters.</p> }}
          />
        )}
      </section>

      <Modal
        open={Boolean(dialog)}
        onCancel={() => setDialog(null)}
        onOk={confirmDialog}
        okText={dialog === "REJECTED" ? "Reject" : "Defer"}
        okButtonProps={{ danger: dialog === "REJECTED", disabled: !comment.trim() }}
        confirmLoading={deciding}
        title={<span className="font-helvetica">{dialog === "REJECTED" ? "Reject" : "Defer"} {selected.length} need{selected.length === 1 ? "" : "s"}</span>}
      >
        <label htmlFor="bulk-comment" className="mb-1 block text-sm font-medium text-[#0f172a]">Reason (shared with the departments)</label>
        <Input.TextArea id="bulk-comment" rows={3} maxLength={300} value={comment} onChange={(e) => setComment(e.target.value)} />
      </Modal>
    </div>
  );
}

NeedsRegisterTab.propTypes = {
  round: PropTypes.object.isRequired,
  onOpenSubmission: PropTypes.func.isRequired,
};
