import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Button, Table } from "antd";
import { BellRing } from "lucide-react";
import { useRemindTnaDepartments } from "../../../../API/trainingNeeds";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { CARD_CLASS } from "../shared/trainingTheme";
import { formatNaira } from "../catalogue/catalogueConstants";
import { SubmissionStatusBadge } from "./NeedBadges";
import { REMINDABLE } from "./needsConstants";

export default function SubmissionsTab({ round, onOpenSubmission }) {
  const { mutateAsync: remind, isPending } = useRemindTnaDepartments();
  const open = round.STATUS === "OPEN";

  const refreshOutstanding = async () => {
    try {
      const res = await remind({ tna_id: round.TNA_ID });
      successToast(res?.message ?? "Outstanding departments refreshed.");
    } catch (err) {
      errorToast(err?.response?.data?.message ?? err?.message);
    }
  };

  const submissions = round.SUBMISSIONS ?? [];
  const outstanding = submissions.filter((s) => REMINDABLE.includes(s.STATUS)).map((s) => s.SUBMISSION_ID);

  const columns = [
    {
      title: "Department",
      key: "department",
      sorter: (a, b) => (a.DEPARTMENT ?? "").localeCompare(b.DEPARTMENT ?? ""),
      render: (_, s) => <span className="text-[13px] font-semibold text-[#0f172a]">{s.DEPARTMENT}</span>,
    },
    {
      title: "Status",
      key: "status",
      sorter: (a, b) => a.STATUS.localeCompare(b.STATUS),
      render: (_, s) => <SubmissionStatusBadge status={s.STATUS} />,
    },
    {
      title: "Needs",
      key: "needs",
      align: "center",
      sorter: (a, b) => a.NEED_COUNT - b.NEED_COUNT,
      render: (_, s) => (
        <div>
          <p className="tabular-nums text-[13px] text-[#344054]">{s.NEED_COUNT}</p>
          {s.HIGH_PRIORITY > 0 && <p className="text-[11px] font-medium text-[#be123c]">{s.HIGH_PRIORITY} high</p>}
        </div>
      ),
    },
    {
      title: "Participants",
      key: "participants",
      align: "center",
      render: (_, s) => <span className="tabular-nums text-[13px] text-[#344054]">{s.PARTICIPANTS || "—"}</span>,
    },
    {
      title: "Estimated cost",
      key: "cost",
      align: "right",
      sorter: (a, b) => a.ESTIMATED_COST - b.ESTIMATED_COST,
      render: (_, s) => <span className="tabular-nums text-[13px] text-[#344054]">{s.ESTIMATED_COST ? formatNaira(s.ESTIMATED_COST) : "—"}</span>,
    },
    {
      title: "Submitted",
      key: "submitted",
      render: (_, s) =>
        s.SUBMITTED_AT ? (
          <div>
            <p className="text-[13px] text-[#344054]">{dayjs(s.SUBMITTED_AT).format("D MMM YYYY")}</p>
            {s.SUBMITTED_BY && <p className="max-w-[180px] truncate text-xs text-[#64748b]">{s.SUBMITTED_BY}</p>}
          </div>
        ) : (
          <span className="text-xs text-[#94a3b8]">—</span>
        ),
    },
    {
      title: <span className="sr-only">Open</span>,
      key: "open",
      align: "right",
      render: (_, s) => (
        <Button size="small" type={s.STATUS === "SUBMITTED" ? "primary" : "default"} onClick={(e) => { e.stopPropagation(); onOpenSubmission(s.SUBMISSION_ID); }}>
          {s.STATUS === "SUBMITTED" ? "Review" : open && REMINDABLE.includes(s.STATUS) ? "Fill in" : "View"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {open && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-[#475569]">{outstanding.length} department{outstanding.length === 1 ? " hasn't" : "s haven't"} submitted yet.</p>
          <Button
            icon={<BellRing size={14} />}
            loading={isPending}
            disabled={!outstanding.length}
            onClick={refreshOutstanding}
          >
            Refresh outstanding departments
          </Button>
        </div>
      )}
      <section className={`${CARD_CLASS} overflow-hidden`}>
        <Table
          rowKey="SUBMISSION_ID"
          columns={columns}
          dataSource={submissions}
          scroll={{ x: 900 }}
          pagination={false}
          onRow={(s) => ({ onClick: () => onOpenSubmission(s.SUBMISSION_ID), className: "cursor-pointer" })}
          locale={{ emptyText: <p className="py-8 text-sm text-[#94a3b8]">No department has saved a need in this round yet.</p> }}
        />
      </section>
    </div>
  );
}

SubmissionsTab.propTypes = {
  round: PropTypes.object.isRequired,
  onOpenSubmission: PropTypes.func.isRequired,
};
