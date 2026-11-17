import { useState } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Button, Drawer, Dropdown, Empty, Input, Modal, Skeleton, Tabs } from "antd";
import { AlertTriangle, CalendarClock, ChevronDown, Clock, Link2, MapPin, Pencil, Presentation } from "lucide-react";
import { useCancelSession, useCompleteSession, useGetSession } from "../../../../API/trainingSessions";
import { isSampleRecord } from "../../../../API/trainingSample";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { accentFor } from "../shared/trainingTheme";
import DetailSection from "../shared/DetailSection";
import { DeliveryChip } from "../catalogue/CatalogueBadges";
import { formatNaira } from "../catalogue/catalogueConstants";
import { SEATED_STATUSES, formatDateRange } from "./calendarConstants";
import { CapacityBar, PhaseBadge } from "./SessionBadges";
import ParticipantsPanel from "./ParticipantsPanel";
import AttendancePanel from "./AttendancePanel";

const HISTORY_LABELS = { CREATED: "Scheduled", RESCHEDULED: "Rescheduled", CANCELLED: "Cancelled", COMPLETED: "Closed" };

export default function SessionDetailDrawer({ sessionId, open, onClose, onEdit }) {
  const { data: session, isPending } = useGetSession(open ? sessionId : null);
  const { mutateAsync: cancelSession, isPending: cancelling } = useCancelSession();
  const { mutateAsync: completeSession } = useCompleteSession();
  const [modal, contextHolder] = Modal.useModal();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [tab, setTab] = useState("participants");

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

  const confirmClose = () => {
    const seated = session.PARTICIPANTS.filter((p) => SEATED_STATUSES.includes(p.STATUS));
    const pastDays = (session.DAYS ?? []).filter((d) => !dayjs(d).isAfter(dayjs(), "day"));
    const unmarked = seated.filter((p) => pastDays.some((d) => !p.ATTENDANCE[d])).length;
    const early = dayjs(session.END_DATE).isAfter(dayjs(), "day");
    modal.confirm({
      title: "Close this session?",
      content: (
        <div className="space-y-2 text-sm">
          <p>Each participant gets a result from their attendance, and feedback forms go out.</p>
          {early && <p className="text-[#b45309]">It doesn&apos;t end until {dayjs(session.END_DATE).format("D MMM")}. Days not yet held count as absent.</p>}
          {unmarked > 0 && <p className="text-[#b45309]">{unmarked} participant{unmarked === 1 ? " has" : "s have"} days with no attendance marked.</p>}
        </div>
      ),
      okText: "Close session",
      onOk: () => run(completeSession({ session_id: session.SESSION_ID })),
    });
  };

  const handleCancel = async () => {
    if (await run(cancelSession({ session_id: session.SESSION_ID, reason: cancelReason }))) {
      setCancelOpen(false);
      setCancelReason("");
    }
  };

  const canClose = session && ["IN_PROGRESS", "AWAITING_CLOSE"].includes(session.PHASE);
  const sampleRecord = isSampleRecord(session);
  const canManage = sampleRecord && session?.STATUS === "SCHEDULED";
  const accent = accentFor(session?.PROGRAMME_ID ?? "");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(880px, 100vw)"
      title={<span className="font-helvetica">Session</span>}
      classNames={{ body: "bg-[#F9FAFB] !p-4 sm:!p-6", header: "font-helvetica" }}
      destroyOnClose
      extra={
        session &&
        canManage && (
          <div className="flex gap-2">
            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  canClose && { key: "close", label: "Close session" },
                  { key: "cancel", label: "Cancel session", danger: true },
                ].filter(Boolean),
                onClick: ({ key }) => (key === "close" ? confirmClose() : setCancelOpen(true)),
              }}
            >
              <Button>
                More <ChevronDown size={14} className="inline" />
              </Button>
            </Dropdown>
            <Button type="primary" icon={<Pencil size={14} />} onClick={() => onEdit(session)}>
              Edit / reschedule
            </Button>
          </div>
        )
      }
    >
      {contextHolder}
      {isPending ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : !session ? (
        <Empty description="Session could not be loaded." />
      ) : (
        <div className="space-y-4 font-helvetica">
          <section className="relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-white p-5">
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#64748b]">{session.COURSE_CODE}</span>
              <PhaseBadge phase={session.PHASE} />
            </div>
            <h3 className="mt-1 text-xl font-bold leading-tight text-[#0f172a]">{session.COURSE_TITLE}</h3>
            <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm text-[#344054] sm:grid-cols-2">
              <p className="flex items-center gap-2"><CalendarClock size={15} className="text-[#94a3b8]" />{formatDateRange(session.START_DATE, session.END_DATE)}</p>
              {(session.START_TIME || session.END_TIME) && (
                <p className="flex items-center gap-2"><Clock size={15} className="text-[#94a3b8]" />{[session.START_TIME, session.END_TIME].filter(Boolean).join("–")} daily</p>
              )}
              <p className="flex items-center gap-2"><MapPin size={15} className="text-[#94a3b8]" />{[session.VENUE, session.CITY].filter(Boolean).join(", ") || "—"}</p>
              <p className="flex items-center gap-2"><Presentation size={15} className="text-[#94a3b8]" />{(session.TRAINER_NAMES ?? []).join(", ") || "No trainer assigned"}</p>
              {session.MEETING_LINK && (
                <a href={session.MEETING_LINK} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[#4F46E5] hover:underline">
                  <Link2 size={15} /> Join link
                </a>
              )}
              <p className="flex items-center gap-2"><DeliveryChip method={session.DELIVERY_METHOD} />{session.PROVIDER_NAME && <span className="text-xs text-[#64748b]">· {session.PROVIDER_NAME}</span>}</p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
              <CapacityBar enrolled={session.ENROLLED} max={session.CAPACITY_MAX} min={session.CAPACITY_MIN} waitlisted={session.WAITLISTED} />
              <div className="text-right text-xs text-[#64748b]">
                <p className="text-base font-bold tabular-nums text-[#0f172a]">{formatNaira(session.ENROLLED * session.COST_PER_PARTICIPANT)}</p>
                estimated cost ({formatNaira(session.COST_PER_PARTICIPANT)} each)
              </div>
            </div>

            {session.STATUS === "CANCELLED" && (
              <p className="mt-4 rounded-lg bg-[#f1f5f9] p-3 text-sm text-[#475569]">
                <span className="font-semibold">Cancelled.</span> {session.CANCEL_REASON}
              </p>
            )}
            {session.CLASHES?.length > 0 && (
              <div className="mt-4 rounded-lg border border-[#FEDF89] bg-[#FFFCF5] p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-[#93370D]"><AlertTriangle size={15} /> Clashes</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-6 text-sm text-[#93370D]">
                  {session.CLASHES.map((c, i) => <li key={`${c.SESSION_ID}-${i}`}>{c.MESSAGE}</li>)}
                </ul>
              </div>
            )}
            {session.PHASE === "AWAITING_CLOSE" && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#FEDF89] bg-[#FFFCF5] p-3 text-sm text-[#93370D]">
                This session has ended. Check attendance, then close it to record results.
                <Button size="small" type="primary" onClick={confirmClose}>Close session</Button>
              </div>
            )}
          </section>

          <Tabs
            activeKey={tab}
            onChange={setTab}
            items={[
              { key: "participants", label: `Participants (${session.ENROLLED})`, children: <ParticipantsPanel session={session} /> },
              { key: "attendance", label: "Attendance", children: <AttendancePanel session={session} /> },
              {
                key: "history",
                label: "History",
                children: (
                  <DetailSection title="Session history">
                    {session.HISTORY?.length ? (
                      <ol className="space-y-3 border-l-2 border-[#e2e8f0] pl-4">
                        {[...session.HISTORY].reverse().map((h, i) => (
                          <li key={`${h.TYPE}-${h.AT}-${i}`} className="relative text-sm">
                            <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#6366F1]" />
                            <p className="font-medium text-[#0f172a]">{HISTORY_LABELS[h.TYPE] ?? h.TYPE}</p>
                            <p className="text-xs text-[#64748b]">{dayjs(h.AT).format("D MMM YYYY")} · {h.BY}</p>
                            {h.NOTE && <p className="mt-0.5 text-[13px] text-[#475569]">{h.NOTE}</p>}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-[#94a3b8]">No history recorded for this session.</p>
                    )}
                    {session.NOTES && (
                      <p className="mt-4 rounded-lg bg-[#F9FAFB] p-3 text-sm text-[#475569]"><span className="font-semibold">Notes: </span>{session.NOTES}</p>
                    )}
                  </DetailSection>
                ),
              },
            ]}
          />
        </div>
      )}

      <Modal
        open={cancelOpen}
        onCancel={() => setCancelOpen(false)}
        onOk={handleCancel}
        okText="Cancel session"
        okButtonProps={{ danger: true, disabled: !cancelReason.trim() }}
        cancelText="Keep it"
        confirmLoading={cancelling}
        title={<span className="font-helvetica">Cancel this session?</span>}
      >
        <p className="mb-2 text-sm text-[#475569]">
          All {session?.ENROLLED ?? 0} participants will be notified. The record is kept for history.
        </p>
        <label htmlFor="cancel-reason" className="mb-1 block text-sm font-medium text-[#0f172a]">Reason</label>
        <Input.TextArea
          id="cancel-reason"
          rows={3}
          maxLength={200}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="e.g. Facilitator unavailable. Will be re-planned for Q1."
        />
      </Modal>
    </Drawer>
  );
}

SessionDetailDrawer.propTypes = {
  sessionId: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};
