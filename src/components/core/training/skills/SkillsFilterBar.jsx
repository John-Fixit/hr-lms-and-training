import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Input, Segmented, Select } from "antd";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  useGetSkillFilterOptions,
  useGetSkills,
} from "../../../../API/trainingSkills";
import {
  PROFICIENCY_LEVELS,
  VERIFICATION_FILTERS,
  buildGroupedSkillOptions,
} from "./skillsConstants";

const toOptions = (values = []) => values.map((value) => ({ value, label: value }));

function FilterField({ label, children }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
        {label}
      </span>
      {children}
    </label>
  );
}

FilterField.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default function SkillsFilterBar({ filters, onChange }) {
  const { data: skills = [] } = useGetSkills();
  const { data: options, isPending: optionsLoading } = useGetSkillFilterOptions();
  const [searchText, setSearchText] = useState(filters.search);

  // Keep the box in sync when filters are reset or set from elsewhere.
  useEffect(() => setSearchText(filters.search), [filters.search]);

  // Debounce the name search so we don't query on every keystroke.
  useEffect(() => {
    if (searchText === filters.search) return undefined;
    const timer = setTimeout(() => onChange({ search: searchText }), 300);
    return () => clearTimeout(timer);
  }, [searchText, filters.search, onChange]);

  const skillOptions = useMemo(() => buildGroupedSkillOptions(skills), [skills]);

  const departmentOptions = useMemo(
    () =>
      (options?.departments ?? [])
        .filter((d) => !filters.directorate || String(d.parent) === String(filters.directorate))
        .map((d) => ({ value: d.id, label: d.name })),
    [options?.departments, filters.directorate],
  );

  const unitOptions = useMemo(() => {
    const allowedDepartments = new Set(departmentOptions.map((d) => d.value));
    return (options?.units ?? [])
      .filter((u) =>
        filters.department
          ? String(u.parent) === String(filters.department)
          : [...allowedDepartments].some((id) => String(id) === String(u.parent)),
      )
      .map((u) => ({ value: u.id, label: u.name }));
  }, [options?.units, filters.department, departmentOptions]);

  const hasSkills = filters.skill_ids.length > 0;

  const selectProps = {
    allowClear: true,
    showSearch: true,
    optionFilterProp: "label",
    loading: optionsLoading,
    virtual: false,
    className: "w-full",
  };

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1">
          <FilterField label="Find staff by skill">
            <Select
              mode="multiple"
              size="large"
              value={filters.skill_ids}
              onChange={(value) => onChange({ skill_ids: value })}
              options={skillOptions}
              placeholder="Search a skill, e.g. Project Management"
              maxTagCount="responsive"
              suffixIcon={<Search size={16} className="text-[#94a3b8]" />}
              {...selectProps}
            />
          </FilterField>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:items-end">
          <div className="lg:w-56">
            <FilterField label="Minimum level">
              <Select
                size="large"
                value={filters.min_level}
                onChange={(value) => onChange({ min_level: value })}
                disabled={!hasSkills}
                options={PROFICIENCY_LEVELS.map((item) => ({
                  value: item.level,
                  label: item.level === 1 ? "Any level" : `L${item.level} · ${item.name} or above`,
                }))}
                className="w-full"
                virtual={false}
              />
            </FilterField>
          </div>
          {filters.skill_ids.length > 1 && (
            <FilterField label="Staff must have">
              <Segmented
                size="large"
                value={filters.match}
                onChange={(value) => onChange({ match: value })}
                options={[
                  { value: "any", label: "Any skill" },
                  { value: "all", label: "All skills" },
                ]}
              />
            </FilterField>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#64748b]">
        <SlidersHorizontal size={14} />
        Narrow down
      </div>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <FilterField label="Staff">
          <Input
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Name or staff no."
            prefix={<Search size={14} className="text-[#94a3b8]" />}
          />
        </FilterField>
        <FilterField label="Directorate">
          <Select
            value={filters.directorate}
            onChange={(value) =>
              onChange({ directorate: value, department: undefined, unit: undefined })
            }
            options={(options?.directorates ?? []).map((item) => ({ value: item.id, label: item.name }))}
            placeholder="All"
            {...selectProps}
          />
        </FilterField>
        <FilterField label="Department">
          <Select
            value={filters.department}
            onChange={(value) => onChange({ department: value, unit: undefined })}
            options={departmentOptions}
            placeholder="All"
            {...selectProps}
          />
        </FilterField>
        <FilterField label="Unit">
          <Select
            value={filters.unit}
            onChange={(value) => onChange({ unit: value })}
            options={unitOptions}
            placeholder="All"
            {...selectProps}
          />
        </FilterField>
        <FilterField label="Designation">
          <Select
            value={filters.designation}
            onChange={(value) => onChange({ designation: value })}
            options={toOptions(options?.designations)}
            placeholder="All"
            {...selectProps}
          />
        </FilterField>
        <FilterField label="Grade">
          <Select
            value={filters.grade}
            onChange={(value) => onChange({ grade: value })}
            options={(options?.grades ?? []).map((g) => ({ value: g, label: `Grade ${g}` }))}
            placeholder="All"
            {...selectProps}
          />
        </FilterField>
        <FilterField label="Region">
          <Select
            value={filters.region}
            onChange={(value) => onChange({ region: value })}
            options={toOptions(options?.regions)}
            placeholder="All"
            {...selectProps}
          />
        </FilterField>
        <FilterField label="Verification">
          <Select
            value={filters.verification}
            onChange={(value) => onChange({ verification: value })}
            options={VERIFICATION_FILTERS}
            className="w-full"
            virtual={false}
          />
        </FilterField>
      </div>
    </section>
  );
}

SkillsFilterBar.propTypes = {
  filters: PropTypes.shape({
    skill_ids: PropTypes.arrayOf(PropTypes.string).isRequired,
    min_level: PropTypes.number.isRequired,
    match: PropTypes.string.isRequired,
    verification: PropTypes.string.isRequired,
    search: PropTypes.string.isRequired,
    directorate: PropTypes.string,
    department: PropTypes.string,
    unit: PropTypes.string,
    designation: PropTypes.string,
    grade: PropTypes.string,
    region: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
