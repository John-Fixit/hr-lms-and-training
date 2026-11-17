import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import * as XLSX from "xlsx";
import { Button, Dropdown, Form, Input, Modal, Segmented, Select, Table, Tooltip } from "antd";
import { AlertTriangle, Download, MoreHorizontal, UserPlus } from "lucide-react";
import { useGetSkillStaffOptions } from "../../../../API/trainingSkills";
import { useReplaceParticipant, useSetParticipantStatus } from "../../../../API/trainingSessions";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { StaffAvatar } from "../skills/SkillBadges";
import { staffFullName } from "../skills/skillsConstants";
import { PARTICIPANT_SOURCES, PARTICIPANT_STATUS, SEATED_STATUSES } from "./calendarConstants";
import { OutcomeBadge, ParticipantStatusBadge } from "./SessionBadges";
import AddParticipantsDrawer from "./AddParticipantsDrawer";
import StaffTrainingHistoryModal from "./StaffTrainingHistoryModal";

const VIEWS = [
  { value: "seated", label: "Seated" },
  { value: "WAITLISTED", label: "Waitlist" },
  { value: "WITHDRAWN", label: "Withdrawn" },
  { value: "all", label: "All" },
];

export default function ParticipantsPanel({ session }) {
  const editable = session.STATUS === "SCHEDULED";
  const [view, setView] = useState("seated");
  const [adding, setAdding] = useState(false);
  const [historyFor, setHistoryFor] = useState(null);
  const [dialog, setDialog] = useState(null); // { type: "withdraw" | "replace", participant }
  const [form] = Form.useForm();
  const { data: staff = [] } = useGetSkillStaffOptions();
  const { mutateAsync: setStatus, isPending: statusPending } = useSetParticipantStatus();
  const { mutateAsync: replace, isPending: replacing } = useReplaceParticipant();

  const counts = useMemo(() => {
    const c = { seated: 0, all: session.PARTICIPANTS.length };
    session.PARTICIPANTS.forEach((p) => {
      c[p.STATUS] = (c[p.STATUS] ?? 0) + 1;
      if (SEATED_STATUSES.includes(p.STATUS)) c.seated += 1;
    });
    return c;
  }, [session.PARTICIPANTS]);

  const rows = session.PARTICIPANTS.filter((p) =>
    view === "all" ? true : view === "seated" ? SEATED_STATUSES.includes(p.STATUS) : p.STATUS === view,
  );

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

  const menuFor = (p) =>
    [
      editable && p.STATUS === "NOMINATED" && { key: "confirm", label: "Mark availability confirmed" },
      editable && p.STATUS === "WAITLISTED" && { key: "seat", label: "Give a seat", disabled: session.ENROLLED >= session.CAPACITY_MAX },
      editable && SEATED_STATUSES.includes(p.STATUS) && { key: "replace", label: "Replace with someone else" },
      editable && p.STATUS !== "WITHDRAWN" && { key: "withdraw", label: "Withdraw", danger: true },
      { key: "history", label: "Training history" },
    ].filter(Boolean);

  const onAction = (key, p) => {
    const sid = session.SESSION_ID;
    if (key === "confirm") run(setStatus({ session_id: sid, staff_id: p.STAFF_ID, status: "CONFIRMED" }));
    if (key === "seat") run(setStatus({ session_id: sid, staff_id: p.STAFF_ID, status: "NOMINATED" }));
    if (key === "history") setHistoryFor(p);
    if (key === "withdraw" || key === "replace") {
      form.resetFields();
      setDialog({ type: key, participant: p });
    }
  };

  const submitDialog = async () => {
    const values = await form.validateFields();
    const { participant, type } = dialog;
    const ok =
      type === "withdraw"
        ? await run(setStatus({ session_id: session.SESSION_ID, staff_id: participant.STAFF_ID, status: "WITHDRAWN", reason: values.reason }))
        : await run(replace({ session_id: session.SESSION_ID, old_staff_id: participant.STAFF_ID, new_staff_id: values.staff_id, reason: values.reason }));
    if (ok) setDialog(null);
  };

  const exportToExcel = () => {
    const sheet = session.PARTICIPANTS.map((p, i) => ({
      "S/N": i + 1,
      Name: `${p.LAST_NAME} ${p.FIRST_NAME}`,
      "Staff Number": p.STAFF_NUMBER,
      Designation: p.DESIGNATION,
      Department: p.DEPARTMENT,
      Grade: p.GRADE,
      Status: PARTICIPANT_STATUS[p.STATUS]?.label,
      Source: PARTICIPANT_SOURCES[p.SOURCE] ?? p.SOURCE,
      "Attendance %": p.ATTENDANCE_RATE ?? "",
      Outcome: p.OUTCOME ?? "",
      Note: p.STATUS_NOTE,
    }));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(sheet), "Participants");
    XLSX.writeFile(book, `participants-${session.COURSE_CODE}-${session.START_DATE}.xlsx`);
  };

  const activeIds = new Set(session.PARTICIPANTS.filter((p) => p.STATUS !== "WITHDRAWN").map((p) => p.STAFF_ID));

  const columns = [
    {
      title: "Participant",
      key: "staff",
      sorter: (a, b) => (a.LAST_NAME ?? "").localeCompare(b.LAST_NAME ?? ""),
      render: (_, p) => (
        <div className="flex items-center gap-2.5">
          <StaffAvatar firstName={p.FIRST_NAME} lastName={p.LAST_NAME} size={32} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold uppercase text-[#0f172a]">{`${p.LAST_NAME} ${p.FIRST_NAME}`}</p>
            <p className="truncate text-xs text-[#64748b]">{p.DESIGNATION}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Department",
      key: "dept",
      render: (_, p) => (
        <div>
          <p className="text-[13px] text-[#344054]">{p.DEPARTMENT}</p>
          <p className="text-xs text-[#64748b]">Grade {p.GRADE}</p>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, p) => (
        <div className="max-w-[220px] space-y-0.5">
          <div className="flex flex-wrap items-center gap-1">
            <ParticipantStatusBadge status={p.STATUS} />
            {p.FLAGS?.length > 0 && (
              <Tooltip title={<ul className="list-disc pl-4">{p.FLAGS.map((f) => <li key={f.MESSAGE}>{f.MESSAGE}</li>)}</ul>}>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#b45309]" aria-label={p.FLAGS.map((f) => f.MESSAGE).join(". ")}>
                  <AlertTriangle size={12} /> {p.FLAGS.length}
                </span>
              </Tooltip>
            )}
          </div>
          {p.STATUS_NOTE && <p className="truncate text-[11px] text-[#64748b]" title={p.STATUS_NOTE}>{p.STATUS_NOTE}</p>}
        </div>
      ),
    },
    {
      title: "Source",
      key: "source",
      render: (_, p) => <span className="text-xs text-[#475569]">{PARTICIPANT_SOURCES[p.SOURCE] ?? p.SOURCE}</span>,
    },
    {
      title: session.STATUS === "COMPLETED" ? "Result" : "Attendance",
      key: "result",
      render: (_, p) =>
        p.OUTCOME ? (
          <div className="space-y-0.5">
            <OutcomeBadge outcome={p.OUTCOME} />
            {p.ATTENDANCE_RATE !== null && <p className="text-[11px] text-[#64748b]">{p.ATTENDANCE_RATE}% attended</p>}
          </div>
        ) : p.ATTENDANCE_RATE !== null ? (
          <span className="tabular-nums text-[13px] text-[#344054]">{p.ATTENDANCE_RATE}%</span>
        ) : (
          <span className="text-xs text-[#94a3b8]">—</span>
        ),
    },
    {
      title: <span className="sr-only">Actions</span>,
      key: "actions",
      align: "right",
      render: (_, p) => (
        <Dropdown trigger={["click"]} menu={{ items: menuFor(p), onClick: ({ key }) => onAction(key, p) }}>
          <Button type="text" aria-label={`Actions for ${p.LAST_NAME} ${p.FIRST_NAME}`} icon={<MoreHorizontal size={16} />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented
          value={view}
          onChange={setView}
          options={VIEWS.map((v) => ({ value: v.value, label: `${v.label} ${counts[v.value] ?? 0}` }))}
        />
        <div className="flex gap-2">
          <Button icon={<Download size={14} />} onClick={exportToExcel} disabled={!session.PARTICIPANTS.length}>
            Export
          </Button>
          {editable && (
            <Button type="primary" icon={<UserPlus size={14} />} onClick={() => setAdding(true)}>
              Nominate staff
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
        <Table
          size="small"
          rowKey="PARTICIPANT_ID"
          columns={columns}
          dataSource={rows}
          scroll={{ x: 820 }}
          pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
          locale={{
            emptyText: (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-[#0f172a]">No one here yet</p>
                {editable && view === "seated" && (
                  <Button size="small" className="mt-2" onClick={() => setAdding(true)}>
                    Nominate staff
                  </Button>
                )}
              </div>
            ),
          }}
        />
      </div>

      <AddParticipantsDrawer open={adding} onClose={() => setAdding(false)} session={session} />
      <StaffTrainingHistoryModal staff={historyFor} onClose={() => setHistoryFor(null)} />

      <Modal
        open={Boolean(dialog)}
        onCancel={() => setDialog(null)}
        onOk={submitDialog}
        confirmLoading={statusPending || replacing}
        okText={dialog?.type === "replace" ? "Replace" : "Withdraw"}
        okButtonProps={{ danger: dialog?.type === "withdraw" }}
        title={
          <span className="font-helvetica">
            {dialog?.type === "replace" ? "Replace" : "Withdraw"} {dialog ? `${dialog.participant.LAST_NAME} ${dialog.participant.FIRST_NAME}` : ""}
          </span>
        }
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="pt-2">
          {dialog?.type === "replace" && (
            <Form.Item name="staff_id" label="Replacement" rules={[{ required: true, message: "Choose who takes the seat." }]}>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Search staff"
                virtual={false}
                options={staff
                  .filter((s) => !activeIds.has(s.STAFF_ID))
                  .map((s) => ({ value: s.STAFF_ID, label: `${staffFullName(s)} · ${s.DEPARTMENT}` }))}
              />
            </Form.Item>
          )}
          <Form.Item
            name="reason"
            label="Reason"
            rules={dialog?.type === "withdraw" ? [{ required: true, whitespace: true, message: "Give a reason. It's kept on the participant record." }] : []}
            extra={dialog?.type === "withdraw" && session.WAITLISTED ? "The first person on the waitlist will get this seat." : undefined}
          >
            <Input.TextArea rows={3} maxLength={200} placeholder="e.g. On approved leave during the training." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

ParticipantsPanel.propTypes = {
  session: PropTypes.object.isRequired,
};
