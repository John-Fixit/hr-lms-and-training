import { useState } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { Button, Drawer, Empty, Input, Modal, Radio, Skeleton } from "antd";
import { ArrowRight, CalendarCheck2, CalendarPlus, Check, CornerUpLeft, Paperclip, Pencil, X } from "lucide-react";
import {
  approvalRoleLabel,
  useActOnTrainingRequest,
  useCancelTrainingRequest,
  useGetTrainingRequest,
  useScheduleTrainingRequest,
} from "../../../../API/trainingRequests";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import DetailSection from "../shared/DetailSection";
import { ProficiencyMeter, StaffAvatar } from "../skills/SkillBadges";
import { formatNaira, getTrainingTypeLabel } from "../catalogue/catalogueConstants";
import { formatDateRange } from "../calendar/calendarConstants";
import { getFundingLabel, getSourceLabel } from "./requestsConstants";
import { ApprovalTimeline, RequestStatusBadge } from "./RequestBadges";

const ACTIONS = {
  APPROVE: { title: "Approve", ok: "Approve", needsComment: false, placeholder: "Optional comment for the next approver." },
  RETURN: { title: "Return for correction", ok: "Return", needsComment: true, placeholder: "What should the requester change?" },
  REJECT: { title: "Reject request", ok: "Reject", needsComment: true, placeholder: "Why is it rejected? The requester sees this." },
};

const HISTORY_LABELS = {
  CREATE: "Created",
  SUBMITTED: "Submitted",
  RESUBMITTED: "Resubmitted",
  APPROVED: "Approved",
  RETURNED: "Returned",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  SCHEDULED: "Scheduled",
};

