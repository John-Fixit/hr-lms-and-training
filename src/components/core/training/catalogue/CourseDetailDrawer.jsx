import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Button, Drawer, Dropdown, Empty, Skeleton } from "antd";
import { CheckCircle2, ChevronDown, GraduationCap, Link2, Pencil, Sparkles } from "lucide-react";
import { useGetCatalogueCourse } from "../../../../API/trainingCatalogue";
import { useGetSkills } from "../../../../API/trainingSkills";
import { useGetAllCourses } from "../../../../API/lms-apis/course";
import { CategoryTag, ProficiencyMeter } from "../skills/SkillBadges";
import { getLevelName } from "../skills/skillsConstants";
import { accentFor } from "../shared/trainingTheme";
import DetailSection from "../shared/DetailSection";
import { CourseStatusBadge, DeliveryChip, MandatoryBadge } from "./CatalogueBadges";
import {
  formatDuration,
  formatGrades,
  formatNaira,
  getLocationLabel,
  getTrainingTypeLabel,
} from "./catalogueConstants";

function CourseLinks({ courses, emptyText, onOpenCourse }) {
  if (!courses.length) return <p className="text-sm text-[#94a3b8]">{emptyText}</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {courses.map((c) => (
        <li key={c.COURSE_ID}>
          <button
            type="button"
            onClick={() => onOpenCourse(c.COURSE_ID)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#F9FAFB] px-2.5 py-1 text-xs text-[#344054] outline-none transition-colors hover:border-[#6366F1]/50 focus-visible:ring-2 focus-visible:ring-[#6366F1]/40"
          >
            <span className="font-semibold">{c.COURSE_CODE}</span> {c.COURSE_TITLE}
          </button>
        </li>
      ))}
    </ul>
  );
}

CourseLinks.propTypes = {
  courses: PropTypes.array.isRequired,
  emptyText: PropTypes.string.isRequired,
  onOpenCourse: PropTypes.func.isRequired,
};

