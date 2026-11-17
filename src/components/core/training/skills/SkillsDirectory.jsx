import { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Button, Table, Tag, Tooltip } from "antd";
import { Download, Eye, Plus, RotateCcw, UserSearch } from "lucide-react";
import * as XLSX from "xlsx";
import {
  useGetSkills,
  useGetStaffSkillDirectory,
} from "../../../../API/trainingSkills";
import SkillsFilterBar from "./SkillsFilterBar";
import {
  BarList,
  ProficiencyMeter,
  StaffAvatar,
} from "./SkillBadges";
import {
  DEFAULT_DIRECTORY_FILTERS,
  PROFICIENCY_LEVELS,
  VERIFICATION_FILTERS,
  getLevelName,
  staffFullName,
} from "./skillsConstants";

const FILTER_LABELS = {
  directorate: "Directorate",
  department: "Department",
  unit: "Unit",
  designation: "Designation",
  grade: "Grade",
  region: "Region",
};

function InsightCard({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5">
      <h3 className="text-sm font-semibold text-[#0f172a]">{title}</h3>
      <p className="mb-4 text-xs text-[#64748b]">{subtitle}</p>
      {children}
    </div>
  );
}

InsightCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
};

function SkillChips({ row, showMatched }) {
  const list = showMatched ? row.MATCHED_SKILLS : row.SKILLS;
  if (!list.length) {
    return <span className="text-xs italic text-[#94a3b8]">No skills recorded</span>;
  }
  if (showMatched) {
    return (
      <div className="flex flex-col gap-1.5">
        {list.map((skill) => (
          <div key={skill.STAFF_SKILL_ID} className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[13px] font-medium text-[#0f172a]">{skill.SKILL_NAME}</span>
            <ProficiencyMeter level={skill.LEVEL} size="sm" showLabel />
            {skill.STATUS === "PENDING" && (
              <span className="text-[11px] font-medium text-[#b45309]">Pending</span>
            )}
          </div>
        ))}
      </div>
    );
  }
  const visible = [...list].sort((a, b) => b.LEVEL - a.LEVEL).slice(0, 3);
  const hidden = list.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((skill) => (
        <span
          key={skill.STAFF_SKILL_ID}
          className="inline-flex items-center gap-1 rounded-md border border-[#e2e8f0] bg-[#F9FAFB] px-2 py-0.5 text-xs text-[#344054]"
        >
          {skill.SKILL_NAME}
          <span className="font-semibold text-[#4F46E5]">L{skill.LEVEL}</span>
        </span>
      ))}
      {hidden > 0 && (
        <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium text-[#64748b]">
          +{hidden} more
        </span>
      )}
    </div>
  );
}

SkillChips.propTypes = {
  row: PropTypes.object.isRequired,
  showMatched: PropTypes.bool,
};

