import { useState } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Button, Drawer, Dropdown, Empty, Input, Modal, Skeleton } from "antd";
import { CornerUpLeft, Lightbulb, MoreHorizontal, Plus, Send, Users } from "lucide-react";
import {
  useDecideTnaNeeds,
  useDeleteTnaNeed,
  useGetDepartmentSkillGaps,
  useGetTnaSubmission,
  useReviewTnaSubmission,
  useSubmitTnaSubmission,
} from "../../../../API/trainingNeeds";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import DetailSection from "../shared/DetailSection";
import { formatNaira } from "../catalogue/catalogueConstants";
import { NeedStatusBadge, PriorityBadge, SubmissionStatusBadge } from "./NeedBadges";
import { getNeedSourceLabel } from "./needsConstants";
import NeedFormDrawer from "./NeedFormDrawer";

export default function SubmissionDrawer({ submissionId, open, onClose }) {
  const { data: submission, isPending } = useGetTnaSubmission(open ? submissionId : null);
  const { data: gaps = [] } = useGetDepartmentSkillGaps(open ? submission?.DEPARTMENT_ID : null);
  const { mutateAsync: submit, isPending: submitting } = useSubmitTnaSubmission();
  const { mutateAsync: review, isPending: reviewing } = useReviewTnaSubmission();
  const { mutateAsync: decide } = useDecideTnaNeeds();
  const { mutateAsync: removeNeed } = useDeleteTnaNeed();
  const [modal, contextHolder] = Modal.useModal();
  const [needForm, setNeedForm] = useState({ open: false, need: null, prefill: null });
  const [dialog, setDialog] = useState(null); // { kind: "return" | "decide", status?, needId? }
  const [comment, setComment] = useState("");

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

  const roundOpen = submission?.ROUND_STATUS === "OPEN";
  const canEdit = roundOpen && submission && ["NOT_STARTED", "DRAFT", "RETURNED"].includes(submission.STATUS);
  const canReview = submission?.STATUS === "SUBMITTED";
  const needs = submission?.NEEDS ?? [];
  const undecided = needs.filter((n) => n.STATUS === "PROPOSED").length;
  const existingCourses = new Set(needs.map((n) => n.COURSE_ID).filter(Boolean));

  const openDialog = (next) => {
    setComment("");
    setDialog(next);
  };

  const confirmDialog = async () => {
    const ok =
      dialog.kind === "return"
        ? await run(review({ submission_id: submissionId, action: "RETURN", comment }))
        : await run(decide({ need_ids: [dialog.needId], status: dialog.status, comment }));
    if (ok) setDialog(null);
  };

  const needMenu = (need) =>
    [
      canEdit && { key: "edit", label: "Edit" },
      canReview && need.STATUS !== "APPROVED" && { key: "APPROVED", label: "Approve" },
      canReview && need.STATUS !== "DEFERRED" && !need.SESSIONS.length && { key: "DEFERRED", label: "Defer" },
      canReview && need.STATUS !== "REJECTED" && !need.SESSIONS.length && { key: "REJECTED", label: "Reject", danger: true },
      canEdit && !need.SESSIONS.length && { key: "delete", label: "Remove", danger: true },
    ].filter(Boolean);

  const onNeedAction = (key, need) => {
    if (key === "edit") setNeedForm({ open: true, need, prefill: null });
    if (key === "APPROVED") run(decide({ need_ids: [need.NEED_ID], status: "APPROVED" }));
    if (key === "DEFERRED" || key === "REJECTED") openDialog({ kind: "decide", status: key, needId: need.NEED_ID });
    if (key === "delete") {
      modal.confirm({
        title: `Remove "${need.TITLE}"?`,
        okText: "Remove",
        okButtonProps: { danger: true },
        onOk: () => run(removeNeed({ need_id: need.NEED_ID })),
      });
    }
  };

  const totalCost = needs.reduce((s, n) => s + n.ESTIMATED_COST, 0);
  const totalParticipants = needs.reduce((s, n) => s + n.PARTICIPANTS, 0);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(820px, 100vw)"
      title={<span className="font-helvetica">Department submission</span>}
      classNames={{ body: "bg-[#F9FAFB] !p-4 sm:!p-6", header: "font-helvetica" }}
      destroyOnClose
      extra={
        submission && (
          <div className="flex gap-2">
            {canReview && (
              <>
                <Button icon={<CornerUpLeft size={14} />} onClick={() => openDialog({ kind: "return" })}>Return</Button>
                <Button
                  type="primary"
                  loading={reviewing}
                  disabled={undecided > 0}
                  title={undecided ? `Decide on ${undecided} more need${undecided === 1 ? "" : "s"} first` : undefined}
                  onClick={() => run(review({ submission_id: submissionId, action: "ACCEPT" }))}
                >
                  Mark reviewed
                </Button>
              </>
            )}
            {canEdit && needs.length > 0 && (
              <Button type="primary" icon={<Send size={14} />} loading={submitting} onClick={() => run(submit({ submission_id: submissionId }))}>
                Submit {submission.STATUS === "RETURNED" ? "again" : "for review"}
              </Button>
            )}
          </div>
        )
      }
    >
      {contextHolder}
      {isPending ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : !submission ? (
        <Empty description="Submission could not be loaded." />
      ) : (
        <div className="space-y-4 font-helvetica">
          <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-[#0f172a]">{submission.DEPARTMENT}</h3>
                <p className="mt-0.5 text-sm text-[#64748b]">
                  {submission.SUBMITTED_AT
                    ? `Submitted ${dayjs(submission.SUBMITTED_AT).format("D MMM YYYY")}${submission.SUBMITTED_BY ? ` by ${submission.SUBMITTED_BY}` : ""}`
                    : "Not submitted yet"}
                </p>
              </div>
              <SubmissionStatusBadge status={submission.STATUS} />
            </div>
            <dl className="mt-4 grid grid-cols-3 divide-x divide-[#e2e8f0] rounded-lg bg-[#F9FAFB] text-center">
              {[
                { label: "Needs", value: needs.length },
                { label: "Participants", value: totalParticipants },
                { label: "Estimated cost", value: formatNaira(totalCost) },
              ].map((s) => (
                <div key={s.label} className="flex flex-col-reverse px-3 py-2.5">
                  <dt className="text-[11px] uppercase tracking-[0.08em] text-[#64748b]">{s.label}</dt>
                  <dd className="text-base font-bold tabular-nums text-[#0f172a]">{s.value}</dd>
                </div>
              ))}
            </dl>
            {submission.STATUS === "RETURNED" && submission.REVIEW_COMMENT && (
              <p className="mt-4 rounded-lg bg-[#FFFAEB] p-3 text-sm text-[#93370D]"><span className="font-semibold">HR asked for changes: </span>{submission.REVIEW_COMMENT}</p>
            )}
            {canReview && (
              <p className="mt-4 text-xs text-[#64748b]">Approve, defer or reject each need, then mark the submission as reviewed. {undecided ? `${undecided} still to decide.` : "All decided."}</p>
            )}
            {!roundOpen && <p className="mt-4 text-xs text-[#64748b]">This assessment is closed, so the submission is read-only.</p>}
          </section>

          {canEdit && gaps.length > 0 && (
            <DetailSection title="Suggested from skills data">
              <p className="-mt-1 mb-3 flex items-start gap-1.5 text-xs text-[#64748b]">
                <Lightbulb size={13} className="mt-0.5 shrink-0 text-[#FDB022]" />
                Skills where staff in {submission.DEPARTMENT} are at Beginner or Basic level, with a course that builds them.
              </p>
              <ul className="divide-y divide-[#f1f5f9]">
                {gaps.map((g) => {
                  const already = g.SUGGESTED_COURSE && existingCourses.has(g.SUGGESTED_COURSE.COURSE_ID);
                  return (
                    <li key={g.SKILL_ID} className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#0f172a]">{g.SKILL_NAME}</p>
                        <p className="flex items-center gap-1 text-xs text-[#64748b]">
                          <Users size={11} /> {g.STAFF_COUNT} of {g.DEPARTMENT_SIZE} staff at L1–L2
                          {g.SUGGESTED_COURSE ? ` · ${g.SUGGESTED_COURSE.COURSE_CODE} ${g.SUGGESTED_COURSE.COURSE_TITLE}` : " · no catalogue course yet"}
                        </p>
                      </div>
                      <Button
                        size="small"
                        disabled={already}
                        onClick={() =>
                          setNeedForm({
                            open: true,
                            need: null,
                            prefill: { course_id: g.SUGGESTED_COURSE?.COURSE_ID, skill_ids: [g.SKILL_ID], staff_ids: g.STAFF_IDS, source: "SKILL_GAP" },
                          })
                        }
                      >
                        {already ? "Already added" : "Add as need"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </DetailSection>
          )}

          <DetailSection
            title={`Training needs (${needs.length})`}
            action={canEdit && <Button size="small" type="primary" icon={<Plus size={13} />} onClick={() => setNeedForm({ open: true, need: null, prefill: null })}>Add need</Button>}
          >
            {needs.length ? (
              <ul className="space-y-3">
                {needs.map((n) => (
                  <li key={n.NEED_ID} className="rounded-lg border border-[#e2e8f0] p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0f172a]">{n.TITLE}</p>
                        <p className="text-xs text-[#64748b]">{n.COURSE_CODE || "New training (not in catalogue)"} · {getNeedSourceLabel(n.SOURCE)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <NeedStatusBadge status={n.STATUS} />
                        {needMenu(n).length > 0 && (
                          <Dropdown trigger={["click"]} menu={{ items: needMenu(n), onClick: ({ key }) => onNeedAction(key, n) }}>
                            <Button type="text" size="small" aria-label={`Actions for ${n.TITLE}`} icon={<MoreHorizontal size={16} />} />
                          </Dropdown>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#475569]">
                      <PriorityBadge priority={n.PRIORITY} />
                      <span>{n.PARTICIPANTS} participant{n.PARTICIPANTS === 1 ? "" : "s"}</span>
                      <span>{formatNaira(n.ESTIMATED_COST)}</span>
                      {n.SESSIONS.length > 0 && <span className="font-medium text-[#4F46E5]">Planned · {dayjs(n.SESSIONS[0].START_DATE).format("D MMM YYYY")}</span>}
                    </div>
                    <p className="mt-2 text-[13px] text-[#344054]">{n.JUSTIFICATION}</p>
                    {n.STAFF.length > 0 && <p className="mt-1 text-xs text-[#64748b]">Staff: {n.STAFF.map((s) => s.NAME).join(", ")}</p>}
                    {n.HR_COMMENT && <p className="mt-2 rounded-md bg-[#F9FAFB] px-2.5 py-1.5 text-xs text-[#475569]"><span className="font-medium">HR: </span>{n.HR_COMMENT}</p>}
                    {canReview && n.STATUS === "PROPOSED" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="small" type="primary" onClick={() => onNeedAction("APPROVED", n)}>Approve</Button>
                        <Button size="small" onClick={() => onNeedAction("DEFERRED", n)}>Defer</Button>
                        <Button size="small" danger onClick={() => onNeedAction("REJECTED", n)}>Reject</Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-[#94a3b8]">No needs recorded for this department yet.</p>
                {canEdit && <Button className="mt-2" size="small" onClick={() => setNeedForm({ open: true, need: null, prefill: null })}>Add the first need</Button>}
              </div>
            )}
          </DetailSection>
        </div>
      )}

      <NeedFormDrawer
        open={needForm.open}
        need={needForm.need}
        prefill={needForm.prefill}
        submission={submission}
        onClose={() => setNeedForm({ open: false, need: null, prefill: null })}
      />

      <Modal
        open={Boolean(dialog)}
        onCancel={() => setDialog(null)}
        onOk={confirmDialog}
        okText={dialog?.kind === "return" ? "Return to department" : dialog?.status === "REJECTED" ? "Reject need" : "Defer need"}
        okButtonProps={{ danger: dialog?.status === "REJECTED", disabled: !comment.trim() }}
        confirmLoading={reviewing}
        title={<span className="font-helvetica">{dialog?.kind === "return" ? `Return to ${submission?.DEPARTMENT}` : dialog?.status === "REJECTED" ? "Reject this need" : "Defer this need"}</span>}
      >
        <label htmlFor="tna-comment" className="mb-1 block text-sm font-medium text-[#0f172a]">
          {dialog?.kind === "return" ? "What should the department change?" : "Reason (shared with the department)"}
        </label>
        <Input.TextArea id="tna-comment" rows={3} maxLength={300} value={comment} onChange={(e) => setComment(e.target.value)} />
      </Modal>
    </Drawer>
  );
}

SubmissionDrawer.propTypes = {
  submissionId: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
