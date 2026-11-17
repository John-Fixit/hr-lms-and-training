import PropTypes from "prop-types";
import { Button, Dropdown } from "antd";
import { CalendarDays, Coins, MoreHorizontal, Sparkles, Users } from "lucide-react";
import { accentFor } from "../shared/trainingTheme";
import { CourseStatusBadge, DeliveryChip, MandatoryBadge } from "./CatalogueBadges";
import {
  formatDuration,
  formatNaira,
  getLocationLabel,
  getTrainingTypeLabel,
} from "./catalogueConstants";

export default function CourseCard({ course, skillName, onOpen, menuItems, onAction }) {
  const accent = accentFor(course.PROGRAMME_ID);
  const primarySkills = [...course.SKILLS].sort((a, b) => b.IS_PRIMARY - a.IS_PRIMARY);
  const shown = primarySkills.slice(0, 3);
  const extra = primarySkills.length - shown.length;

  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:border-[#6366F1]/40 hover:bg-slate-50/40 focus-within:ring-2 focus-within:ring-[#6366F1]/25">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 rounded-t-xl"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-start justify-between gap-2 pt-1">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>
            {course.PROGRAMME_NAME}
          </p>
          <p className="mt-0.5 text-xs font-medium text-[#94a3b8]">{course.COURSE_CODE}</p>
        </div>
        <div className="relative z-10 flex items-center gap-1">
          <CourseStatusBadge status={course.STATUS} />
          <Dropdown
            trigger={["click"]}
            menu={{ items: menuItems(course), onClick: ({ key }) => onAction(key, course) }}
          >
            <Button
              type="text"
              size="small"
              aria-label={`Actions for ${course.COURSE_TITLE}`}
              icon={<MoreHorizontal size={16} />}
            />
          </Dropdown>
        </div>
      </div>

      <h3 className="mt-2 text-[15px] font-semibold leading-snug text-[#0f172a]">
        <button
          type="button"
          onClick={() => onOpen(course.COURSE_ID)}
          className="text-left outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
        >
          {course.COURSE_TITLE}
        </button>
      </h3>
      {course.DESCRIPTION && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#64748b]">{course.DESCRIPTION}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-medium text-[#344054]">
          {getTrainingTypeLabel(course.TRAINING_TYPE)}
        </span>
        <DeliveryChip method={course.DELIVERY_METHOD} />
        {course.LOCATION === "FOREIGN" && (
          <span className="text-xs text-[#475569]">{getLocationLabel(course.LOCATION)}</span>
        )}
        {course.IS_MANDATORY ? <MandatoryBadge /> : null}
      </div>

      <div className="mt-3 min-h-[28px]">
        {shown.length ? (
          <div className="flex flex-wrap gap-1.5">
            {shown.map((skill) => (
              <span
                key={skill.SKILL_ID}
                className="inline-flex items-center gap-1 rounded-md border border-[#6366F1]/20 bg-[#6366F1]/5 px-2 py-0.5 text-[11px] text-[#4F46E5]"
              >
                {skillName(skill.SKILL_ID)}
                {skill.TARGET_LEVEL != null && <span className="font-semibold">→ L{skill.TARGET_LEVEL}</span>}
              </span>
            ))}
            {extra > 0 && <span className="px-1 text-[11px] text-[#64748b]">+{extra}</span>}
          </div>
        ) : course.SKILLS_INCLUDED ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#b45309]">
            <Sparkles size={12} /> No skills linked yet
          </span>
        ) : (
          <span className="text-[11px] text-[#64748b]">Skill links not included in this response</span>
        )}
      </div>

      <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-[#f1f5f9] pt-3 text-xs">
        <div className="flex items-center gap-1.5 text-[#475569]">
          <CalendarDays size={13} className="shrink-0 text-[#94a3b8]" />
          <dt className="sr-only">Duration</dt>
          <dd>{formatDuration(course.DURATION_DAYS)}</dd>
        </div>
        <div className="flex items-center gap-1.5 text-[#475569]">
          <Coins size={13} className="shrink-0 text-[#94a3b8]" />
          <dt className="sr-only">Default cost per participant</dt>
          <dd className="truncate">{formatNaira(course.DEFAULT_COST)}</dd>
        </div>
        <div className="flex items-center gap-1.5 text-[#475569]">
          <Users size={13} className="shrink-0 text-[#94a3b8]" />
          <dt className="sr-only">Staff trained</dt>
          <dd>{course.STAFF_TRAINED == null ? "—" : `${course.STAFF_TRAINED} trained`}</dd>
        </div>
      </dl>
    </article>
  );
}

CourseCard.propTypes = {
  course: PropTypes.object.isRequired,
  skillName: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
  menuItems: PropTypes.func.isRequired,
  onAction: PropTypes.func.isRequired,
};
