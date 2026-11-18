import { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, Dropdown, Input, Pagination, Segmented, Select, Switch, Table, Tag } from "antd";
import { BookPlus, LayoutGrid, List, MoreHorizontal, RotateCcw, Search, SearchX } from "lucide-react";
import { useGetCatalogueCourses, useGetProgrammes } from "../../../../API/trainingCatalogue";
import { useGetSkills } from "../../../../API/trainingSkills";
import { buildGroupedSkillOptions } from "../skills/skillsConstants";
import { CARD_CLASS } from "../shared/trainingTheme";
import CourseCard from "./CourseCard";
import { CourseStatusBadge, DeliveryChip, MandatoryBadge } from "./CatalogueBadges";
import {
  COURSE_STATUS_FILTERS,
  DEFAULT_COURSE_FILTERS,
  DELIVERY_METHODS,
  TRAINING_TYPES,
  formatDuration,
  formatNaira,
  getTrainingTypeLabel,
} from "./catalogueConstants";

const GRID_PAGE_SIZE = 9;

export default function CoursesTab({ filters, onFiltersChange, onOpenCourse, onNewCourse, actions }) {
  const { data: courses = [], isPending } = useGetCatalogueCourses();
  const { data: programmes = [] } = useGetProgrammes();
  const { data: skills = [] } = useGetSkills();
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
  const skillsAvailable = courses.some((course) => course.SKILLS_INCLUDED);

  const skillName = useCallback(
    (id) => skills.find((s) => s.SKILL_ID === id)?.SKILL_NAME ?? "Unknown skill",
    [skills],
  );

  const update = useCallback(
    (patch) => {
      setPage(1);
      onFiltersChange((prev) => ({ ...prev, ...patch }));
    },
    [onFiltersChange],
  );

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return courses.filter(
      (c) =>
        (filters.status === "all" || c.STATUS === filters.status) &&
        (!filters.programme_id || c.PROGRAMME_ID === filters.programme_id) &&
        (!filters.training_type || c.TRAINING_TYPE === filters.training_type) &&
        (!filters.delivery_method || c.DELIVERY_METHOD === filters.delivery_method) &&
        (!filters.skill_id || (c.SKILLS_INCLUDED && c.SKILLS.some((s) => s.SKILL_ID === filters.skill_id))) &&
        (!filters.mandatory_only || c.IS_MANDATORY) &&
        (!filters.without_skills || (c.SKILLS_INCLUDED && !c.SKILLS.length)) &&
        (!term ||
          [c.COURSE_TITLE, c.COURSE_CODE, c.DEFAULT_PROVIDER_NAME, c.TARGET_AUDIENCE]
            .join(" ")
            .toLowerCase()
            .includes(term)),
    );
  }, [courses, filters]);

  const statusCounts = useMemo(() => {
    const counts = { all: courses.length };
    courses.forEach((c) => {
      counts[c.STATUS] = (counts[c.STATUS] ?? 0) + 1;
    });
    return counts;
  }, [courses]);

  const chips = [
    filters.programme_id && {
      key: "programme_id",
      label: programmes.find((p) => p.PROGRAMME_ID === filters.programme_id)?.PROGRAMME_NAME,
    },
    filters.training_type && { key: "training_type", label: getTrainingTypeLabel(filters.training_type) },
    filters.delivery_method && {
      key: "delivery_method",
      label: DELIVERY_METHODS.find((d) => d.value === filters.delivery_method)?.label,
    },
    filters.skill_id && { key: "skill_id", label: `Builds ${skillName(filters.skill_id)}` },
    filters.mandatory_only && { key: "mandatory_only", label: "Mandatory only", reset: false },
    filters.without_skills && { key: "without_skills", label: "No skills linked", reset: false },
    filters.search && { key: "search", label: `“${filters.search}”`, reset: "" },
  ].filter(Boolean);

  const hasActiveFilters = chips.length > 0 || filters.status !== DEFAULT_COURSE_FILTERS.status;
  const pagedGrid = filtered.slice((page - 1) * GRID_PAGE_SIZE, page * GRID_PAGE_SIZE);

  const columns = [
    {
      title: "Course",
      key: "course",
      sorter: (a, b) => a.COURSE_TITLE.localeCompare(b.COURSE_TITLE),
      render: (_, c) => (
        <div className="min-w-0 max-w-sm">
          <p className="text-[13px] font-semibold text-[#0f172a]">{c.COURSE_TITLE}</p>
          <p className="text-xs text-[#64748b]">
            {c.COURSE_CODE} · {c.PROGRAMME_NAME}
          </p>
        </div>
      ),
    },
    {
      title: "Type & delivery",
      key: "type",
      render: (_, c) => (
        <div className="space-y-0.5">
          <p className="text-[13px] text-[#344054]">{getTrainingTypeLabel(c.TRAINING_TYPE)}</p>
          <DeliveryChip method={c.DELIVERY_METHOD} />
        </div>
      ),
    },
    {
      title: "Duration",
      key: "duration",
      sorter: (a, b) => a.DURATION_DAYS - b.DURATION_DAYS,
      render: (_, c) => <span className="text-[13px] text-[#344054]">{formatDuration(c.DURATION_DAYS)}</span>,
    },
    {
      title: "Default cost",
      key: "cost",
      sorter: (a, b) => a.DEFAULT_COST - b.DEFAULT_COST,
      render: (_, c) => <span className="text-[13px] tabular-nums text-[#344054]">{formatNaira(c.DEFAULT_COST)}</span>,
    },
    {
      title: "Skills",
      key: "skills",
      sorter: (a, b) => a.SKILLS.length - b.SKILLS.length,
      render: (_, c) =>
        c.SKILLS.length ? (
          <span className="text-[13px] text-[#344054]">{c.SKILLS.map((s) => skillName(s.SKILL_ID)).join(", ")}</span>
        ) : !c.SKILLS_INCLUDED ? (
          <span className="text-xs text-[#64748b]">Not returned</span>
        ) : (
          <span className="text-xs font-medium text-[#b45309]">None linked</span>
        ),
    },
    {
      title: "Trained",
      key: "trained",
      align: "center",
      sorter: (a, b) => (a.STAFF_TRAINED ?? -1) - (b.STAFF_TRAINED ?? -1),
      render: (_, c) => <span className="tabular-nums text-[13px] text-[#344054]">{c.STAFF_TRAINED ?? "—"}</span>,
    },
    {
      title: "Status",
      key: "status",
      render: (_, c) => (
        <div className="flex flex-wrap gap-1">
          <CourseStatusBadge status={c.STATUS} />
          {c.IS_MANDATORY ? <MandatoryBadge /> : null}
        </div>
      ),
    },
    {
      title: <span className="sr-only">Actions</span>,
      key: "actions",
      align: "right",
      render: (_, c) => (
        <div onClick={(e) => e.stopPropagation()} role="presentation">
          <Dropdown
            trigger={["click"]}
            menu={{ items: actions.menuItems(c), onClick: ({ key }) => actions.runAction(key, c) }}
          >
            <Button type="text" aria-label={`Actions for ${c.COURSE_TITLE}`} icon={<MoreHorizontal size={16} />} />
          </Dropdown>
        </div>
      ),
    },
  ];

  const emptyState = (
    <div className={`${CARD_CLASS} flex flex-col items-center gap-2 px-6 py-14 text-center`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]">
        {courses.length ? <SearchX size={22} /> : <BookPlus size={22} />}
      </span>
      <p className="text-sm font-semibold text-[#0f172a]">
        {courses.length ? "No courses match these filters" : "The catalogue is empty"}
      </p>
      <p className="max-w-sm text-xs text-[#64748b]">
        {courses.length
          ? "Try another status, or clear a filter."
          : "Add the first course so HR can reuse it when creating trainings."}
      </p>
      {courses.length && hasActiveFilters ? (
        <Button size="small" onClick={() => onFiltersChange(DEFAULT_COURSE_FILTERS)}>Clear filters</Button>
      ) : (
        <Button type="primary" size="small" onClick={onNewCourse}>New course</Button>
      )}
    </div>
  );

  const selectProps = { allowClear: true, virtual: false, className: "w-full" };

  return (
    <div className="space-y-4">
      <section className={`${CARD_CLASS} space-y-3 p-4`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            allowClear
            size="large"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search title, code, provider or audience"
            prefix={<Search size={15} className="text-[#94a3b8]" />}
            className="lg:max-w-md"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              value={filters.status}
              onChange={(value) => update({ status: value })}
              options={COURSE_STATUS_FILTERS.map((s) => ({
                value: s.value,
                label: `${s.label} ${statusCounts[s.value] ?? 0}`,
              }))}
            />
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: "grid", icon: <LayoutGrid size={15} className="inline" />, title: "Card view" },
                { value: "table", icon: <List size={15} className="inline" />, title: "Table view" },
              ]}
              aria-label="Switch view"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Select
            {...selectProps}
            value={filters.programme_id}
            onChange={(value) => update({ programme_id: value })}
            placeholder="All programmes"
            options={programmes.map((p) => ({ value: p.PROGRAMME_ID, label: p.PROGRAMME_NAME }))}
          />
          <Select
            {...selectProps}
            value={filters.training_type}
            onChange={(value) => update({ training_type: value })}
            placeholder="Any type"
            options={TRAINING_TYPES}
          />
          <Select
            {...selectProps}
            value={filters.delivery_method}
            onChange={(value) => update({ delivery_method: value })}
            placeholder="Any delivery method"
            options={DELIVERY_METHODS.map(({ value, label }) => ({ value, label }))}
          />
          <Select
            {...selectProps}
            showSearch
            optionFilterProp="label"
            value={filters.skill_id}
            onChange={(value) => update({ skill_id: value })}
            placeholder="Builds skill…"
            options={buildGroupedSkillOptions(skills)}
            disabled={!skillsAvailable}
          />
          <label className="flex items-center gap-2 text-sm text-[#344054]">
            <Switch
              size="small"
              checked={filters.mandatory_only}
              onChange={(checked) => update({ mandatory_only: checked })}
            />
            Mandatory only
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-[#344054]">
          <span className="text-lg font-bold tabular-nums text-[#0f172a]">{filtered.length}</span>{" "}
          course{filtered.length === 1 ? "" : "s"}
        </p>
        {chips.map((chip) => (
          <Tag
            key={chip.key}
            closable
            onClose={(e) => {
              e.preventDefault();
              update({ [chip.key]: chip.reset ?? undefined });
            }}
            className="!m-0 rounded-full border-[#6366F1]/30 bg-[#6366F1]/5 px-2.5 py-0.5 text-xs text-[#4F46E5]"
          >
            {chip.label}
          </Tag>
        ))}
        {hasActiveFilters && (
          <Button
            type="link"
            size="small"
            icon={<RotateCcw size={13} />}
            onClick={() => {
              setPage(1);
              onFiltersChange(DEFAULT_COURSE_FILTERS);
            }}
            className="!px-1"
          >
            Reset
          </Button>
        )}
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-[248px] animate-pulse rounded-xl border border-[#e2e8f0] bg-white" />
          ))}
        </div>
      ) : !filtered.length ? (
        emptyState
      ) : view === "grid" ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {pagedGrid.map((course) => (
              <CourseCard
                key={course.COURSE_ID}
                course={course}
                skillName={skillName}
                onOpen={onOpenCourse}
                menuItems={actions.menuItems}
                onAction={actions.runAction}
              />
            ))}
          </div>
          {filtered.length > GRID_PAGE_SIZE && (
            <div className="flex justify-end">
              <Pagination
                current={page}
                pageSize={GRID_PAGE_SIZE}
                total={filtered.length}
                onChange={setPage}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      ) : (
        <section className={`${CARD_CLASS} overflow-hidden`}>
          <Table
            rowKey="COURSE_ID"
            columns={columns}
            dataSource={filtered}
            scroll={{ x: 1080 }}
            onRow={(c) => ({ onClick: () => onOpenCourse(c.COURSE_ID), className: "cursor-pointer" })}
            pagination={{ pageSize: 10, hideOnSinglePage: true, className: "!px-4" }}
          />
        </section>
      )}
    </div>
  );
}

CoursesTab.propTypes = {
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onOpenCourse: PropTypes.func.isRequired,
  onNewCourse: PropTypes.func.isRequired,
  actions: PropTypes.shape({
    menuItems: PropTypes.func.isRequired,
    runAction: PropTypes.func.isRequired,
  }).isRequired,
};
