import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { Button, ConfigProvider, Modal, Select, Skeleton } from "antd";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Building, CalendarCheck2, ClipboardList, Hourglass, ListChecks, Target, Wallet } from "lucide-react";
import TrainingPageHeader from "../../../../components/core/training/shared/TrainingPageHeader";
import "../../../../components/core/training/shared/trainingDesignSystem.css";
import TrainingPageTabs from "../../../../components/core/training/shared/TrainingPageTabs";
import { StatTile } from "../../../../components/core/training/shared/StatTile";
import { CARD_CLASS, TRAINING_THEME, tabPanelProps } from "../../../../components/core/training/shared/trainingTheme";
import { useGetTnaRound, useGetTnaRounds, useSetTnaRoundStatus } from "../../../../API/trainingNeeds";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { formatNaira } from "../../../../components/core/training/catalogue/catalogueConstants";
import { RoundStatusBadge } from "../../../../components/core/training/needs/NeedBadges";
import SubmissionsTab from "../../../../components/core/training/needs/SubmissionsTab";
import NeedsRegisterTab from "../../../../components/core/training/needs/NeedsRegisterTab";
import SubmissionDrawer from "../../../../components/core/training/needs/SubmissionDrawer";
import CreateRoundDrawer from "../../../../components/core/training/needs/CreateRoundDrawer";

const TABS = [
  { id: "departments", label: "Departments", icon: Building },
  { id: "register", label: "Needs register", icon: ListChecks },
];