export default function SkillsDirectory({ filters, onFiltersChange, onOpenProfile, onRecordSkill }) {
  const { data, isFetching, isPending } = useGetStaffSkillDirectory(filters);
  const { data: skills = [] } = useGetSkills();

  const rows = useMemo(() => data?.rows ?? [], [data?.rows]);
  const insights = data?.insights;
  const hasSkillFilter = filters.skill_ids.length > 0;

  const skillName = useCallback(
    (id) => skills.find((s) => s.SKILL_ID === id)?.SKILL_NAME ?? id,
    [skills],
  );

  const updateFilters = useCallback(
    (patch) => onFiltersChange((prev) => ({ ...prev, ...patch })),
    [onFiltersChange],
  );

  const activeChips = useMemo(() => {
    const chips = filters.skill_ids.map((id) => ({
      key: `skill-${id}`,
      label: skillName(id),
      onClose: () => updateFilters({ skill_ids: filters.skill_ids.filter((s) => s !== id) }),
    }));
    if (hasSkillFilter && filters.min_level > 1) {
      chips.push({
        key: "min_level",
        label: `${getLevelName(filters.min_level)} (L${filters.min_level}) or above`,
        onClose: () => updateFilters({ min_level: 1 }),
      });
    }
    Object.entries(FILTER_LABELS).forEach(([key, label]) => {
      if (filters[key]) {
        chips.push({
          key,
          label: `${label}: ${key === "grade" ? `Grade ${filters[key]}` : filters[key]}`,
          onClose: () =>
            updateFilters({
              [key]: undefined,
              ...(key === "directorate" ? { department: undefined, unit: undefined } : {}),
              ...(key === "department" ? { unit: undefined } : {}),
            }),
        });
      }
    });
    if (filters.verification !== "any") {
      chips.push({
        key: "verification",
        label: VERIFICATION_FILTERS.find((v) => v.value === filters.verification)?.label,
        onClose: () => updateFilters({ verification: "any" }),
      });
    }
    if (filters.search) {
      chips.push({
        key: "search",
        label: `“${filters.search}”`,
        onClose: () => updateFilters({ search: "" }),
      });
    }
    return chips;
  }, [filters, hasSkillFilter, skillName, updateFilters]);

  const exportToExcel = useCallback(() => {
    const sheetRows = rows.map((row, index) => ({
      "S/N": index + 1,
      "Last Name": row.LAST_NAME,
      "First Name": row.FIRST_NAME,
      "Staff Number": row.STAFF_NUMBER,
      Designation: row.DESIGNATION,
      Grade: row.GRADE,
      Directorate: row.DIRECTORATE,
      Department: row.DEPARTMENT,
      Unit: row.UNIT,
      Region: row.REGION,
      Skills: (hasSkillFilter ? row.MATCHED_SKILLS : row.SKILLS)
        .map((s) => `${s.SKILL_NAME} (L${s.LEVEL} ${getLevelName(s.LEVEL)}, ${s.STATUS.toLowerCase()})`)
        .join("; "),
    }));
    const sheet = XLSX.utils.json_to_sheet(sheetRows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Staff Skills");
    XLSX.writeFile(book, "staff-skills-directory.xlsx");
  }, [rows, hasSkillFilter]);

  const columns = [
    {
      title: "Staff",
      key: "staff",
      sorter: (a, b) => staffFullName(a).localeCompare(staffFullName(b)),
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <StaffAvatar firstName={row.FIRST_NAME} lastName={row.LAST_NAME} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold uppercase text-[#0f172a]">
              {staffFullName(row)}
            </p>
            <p className="text-xs text-[#64748b]">{row.STAFF_NUMBER}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Designation",
      key: "designation",
      sorter: (a, b) => Number(a.GRADE) - Number(b.GRADE),
      render: (_, row) => (
        <div>
          <p className="text-[13px] text-[#344054]">{row.DESIGNATION}</p>
          <p className="text-xs text-[#64748b]">
            Grade {row.GRADE} · Step {row.STEP}
          </p>
        </div>
      ),
    },
    {
      title: "Department / Unit",
      key: "department",
      sorter: (a, b) => String(a.DEPARTMENT ?? "").localeCompare(String(b.DEPARTMENT ?? "")),
      render: (_, row) => (
        <div>
          <p className="text-[13px] text-[#344054]">{row.DEPARTMENT}</p>
          <p className="text-xs text-[#64748b]">
            {row.UNIT} · {row.REGION}
          </p>
        </div>
      ),
    },
    {
      title: hasSkillFilter ? "Matching skills" : "Top skills",
      key: "skills",
      sorter: hasSkillFilter
        ? (a, b) =>
            Math.max(0, ...a.MATCHED_SKILLS.map((s) => s.LEVEL)) -
            Math.max(0, ...b.MATCHED_SKILLS.map((s) => s.LEVEL))
        : (a, b) => a.SKILLS.length - b.SKILLS.length,
      render: (_, row) => <SkillChips row={row} showMatched={hasSkillFilter} />,
    },
    {
      title: "Verified",
      key: "verified",
      align: "center",
      render: (_, row) => {
        const verified = row.SKILLS.filter((s) => s.STATUS === "VERIFIED").length;
        return row.SKILLS.length ? (
          <span className="tabular-nums text-[13px] text-[#344054]">
            {verified}/{row.SKILLS.length}
          </span>
        ) : (
          <span className="text-[#94a3b8]">—</span>
        );
      },
    },
    {
      title: <span className="sr-only">Actions</span>,
      key: "actions",
      align: "right",
      render: (_, row) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()} role="presentation">
          <Tooltip title="Record a skill">
            <Button
              type="text"
              aria-label={`Record a skill for ${staffFullName(row)}`}
              icon={<Plus size={16} />}
              onClick={() => onRecordSkill(row)}
            />
          </Tooltip>
          <Tooltip title="View skills profile">
            <Button
              type="text"
              aria-label={`View skills profile for ${staffFullName(row)}`}
              icon={<Eye size={16} className="text-[#4F46E5]" />}
              onClick={() => onOpenProfile(row.STAFF_ID)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const totalRows = rows.length;

  return (
    <div className="space-y-5">
      <SkillsFilterBar filters={filters} onChange={updateFilters} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="text-sm text-[#344054]">
            <span className="text-lg font-bold text-[#0f172a] tabular-nums">{totalRows}</span>{" "}
            staff {hasSkillFilter ? "match" : "found"}
          </p>
          {activeChips.map((chip) => (
            <Tag
              key={chip.key}
              closable
              onClose={(e) => {
                e.preventDefault();
                chip.onClose();
              }}
              className="!m-0 rounded-full border-[#6366F1]/30 bg-[#6366F1]/5 px-2.5 py-0.5 text-xs text-[#4F46E5]"
            >
              {chip.label}
            </Tag>
          ))}
          {activeChips.length > 0 && (
            <Button
              type="link"
              size="small"
              icon={<RotateCcw size={13} />}
              onClick={() => onFiltersChange(DEFAULT_DIRECTORY_FILTERS)}
              className="!px-1"
            >
              Clear all
            </Button>
          )}
        </div>
        <Button icon={<Download size={15} />} onClick={exportToExcel} disabled={!totalRows}>
          Export to Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InsightCard
          title="Where they sit"
          subtitle="Staff in this result by department. Select a department to filter."
        >
          <BarList
            items={(insights?.byDepartment ?? []).slice(0, 6)}
            total={totalRows}
            activeLabel={filters.department}
            onSelect={(item) =>
              updateFilters({
                department: filters.department === item.label ? undefined : item.label,
                unit: undefined,
              })
            }
            emptyText="No staff in this result."
          />
        </InsightCard>
        {hasSkillFilter ? (
          <InsightCard
            title="Proficiency spread"
            subtitle="How strong the matching skills are across these staff."
          >
            <BarList
              items={[...(insights?.levelSpread ?? [])].reverse().map((item) => ({
                key: item.level,
                label: `L${item.level} · ${PROFICIENCY_LEVELS[item.level - 1].name}`,
                count: item.count,
              }))}
              emptyText="No matching skill records."
            />
          </InsightCard>
        ) : (
          <InsightCard
            title="Most common skills"
            subtitle="Skills held by staff in this result. Select a skill to find who has it."
          >
            <BarList
              items={(insights?.topSkills ?? []).slice(0, 6)}
              total={totalRows}
              onSelect={(item) => updateFilters({ skill_ids: [item.skillId] })}
              emptyText="No skills recorded for these staff yet."
            />
          </InsightCard>
        )}
      </div>

      <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <Table
          rowKey="STAFF_ID"
          columns={columns}
          dataSource={rows}
          loading={isPending || isFetching}
          scroll={{ x: 960 }}
          onRow={(row) => ({
            onClick: () => onOpenProfile(row.STAFF_ID),
            className: "cursor-pointer",
          })}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} staff`,
            className: "!px-4",
          }}
          locale={{
            emptyText: (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]">
                  <UserSearch size={22} />
                </span>
                <p className="text-sm font-semibold text-[#0f172a]">No staff match these filters</p>
                <p className="max-w-sm text-xs text-[#64748b]">
                  Try lowering the minimum level, choosing “Any skill”, or clearing a filter.
                </p>
                {activeChips.length > 0 && (
                  <Button size="small" onClick={() => onFiltersChange(DEFAULT_DIRECTORY_FILTERS)}>
                    Clear filters
                  </Button>
                )}
              </div>
            ),
          }}
        />
      </section>
    </div>
  );
}

SkillsDirectory.propTypes = {
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onOpenProfile: PropTypes.func.isRequired,
  onRecordSkill: PropTypes.func.isRequired,
};