export default function RequestDetailDrawer({ requestId, open, onClose, onEdit }) {
  const navigate = useNavigate();
  const { data: request, isPending } = useGetTrainingRequest(open ? requestId : null);
  const { mutateAsync: act, isPending: acting } = useActOnTrainingRequest();
  const { mutateAsync: cancel, isPending: cancelling } = useCancelTrainingRequest();
  const { mutateAsync: schedule, isPending: scheduling } = useScheduleTrainingRequest();
  const [decision, setDecision] = useState(null);
  const [comment, setComment] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [sessionChoice, setSessionChoice] = useState(null);

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

  const openDecision = (action) => {
    setComment("");
    setDecision(action);
  };

  const submitDecision = async () => {
    if (await run(act({ request_id: request.REQUEST_ID, action: decision, comment }))) setDecision(null);
  };

  const submitCancel = async () => {
    if (await run(cancel({ request_id: request.REQUEST_ID, reason: comment }))) setCancelOpen(false);
  };

  const scheduleInto = async () => {
    if (await run(schedule({ request_id: request.REQUEST_ID, session_id: sessionChoice }))) setSessionChoice(null);
  };

  const meta = decision ? ACTIONS[decision] : null;
  const canEdit = request && ["DRAFT", "RETURNED"].includes(request.STATUS);
  const canCancel = request && ["DRAFT", "PENDING", "RETURNED", "APPROVED"].includes(request.STATUS);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(820px, 100vw)"
      title={<span className="font-helvetica">Training request</span>}
      classNames={{ body: "bg-[#F9FAFB] !p-4 sm:!p-6", header: "font-helvetica" }}
      destroyOnClose
      extra={
        request && (
          <div className="flex gap-2">
            {canCancel && (
              <Button
                onClick={() => {
                  setComment("");
                  setCancelOpen(true);
                }}
              >
                Cancel request
              </Button>
            )}
            {canEdit && (
              <Button type="primary" icon={<Pencil size={14} />} onClick={() => onEdit(request)}>
                {request.STATUS === "RETURNED" ? "Correct & resubmit" : "Edit draft"}
              </Button>
            )}
          </div>
        )
      }
    >
      {isPending ? (
        <Skeleton active avatar paragraph={{ rows: 10 }} />
      ) : !request ? (
        <Empty description="Request could not be loaded." />
      ) : (
        <div className="space-y-4 font-helvetica">
          <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#64748b]">{request.REFERENCE_NO}</span>
              <RequestStatusBadge status={request.STATUS} />
              <span className="text-xs text-[#94a3b8]">via {getSourceLabel(request.SOURCE)}</span>
            </div>
            <h3 className="mt-1 text-xl font-bold leading-tight text-[#0f172a]">{request.TITLE}</h3>
            <p className="mt-0.5 text-sm text-[#64748b]">
              {request.REQUEST_TYPE === "CATALOGUE" ? `${request.COURSE_CODE || "Catalogue course"}` : `Not in the catalogue${request.PROPOSED_PROVIDER ? ` · ${request.PROPOSED_PROVIDER}` : ""}`}
            </p>

            <div className="mt-4 flex items-center gap-3 rounded-lg bg-[#F9FAFB] p-3">
              <StaffAvatar firstName={request.FIRST_NAME} lastName={request.LAST_NAME} size={40} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold uppercase text-[#0f172a]">{request.STAFF_NAME}</p>
                <p className="truncate text-xs text-[#64748b]">{[request.DESIGNATION, request.DEPARTMENT, request.GRADE != null && request.GRADE !== "" ? `Grade ${request.GRADE}` : null].filter(Boolean).join(" · ") || "—"}</p>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              {[
                { label: "Type", value: `${getTrainingTypeLabel(request.TRAINING_TYPE)} · ${request.LOCATION === "FOREIGN" ? "Foreign" : "Local"}` },
                { label: "Preferred dates", value: request.PREFERRED_START ? formatDateRange(request.PREFERRED_START, request.PREFERRED_END) : "Flexible" },
                { label: "Estimated cost", value: formatNaira(request.ESTIMATED_COST) },
                { label: "Funding", value: getFundingLabel(request.FUNDING_SOURCE) },
              ].map((f) => (
                <div key={f.label} className="min-w-0">
                  <dt className="text-[11px] uppercase tracking-[0.06em] text-[#94a3b8]">{f.label}</dt>
                  <dd className="mt-0.5 text-[13px] text-[#0f172a]">{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {request.STATUS === "PENDING" && (
            <section className="rounded-xl border border-sky-200 bg-[#F5FAFF] p-4">
              <p className="text-sm font-semibold text-[#175CD3]">
                Waiting on {[approvalRoleLabel(request.CURRENT_ROLE), request.CURRENT_APPROVER].filter(Boolean).join(" · ") || "the current approver"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="primary" icon={<Check size={14} />} onClick={() => openDecision("APPROVE")}>Approve</Button>
                <Button icon={<CornerUpLeft size={14} />} onClick={() => openDecision("RETURN")}>Return for correction</Button>
                <Button danger icon={<X size={14} />} onClick={() => openDecision("REJECT")}>Reject</Button>
              </div>
            </section>
          )}

          {request.STATUS === "APPROVED" && (
            <section className="rounded-xl border border-[#ABEFC6] bg-[#F6FEF9] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#15803d]"><CalendarPlus size={16} /> Fully approved — place the requester in a session</p>
              {request.OPEN_SESSIONS?.length ? (
                <>
                  <Radio.Group value={sessionChoice} onChange={(e) => setSessionChoice(e.target.value)} className="mt-3 w-full">
                    <div className="space-y-2">
                      {request.OPEN_SESSIONS.map((s) => (
                        <Radio key={s.SESSION_ID} value={s.SESSION_ID} className="!flex w-full rounded-lg border border-[#D1FADF] bg-white p-2.5">
                          <span className="text-sm text-[#0f172a]">{formatDateRange(s.START_DATE, s.END_DATE)}</span>
                          <span className="ml-2 text-xs text-[#64748b]">
                            {s.VENUE} · {s.SEATS_LEFT > 0 ? `${s.SEATS_LEFT} seats left` : "full — waitlist"}
                          </span>
                        </Radio>
                      ))}
                    </div>
                  </Radio.Group>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="primary" disabled={!sessionChoice} loading={scheduling} onClick={scheduleInto}>Enrol in this session</Button>
                    {request.COURSE_ID && (
                      <Button onClick={() => navigate(`/people/hr/training/calendar?course=${request.COURSE_ID}&request=${request.REQUEST_ID}`)}>
                        Schedule a new session
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-2 text-sm text-[#15803d]">
                  {request.COURSE_ID ? (
                    <>
                      <p>No upcoming session of this course yet.</p>
                      <Button className="mt-2" type="primary" onClick={() => navigate(`/people/hr/training/calendar?course=${request.COURSE_ID}&request=${request.REQUEST_ID}`)}>
                        Schedule a session <ArrowRight size={14} className="inline" />
                      </Button>
                    </>
                  ) : (
                    <p>This training isn&apos;t in the catalogue. Add it to the catalogue first, then schedule a session — or arrange it directly with the provider.</p>
                  )}
                </div>
              )}
            </section>
          )}

          {request.SESSION && (
            <section className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#99F6E0] bg-[#F0FDF9] p-4">
              <p className="flex items-center gap-2 text-sm text-[#4F46E5]">
                <CalendarCheck2 size={16} />
                Enrolled in the session on <span className="font-semibold">{formatDateRange(request.SESSION.START_DATE, request.SESSION.END_DATE)}</span> · {request.SESSION.VENUE}
              </p>
              <Button size="small" onClick={() => navigate(`/people/hr/training/calendar?session=${request.SESSION.SESSION_ID}`)}>Open session</Button>
            </section>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DetailSection title="Approval route">
              <p className="-mt-1 mb-3 text-xs text-[#64748b]">{request.ROUTE_NAME || "Set on submission"}</p>
              <ApprovalTimeline steps={request.STEPS} />
            </DetailSection>
            <div className="space-y-4">
              <DetailSection title="Why it's needed">
                <p className="text-sm leading-relaxed text-[#344054]">{request.JUSTIFICATION}</p>
                {request.EXPECTED_OUTCOME && (
                  <p className="mt-3 text-sm text-[#475569]"><span className="font-medium text-[#0f172a]">Expected outcome: </span>{request.EXPECTED_OUTCOME}</p>
                )}
                {request.ATTACHMENT_NAME && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-[#475569]"><Paperclip size={12} /> {request.ATTACHMENT_NAME}</p>
                )}
              </DetailSection>
              <DetailSection title="Skill gap">
                {request.SKILL_GAPS.length ? (
                  <ul className="space-y-2.5">
                    {request.SKILL_GAPS.map((g) => (
                      <li key={g.SKILL_ID} className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[13px] text-[#0f172a]">{g.SKILL_NAME}</span>
                        {g.TARGET_LEVEL != null && (
                          <span className="flex items-center gap-2 text-xs text-[#64748b]">
                            {g.CURRENT_LEVEL ? <ProficiencyMeter level={g.CURRENT_LEVEL} size="sm" /> : "Not recorded"}
                            <ArrowRight size={12} /> L{g.TARGET_LEVEL}
                            <span className={g.GAP ? "font-semibold text-[#b45309]" : "font-semibold text-[#15803d]"}>
                              {g.GAP ? `gap ${g.GAP}` : "no gap"}
                            </span>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#94a3b8]">No skills linked to this request.</p>
                )}
              </DetailSection>
            </div>
          </div>

          <DetailSection title="Activity">
            {request.HISTORY.length ? (
              <ol className="space-y-3 border-l-2 border-[#e2e8f0] pl-4">
                {[...request.HISTORY].reverse().map((h, i) => (
                  <li key={`${h.ACTION}-${h.AT}-${i}`} className="relative text-sm">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#6366F1]" />
                    <p className="text-[#0f172a]">
                      <span className="font-medium">{HISTORY_LABELS[h.ACTION] ?? h.ACTION}</span>
                      <span className="text-[#64748b]"> by {h.BY}{h.ROLE ? ` (${approvalRoleLabel(h.ROLE)})` : ""}</span>
                    </p>
                    <p className="text-xs text-[#94a3b8]">{dayjs(h.AT).format("D MMM YYYY")}</p>
                    {h.COMMENT && <p className="mt-0.5 text-[13px] text-[#475569]">“{h.COMMENT}”</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-[#94a3b8]">Not submitted yet.</p>
            )}
          </DetailSection>
        </div>
      )}

      <Modal
        open={Boolean(decision)}
        onCancel={() => setDecision(null)}
        onOk={submitDecision}
        okText={meta?.ok}
        okButtonProps={{ danger: decision === "REJECT", disabled: meta?.needsComment && !comment.trim() }}
        confirmLoading={acting}
        title={<span className="font-helvetica">{meta?.title}</span>}
      >
        <p className="mb-2 text-sm text-[#475569]">
          As {approvalRoleLabel(request?.CURRENT_ROLE)} for {request?.REFERENCE_NO}.
        </p>
        <label htmlFor="decision-comment" className="mb-1 block text-sm font-medium text-[#0f172a]">
          Comment{meta?.needsComment ? "" : " (optional)"}
        </label>
        <Input.TextArea id="decision-comment" rows={3} maxLength={400} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={meta?.placeholder} />
      </Modal>

      <Modal
        open={cancelOpen}
        onCancel={() => setCancelOpen(false)}
        onOk={submitCancel}
        okText="Cancel request"
        cancelText="Keep it"
        okButtonProps={{ danger: true, disabled: !comment.trim() }}
        confirmLoading={cancelling}
        title={<span className="font-helvetica">Cancel {request?.REFERENCE_NO}?</span>}
      >
        <label htmlFor="cancel-comment" className="mb-1 block text-sm font-medium text-[#0f172a]">Reason</label>
        <Input.TextArea id="cancel-comment" rows={3} maxLength={300} value={comment} onChange={(e) => setComment(e.target.value)} />
      </Modal>
    </Drawer>
  );
}

RequestDetailDrawer.propTypes = {
  requestId: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};
