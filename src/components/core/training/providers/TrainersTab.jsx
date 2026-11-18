import { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { Button, Dropdown, Input, Segmented, Select } from "antd";
import { Briefcase, MoreHorizontal, Presentation, Search, UserRoundX } from "lucide-react";
import { useGetProviders, useGetTrainers } from "../../../../API/trainingProviders";
import { useGetSkills } from "../../../../API/trainingSkills";
import { buildGroupedSkillOptions } from "../skills/skillsConstants";
import { StaffAvatar } from "../skills/SkillBadges";
import { CARD_CLASS } from "../shared/trainingTheme";
import { ActiveBadge, RatingValue, TrainerTypeBadge } from "./ProviderBadges";
import { DEFAULT_TRAINER_FILTERS, splitTrainerName } from "./providersConstants";

function TrainerCard({ trainer, skillName, onOpen, menuItems, onAction }) {
  const { first, last } = splitTrainerName(trainer.FULL_NAME);
  const skills = trainer.EXPERTISE_SKILL_IDS ?? [];
  return (
    <article
      className={clsx(
        CARD_CLASS,
        "group relative flex h-full flex-col p-4 transition-all hover:-translate-y-0.5 hover:border-[#6366F1]/40 hover:shadow-md focus-within:ring-2 focus-within:ring-[#6366F1]/30",
        trainer.STATUS !== "ACTIVE" && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3">
        <StaffAvatar firstName={first} lastName={last} size={44} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-snug text-[#0f172a]">
            <button
              type="button"
              onClick={() => onOpen(trainer.TRAINER_ID)}
              className="text-left outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
            >
              {trainer.FULL_NAME}
            </button>
          </h3>
          <p className="truncate text-xs text-[#64748b]">{trainer.TITLE}</p>
        </div>
        <div className="relative z-10">
          <Dropdown trigger={["click"]} menu={{ items: menuItems(trainer), onClick: ({ key }) => onAction(key, trainer) }}>
            <Button type="text" size="small" aria-label={`Actions for ${trainer.FULL_NAME}`} icon={<MoreHorizontal size={16} />} />
          </Dropdown>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TrainerTypeBadge type={trainer.TRAINER_TYPE} />
        <ActiveBadge status={trainer.STATUS} />
        <span className="flex min-w-0 items-center gap-1 text-xs text-[#475569]">
          <Briefcase size={12} className="shrink-0 text-[#94a3b8]" />
          <span className="truncate">{trainer.PROVIDER_NAME || trainer.DEPARTMENT || "—"}</span>
        </span>
      </div>

      <div className="mt-3 min-h-[26px]">
        <div className="flex flex-wrap gap-1.5">
          {skills.slice(0, 3).map((id) => (
            <span key={id} className="rounded-md border border-[#6366F1]/20 bg-[#6366F1]/5 px-2 py-0.5 text-[11px] text-[#4F46E5]">
              {skillName(id)}
            </span>
          ))}
          {skills.length > 3 && <span className="px-1 text-[11px] text-[#64748b]">+{skills.length - 3}</span>}
          {!skills.length && <span className="text-[11px] text-[#94a3b8]">No expertise listed</span>}
        </div>
      </div>

      <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-[#f1f5f9] pt-3 text-xs text-[#475569]">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.08em] text-[#94a3b8]">Sessions</dt>
          <dd className="font-semibold tabular-nums text-[#0f172a]">{trainer.SESSIONS_DELIVERED ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.08em] text-[#94a3b8]">Rating</dt>
          <dd><RatingValue value={trainer.AVERAGE_RATING} size="sm" /></dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.08em] text-[#94a3b8]">Experience</dt>
          <dd className="font-semibold tabular-nums text-[#0f172a]">{trainer.YEARS_EXPERIENCE} yrs</dd>
        </div>
      </dl>
    </article>
  );
}

TrainerCard.propTypes = {
  trainer: PropTypes.object.isRequired,
  skillName: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
  menuItems: PropTypes.func.isRequired,
  onAction: PropTypes.func.isRequired,
};

export default function TrainersTab({ filters, onFiltersChange, onOpenTrainer, actions }) {
  const { data: trainers = [], isPending } = useGetTrainers();
  const { data: providers = [] } = useGetProviders();
  const { data: skills = [] } = useGetSkills();

  const update = useCallback((patch) => onFiltersChange((prev) => ({ ...prev, ...patch })), [onFiltersChange]);
  const skillName = useCallback((id) => skills.find((s) => s.SKILL_ID === id)?.SKILL_NAME ?? "Unknown skill", [skills]);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return trainers.filter(
      (t) =>
        (filters.status === "all" || t.STATUS === filters.status) &&
        (filters.trainer_type === "all" || t.TRAINER_TYPE === filters.trainer_type) &&
        (!filters.provider_id || t.PROVIDER_ID === filters.provider_id) &&
        (!filters.skill_id || t.EXPERTISE_SKILL_IDS?.includes(filters.skill_id)) &&
        (!term ||
          [t.FULL_NAME, t.TITLE, t.PROVIDER_NAME, t.DEPARTMENT, ...(t.QUALIFICATIONS ?? [])].join(" ").toLowerCase().includes(term)),
    );
  }, [trainers, filters]);

  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_TRAINER_FILTERS);

  return (
    <div className="space-y-4">
      <section className={`${CARD_CLASS} space-y-3 p-4`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            allowClear
            size="large"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search name, title, provider or qualification"
            prefix={<Search size={15} className="text-[#94a3b8]" />}
            className="lg:max-w-md"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              value={filters.trainer_type}
              onChange={(value) => update({ trainer_type: value })}
              options={[
                { value: "all", label: "All" },
                { value: "INTERNAL", label: "Internal" },
                { value: "EXTERNAL", label: "External" },
              ]}
            />
            <Segmented
              value={filters.status}
              onChange={(value) => update({ status: value })}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "all", label: "Any status" },
              ]}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            virtual={false}
            value={filters.provider_id}
            onChange={(value) => update({ provider_id: value })}
            placeholder="Any provider"
            options={providers.map((p) => ({ value: p.PROVIDER_ID, label: p.PROVIDER_NAME }))}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            virtual={false}
            value={filters.skill_id}
            onChange={(value) => update({ skill_id: value })}
            placeholder="Can teach skill…"
            options={buildGroupedSkillOptions(skills)}
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-[#344054]">
          <span className="text-lg font-bold tabular-nums text-[#0f172a]">{filtered.length}</span>{" "}
          trainer{filtered.length === 1 ? "" : "s"}
        </p>
        {isFiltered && (
          <Button type="link" size="small" className="!px-1" onClick={() => onFiltersChange(DEFAULT_TRAINER_FILTERS)}>
            Reset filters
          </Button>
        )}
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-[200px] animate-pulse rounded-xl border border-[#e2e8f0] bg-white" />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((trainer) => (
            <TrainerCard
              key={trainer.TRAINER_ID}
              trainer={trainer}
              skillName={skillName}
              onOpen={onOpenTrainer}
              menuItems={actions.trainerMenu}
              onAction={actions.runTrainerAction}
            />
          ))}
        </div>
      ) : (
        <div className={`${CARD_CLASS} flex flex-col items-center gap-2 px-6 py-14 text-center`}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]">
            {trainers.length ? <UserRoundX size={22} /> : <Presentation size={22} />}
          </span>
          <p className="text-sm font-semibold text-[#0f172a]">
            {trainers.length ? "No trainers match these filters" : "No trainers yet"}
          </p>
          <p className="max-w-sm text-xs text-[#64748b]">
            {trainers.length ? "Try another provider or skill." : "Add staff who facilitate training, or trainers from a provider."}
          </p>
        </div>
      )}
    </div>
  );
}

TrainersTab.propTypes = {
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onOpenTrainer: PropTypes.func.isRequired,
  actions: PropTypes.shape({
    trainerMenu: PropTypes.func.isRequired,
    runTrainerAction: PropTypes.func.isRequired,
  }).isRequired,
};