export default function CourseDetailDrawer({ courseId, open, onClose, onOpenCourse, actions }) {
  const { data: course, isPending } = useGetCatalogueCourse(open ? courseId : null);
  const { data: skills = [] } = useGetSkills();
  const { data: lmsCoursesRaw } = useGetAllCourses();

  const lmsCourse = (lmsCoursesRaw?.data ?? []).find((c) => c?.COURSE_ID === course?.LMS_COURSE_ID);
  const skillInfo = (id) => skills.find((s) => s.SKILL_ID === id);
  const accent = accentFor(course?.PROGRAMME_ID);

  const facts = course
    ? [
        { label: "Type", value: getTrainingTypeLabel(course.TRAINING_TYPE) },
        { label: "Delivery", value: <DeliveryChip method={course.DELIVERY_METHOD} /> },
        { label: "Location", value: getLocationLabel(course.LOCATION) },
        { label: "Duration", value: formatDuration(course.DURATION_DAYS) },
        { label: "Default cost / participant", value: formatNaira(course.DEFAULT_COST) },
        { label: "Default provider", value: course.DEFAULT_PROVIDER_NAME || "—" },
      ]
    : [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(760px, 100vw)"
      title={<span className="font-helvetica">Course details</span>}
      classNames={{ body: "bg-[#F9FAFB] !p-4 sm:!p-6", header: "font-helvetica" }}
      destroyOnClose
      extra={
        course && (
          <div className="flex gap-2">
            <Dropdown
              trigger={["click"]}
              menu={{
                items: actions.menuItems(course).filter((item) => item.key !== "edit"),
                onClick: ({ key }) => actions.runAction(key, course),
              }}
            >
              <Button>
                More <ChevronDown size={14} className="inline" />
              </Button>
            </Dropdown>
            {course.STATUS !== "ARCHIVED" && (
              <Button type="primary" icon={<Pencil size={14} />} onClick={() => actions.runAction("edit", course)}>
                Edit
              </Button>
            )}
          </div>
        )
      }
    >
      {isPending ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : !course ? (
        <Empty description="Course could not be loaded." />
      ) : (
        <div className="space-y-4 font-helvetica">
          <section className="relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-white p-5">
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>
              {course.PROGRAMME_NAME}
            </p>
            <h3 className="mt-1 text-xl font-bold leading-tight text-[#0f172a]">{course.COURSE_TITLE}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#64748b]">
              <span className="font-semibold text-[#344054]">{course.COURSE_CODE}</span>
              <CourseStatusBadge status={course.STATUS} />
              {course.IS_MANDATORY ? <MandatoryBadge /> : null}
              {course.UPDATED_AT && <span>Updated {dayjs(course.UPDATED_AT).format("D MMM YYYY")}</span>}
            </div>
            {course.DESCRIPTION && <p className="mt-3 text-sm leading-relaxed text-[#475569]">{course.DESCRIPTION}</p>}

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-[#F9FAFB] p-3.5 sm:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label} className="min-w-0">
                  <dt className="text-[11px] uppercase tracking-[0.06em] text-[#94a3b8]">{fact.label}</dt>
                  <dd className="mt-0.5 truncate text-[13px] text-[#0f172a]">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#e2e8f0] px-3.5 py-2.5">
                <p className="text-lg font-bold tabular-nums text-[#0f172a]">{course.SESSIONS_RUN ?? "—"}</p>
                <p className="text-[11px] uppercase tracking-[0.06em] text-[#64748b]">Sessions run</p>
              </div>
              <div className="rounded-lg border border-[#e2e8f0] px-3.5 py-2.5">
                <p className="text-lg font-bold tabular-nums text-[#0f172a]">{course.STAFF_TRAINED ?? "—"}</p>
                <p className="text-[11px] uppercase tracking-[0.06em] text-[#64748b]">Staff trained</p>
              </div>
            </div>
          </section>

          <DetailSection title="Objectives & outcomes">
            {course.OBJECTIVES ? (
              <p className="text-sm leading-relaxed text-[#344054]">{course.OBJECTIVES}</p>
            ) : (
              <p className="text-sm text-[#94a3b8]">No objective written yet.</p>
            )}
            {course.LEARNING_OUTCOMES.length > 0 && (
              <>
                <p className="mb-2 mt-4 text-[13px] font-medium text-[#0f172a]">By the end, participants can:</p>
                <ul className="space-y-1.5">
                  {course.LEARNING_OUTCOMES.map((outcome) => (
                    <li key={outcome} className="flex items-start gap-2 text-sm text-[#344054]">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#6366F1]" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </DetailSection>

          <DetailSection title="Skills this course builds">
            {!course.SKILLS_INCLUDED ? (
              <p className="text-sm text-[#64748b]">Skill links were not included in the course response.</p>
            ) : course.SKILLS.length ? (
              <ul className="divide-y divide-[#f1f5f9]">
                {[...course.SKILLS]
                  .sort((a, b) => b.IS_PRIMARY - a.IS_PRIMARY)
                  .map((link) => {
                    const info = skillInfo(link.SKILL_ID);
                    return (
                      <li key={link.SKILL_ID} className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#0f172a]">
                            {info?.SKILL_NAME ?? "Unknown skill"}
                            <span className="ml-2 text-[11px] font-normal text-[#64748b]">
                              {link.IS_PRIMARY ? "Primary" : "Secondary"}
                            </span>
                          </p>
                          {info && <CategoryTag categoryId={info.CATEGORY_ID} name={info.CATEGORY_NAME} />}
                        </div>
                        {link.TARGET_LEVEL != null && (
                          <div className="text-right">
                            <ProficiencyMeter level={link.TARGET_LEVEL} size="sm" />
                            <p className="mt-1 text-[11px] text-[#64748b]">
                              Takes staff to L{link.TARGET_LEVEL} · {getLevelName(link.TARGET_LEVEL)}
                            </p>
                          </div>
                        )}
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <div className="flex items-start gap-2 rounded-lg bg-[#FFFAEB] p-3 text-sm text-[#93370D]">
                <Sparkles size={16} className="mt-0.5 shrink-0" />
                <p>
                  No skills linked. Linking skills lets HR find this course when a department has a skill gap.
                </p>
              </div>
            )}
          </DetailSection>

          <DetailSection title="Who it's for">
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.06em] text-[#94a3b8]">Audience</dt>
                <dd className="mt-0.5 text-[#344054]">{course.TARGET_AUDIENCE || "Anyone"}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.06em] text-[#94a3b8]">Grades</dt>
                <dd className="mt-0.5 text-[#344054]">{formatGrades(course.TARGET_GRADES)}</dd>
              </div>
            </dl>
            <p className="mb-2 mt-4 text-[13px] font-medium text-[#0f172a]">Must complete first</p>
            <CourseLinks courses={course.PREREQUISITES} emptyText="No prerequisites." onOpenCourse={onOpenCourse} />
            <p className="mb-2 mt-4 text-[13px] font-medium text-[#0f172a]">Leads on to</p>
            <CourseLinks
              courses={course.REQUIRED_FOR}
              emptyText="No courses list this as a prerequisite."
              onOpenCourse={onOpenCourse}
            />
          </DetailSection>

          <DetailSection title="E-learning">
            {course.LMS_COURSE_ID ? (
              <p className="flex items-center gap-2 text-sm text-[#344054]">
                <Link2 size={15} className="text-[#6366F1]" />
                Linked to LMS course{" "}
                <span className="font-semibold">{lmsCourse?.COURSE_TITLE ?? course.LMS_COURSE_ID}</span>
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm text-[#94a3b8]">
                <GraduationCap size={15} /> Not linked to an LMS course.
              </p>
            )}
          </DetailSection>
        </div>
      )}
    </Drawer>
  );
}

CourseDetailDrawer.propTypes = {
  courseId: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpenCourse: PropTypes.func.isRequired,
  actions: PropTypes.shape({
    menuItems: PropTypes.func.isRequired,
    runAction: PropTypes.func.isRequired,
  }).isRequired,
};
