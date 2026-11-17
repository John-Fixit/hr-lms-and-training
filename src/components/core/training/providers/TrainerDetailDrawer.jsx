import PropTypes from "prop-types";
import { Button, Drawer, Dropdown, Empty, Skeleton } from "antd";
import { Award, Building2, ChevronDown, Mail, Pencil, Phone } from "lucide-react";
import { useGetTrainer } from "../../../../API/trainingProviders";
import { useGetSkills } from "../../../../API/trainingSkills";
import DetailSection from "../shared/DetailSection";
import { CategoryTag, StaffAvatar } from "../skills/SkillBadges";
import { ActiveBadge, RatingValue, TrainerTypeBadge } from "./ProviderBadges";
import { EngagementHistory, RatingBreakdown, StatRow } from "./ProviderPanels";
import { splitTrainerName } from "./providersConstants";

export default function TrainerDetailDrawer({ trainerId, open, onClose, onOpenProvider, actions }) {
  const { data: trainer, isPending } = useGetTrainer(open ? trainerId : null);
  const { data: skills = [] } = useGetSkills();
  const names = splitTrainerName(trainer?.FULL_NAME);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(720px, 100vw)"
      title={<span className="font-helvetica">Trainer profile</span>}
      classNames={{ body: "bg-[#F9FAFB] !p-4 sm:!p-6", header: "font-helvetica" }}
      destroyOnClose
      extra={
        trainer && (
          <div className="flex gap-2">
            <Dropdown
              trigger={["click"]}
              menu={{
                items: actions.trainerMenu(trainer).filter((item) => item.key !== "edit"),
                onClick: ({ key }) => actions.runTrainerAction(key, trainer),
              }}
            >
              <Button>
                More <ChevronDown size={14} className="inline" />
              </Button>
            </Dropdown>
            <Button type="primary" icon={<Pencil size={14} />} onClick={() => actions.runTrainerAction("edit", trainer)}>
              Edit
            </Button>
          </div>
        )
      }
    >
      {isPending ? (
        <Skeleton active avatar paragraph={{ rows: 8 }} />
      ) : !trainer ? (
        <Empty description="Trainer could not be loaded." />
      ) : (
        <div className="space-y-4 font-helvetica">
          <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
            <div className="flex items-start gap-4">
              <StaffAvatar firstName={names.first} lastName={names.last} size={56} />
              <div className="min-w-0">
                <h3 className="text-xl font-bold leading-tight text-[#0f172a]">{trainer.FULL_NAME}</h3>
                <p className="text-sm text-[#475569]">{trainer.TITLE}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <TrainerTypeBadge type={trainer.TRAINER_TYPE} />
                  <ActiveBadge status={trainer.STATUS} />
                  {trainer.PROVIDER_ID ? (
                    <button
                      type="button"
                      onClick={() => onOpenProvider(trainer.PROVIDER_ID)}
                      className="inline-flex items-center gap-1 rounded text-xs font-medium text-[#4F46E5] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#6366F1]/40"
                    >
                      <Building2 size={12} /> {trainer.PROVIDER_NAME}
                    </button>
                  ) : (
                    trainer.DEPARTMENT && <span className="text-xs text-[#64748b]">{trainer.DEPARTMENT}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <StatRow
                stats={[
                  trainer.SESSIONS_DELIVERED != null && { label: "Sessions", value: trainer.SESSIONS_DELIVERED },
                  trainer.PARTICIPANTS_TOTAL != null && { label: "Staff trained", value: trainer.PARTICIPANTS_TOTAL },
                  trainer.YEARS_EXPERIENCE != null && { label: "Experience", value: `${trainer.YEARS_EXPERIENCE} yrs` },
                  { label: "Rating", value: <RatingValue value={trainer.AVERAGE_RATING} /> },
                ].filter(Boolean)}
              />
            </div>
            {(trainer.EMAIL || trainer.PHONE) && (
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                {trainer.EMAIL && (
                  <a href={`mailto:${trainer.EMAIL}`} className="flex items-center gap-1.5 text-[#4F46E5] hover:underline">
                    <Mail size={14} /> {trainer.EMAIL}
                  </a>
                )}
                {trainer.PHONE && (
                  <span className="flex items-center gap-1.5 text-[#344054]">
                    <Phone size={14} className="text-[#94a3b8]" /> {trainer.PHONE}
                  </span>
                )}
              </div>
            )}
            {trainer.BIO && <p className="mt-4 text-sm leading-relaxed text-[#475569]">{trainer.BIO}</p>}
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DetailSection title="Can teach">
              {trainer.EXPERTISE_SKILL_IDS?.length ? (
                <ul className="space-y-2">
                  {trainer.EXPERTISE_SKILL_IDS.map((id) => {
                    const info = skills.find((s) => s.SKILL_ID === id);
                    return (
                      <li key={id} className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm text-[#0f172a]">{info?.SKILL_NAME ?? "Unknown skill"}</span>
                        {info && <CategoryTag categoryId={info.CATEGORY_ID} name={info.CATEGORY_NAME} />}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-[#94a3b8]">No expertise listed.</p>
              )}
            </DetailSection>
            <DetailSection title="Qualifications">
              {trainer.QUALIFICATIONS?.length ? (
                <ul className="space-y-2">
                  {trainer.QUALIFICATIONS.map((q) => (
                    <li key={q} className="flex items-start gap-2 text-sm text-[#344054]">
                      <Award size={15} className="mt-0.5 shrink-0 text-[#FDB022]" /> {q}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#94a3b8]">No qualifications recorded.</p>
              )}
            </DetailSection>
          </div>

          <DetailSection title="Participant ratings">
            <RatingBreakdown breakdown={trainer.RATING_BREAKDOWN} />
          </DetailSection>

          <DetailSection title="Sessions delivered">
            <EngagementHistory engagements={trainer.ENGAGEMENT_HISTORY} showProvider showTrainers={false} />
          </DetailSection>
        </div>
      )}
    </Drawer>
  );
}

TrainerDetailDrawer.propTypes = {
  trainerId: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpenProvider: PropTypes.func.isRequired,
  actions: PropTypes.shape({
    trainerMenu: PropTypes.func.isRequired,
    runTrainerAction: PropTypes.func.isRequired,
  }).isRequired,
};