export default function TrainingNeeds() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "register" ? "register" : "departments";
  const reduceMotion = useReducedMotion();
  const { data: rounds = [], isPending: roundsLoading } = useGetTnaRounds();
  const [roundId, setRoundId] = useState(null);
  const { data: round, isPending: roundLoading } = useGetTnaRound(roundId);
  const { mutateAsync: setRoundStatus, isPending: statusPending } = useSetTnaRoundStatus();
  const [openSubmissionId, setOpenSubmissionId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [modal, contextHolder] = Modal.useModal();

  // Default to the open round, else the most recent.
  useEffect(() => {
    if (!roundId && rounds.length) setRoundId((rounds.find((r) => r.STATUS === "OPEN") ?? rounds[0]).TNA_ID);
  }, [rounds, roundId]);

  const setTab = useCallback(
    (tab) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === "departments") next.delete("tab");
          else next.set("tab", tab);
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  const changeStatus = (status) => {
    const closing = status === "CLOSED";
    modal.confirm({
      title: closing ? `Close ${round.TITLE}?` : `Open ${round.TITLE}?`,
      content: closing
        ? `${round.DEPARTMENT_COUNT - round.SUBMITTED_COUNT} department(s) haven't submitted. They won't be able to after closing. Approved needs stay in the register.`
        : "Departments will be notified and can start submitting needs.",
      okText: closing ? "Close assessment" : "Open assessment",
      onOk: async () => {
        try {
          const res = await setRoundStatus({ tna_id: round.TNA_ID, status });
          successToast(res?.message);
        } catch (err) {
          errorToast(err?.response?.data?.message ?? err?.message);
        }
      },
    });
  };

  const hasOpenRound = rounds.some((r) => r.STATUS === "OPEN");
  const progress = round?.DEPARTMENT_COUNT ? Math.round((round.SUBMITTED_COUNT / round.DEPARTMENT_COUNT) * 100) : 0;
  const motionProps = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 }, transition: { duration: 0.2, ease: "easeOut" } };

  return (
    <ConfigProvider theme={TRAINING_THEME}>
      <main className="training-suite space-y-6 py-6">
        {contextHolder}
        <TrainingPageHeader
          header_text="Training Needs Assessment"
          breadCrumb_data={[{ name: "HR" }, { name: "Skill management" }, { name: "Training Needs" }]}
          subtitle="Human Resources / Skill management"
          buttonProp={[{ button_text: "New Assessment", fn: () => setCreating(true) }]}
        />

        {roundsLoading || (roundId && roundLoading) ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : !round ? (
          <div className={`${CARD_CLASS} flex flex-col items-center gap-2 px-6 py-14 text-center`}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]"><ClipboardList size={22} /></span>
            <p className="text-sm font-semibold text-[#0f172a]">No needs assessments yet</p>
            <p className="max-w-sm text-xs text-[#64748b]">Start one to collect each department&apos;s training needs for the year.</p>
            <Button type="primary" onClick={() => setCreating(true)}>New assessment</Button>
          </div>
        ) : (
          <>
            <section className={`${CARD_CLASS} relative overflow-hidden p-5 sm:p-6`}>
              <span aria-hidden="true" className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#6366F1]/[0.07]" />
              <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={roundId}
                      onChange={setRoundId}
                      variant="borderless"
                      className="-ml-3 min-w-[300px] [&_.ant-select-selection-item]:!text-xl [&_.ant-select-selection-item]:!font-bold [&_.ant-select-selection-item]:!text-[#0f172a]"
                      virtual={false}
                      aria-label="Choose assessment"
                      options={rounds.map((r) => ({ value: r.TNA_ID, label: r.TITLE }))}
                    />
                    <RoundStatusBadge status={round.STATUS} />
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-[#475569]">{round.DESCRIPTION}</p>
                  <p className="mt-2 text-xs text-[#64748b]">
                    {dayjs(round.START_DATE).format("D MMM YYYY")} – {dayjs(round.DEADLINE).format("D MMM YYYY")}
                    {round.RESPONSIBLE_OFFICER && typeof round.RESPONSIBLE_OFFICER === "string" && Number.isNaN(Number(round.RESPONSIBLE_OFFICER))
                      ? ` · ${round.RESPONSIBLE_OFFICER}`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
                  {round.STATUS === "OPEN" && (
                    <span className={`text-sm font-semibold ${round.DAYS_LEFT < 0 ? "text-[#be123c]" : round.DAYS_LEFT <= 7 ? "text-[#b45309]" : "text-[#15803d]"}`}>
                      {round.DAYS_LEFT < 0 ? `Deadline passed ${Math.abs(round.DAYS_LEFT)} days ago` : round.DAYS_LEFT === 0 ? "Deadline is today" : `${round.DAYS_LEFT} days to deadline`}
                    </span>
                  )}
                  {round.STATUS !== "CLOSED" ? (
                    <Button loading={statusPending} onClick={() => changeStatus(round.STATUS === "OPEN" ? "CLOSED" : "OPEN")} danger={round.STATUS === "OPEN"}>
                      {round.STATUS === "OPEN" ? "Close assessment" : "Open to departments"}
                    </Button>
                  ) : null}
                </div>
              </div>
              {round.DEPARTMENT_COUNT > 0 && (
                <div className="relative mt-5">
                  <div className="flex items-center justify-between text-xs text-[#475569]">
                    <span>{round.SUBMITTED_COUNT} of {round.DEPARTMENT_COUNT} departments submitted</span>
                    <span className="font-semibold tabular-nums">{progress}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#f1f5f9]">
                    <div className="h-full rounded-full bg-[#6366F1] transition-[width] duration-700" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {round.AWAITING_REVIEW != null && (
                <StatTile
                  icon={Hourglass}
                  label="Awaiting HR review"
                  value={round.AWAITING_REVIEW}
                  sub={round.REVIEWED_COUNT != null ? `${round.REVIEWED_COUNT} department${round.REVIEWED_COUNT === 1 ? "" : "s"} reviewed` : "Submitted to HR"}
                  onClick={round.AWAITING_REVIEW ? () => setTab("departments") : undefined}
                  actionLabel={round.AWAITING_REVIEW ? "Review" : undefined}
                />
              )}
              {round.NEED_COUNT != null && (
                <StatTile icon={Target} label="Needs identified" value={round.NEED_COUNT} sub={`${round.APPROVED_COUNT ?? 0} approved`} onClick={() => setTab("register")} actionLabel="Register" />
              )}
              {round.APPROVED_COST != null && (
                <StatTile icon={Wallet} label="Approved cost" value={formatNaira(round.APPROVED_COST)} sub={`${round.APPROVED_PARTICIPANTS ?? 0} participants`} />
              )}
              <StatTile
                icon={CalendarCheck2}
                label="Planned into sessions"
                value={`${round.PLANNED_COUNT ?? 0}/${round.APPROVED_COUNT ?? 0}`}
                sub={
                  (round.APPROVED_COUNT ?? 0) - (round.PLANNED_COUNT ?? 0)
                    ? `${(round.APPROVED_COUNT ?? 0) - (round.PLANNED_COUNT ?? 0)} approved needs to plan`
                    : "All approved needs planned"
                }
              />
            </div>

            <TrainingPageTabs tabs={TABS} active={activeTab} onChange={setTab} idPrefix="tna" label="Needs assessment sections" />

            <AnimatePresence mode="wait" initial={false}>
              <motion.section key={`${activeTab}-${round.TNA_ID}`} {...tabPanelProps("tna", activeTab)} {...motionProps}>
                {activeTab === "departments" ? (
                  <SubmissionsTab round={round} onOpenSubmission={setOpenSubmissionId} />
                ) : (
                  <NeedsRegisterTab round={round} onOpenSubmission={setOpenSubmissionId} />
                )}
              </motion.section>
            </AnimatePresence>
          </>
        )}

        <SubmissionDrawer open={Boolean(openSubmissionId)} submissionId={openSubmissionId} onClose={() => setOpenSubmissionId(null)} />
        <CreateRoundDrawer
          open={creating}
          onClose={() => setCreating(false)}
          hasOpenRound={hasOpenRound}
          onCreated={(id) => id && setRoundId(id)}
        />
      </main>
    </ConfigProvider>
  );
}
