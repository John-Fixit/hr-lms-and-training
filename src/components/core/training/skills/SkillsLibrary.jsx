import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { Button, Input, Modal, Segmented, Switch, Table, Tooltip } from "antd";
import { BookOpen, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  useDeleteSkill,
  useGetSkillCategories,
  useGetSkills,
  useUpdateSkill,
} from "../../../../API/trainingSkills";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import SkillFormDrawer from "./SkillFormDrawer";
import { CategoryTag, ProficiencyMeter } from "./SkillBadges";
import { getCategoryColor } from "./skillsConstants";

export default function SkillsLibrary({ onViewStaff }) {
  const { data: skills = [], isPending } = useGetSkills();
  const { data: categories = [] } = useGetSkillCategories();
  const { mutateAsync: updateSkill, isPending: toggling, variables: toggleVars } = useUpdateSkill();
  const { mutateAsync: deleteSkill } = useDeleteSkill();
  const [modal, modalContext] = Modal.useModal();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("active");
  const [drawer, setDrawer] = useState({ open: false, skill: null });

  const categoryCounts = useMemo(() => {
    const counts = new Map();
    skills.forEach((s) => counts.set(s.CATEGORY_ID, (counts.get(s.CATEGORY_ID) ?? 0) + 1));
    return counts;
  }, [skills]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return skills.filter(
      (s) =>
        (category === "all" || s.CATEGORY_ID === category) &&
        (status === "all" || (status === "active" ? s.IS_ACTIVE : !s.IS_ACTIVE)) &&
        (!term ||
          s.SKILL_NAME.toLowerCase().includes(term) ||
          s.DESCRIPTION?.toLowerCase().includes(term)),
    );
  }, [skills, search, category, status]);

  const toggleActive = async (skill, checked) => {
    try {
      await updateSkill({ skill_id: skill.SKILL_ID, is_active: checked });
      successToast(`${skill.SKILL_NAME} ${checked ? "is active again" : "has been switched off"}.`);
    } catch (err) {
      errorToast(err?.response?.data?.message ?? err?.message);
    }
  };

  const handleDelete = (skill) => {
    if (skill.STAFF_COUNT > 0) {
      modal.info({
        title: `${skill.SKILL_NAME} is in use`,
        content: `${skill.STAFF_COUNT} staff have this skill on their profile. Switch it off instead so their records are kept.`,
      });
      return;
    }
    modal.confirm({
      title: `Delete ${skill.SKILL_NAME}?`,
      content: "This permanently removes the skill from the library.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await deleteSkill({ skill_id: skill.SKILL_ID });
          successToast(res?.message);
        } catch (err) {
          errorToast(err?.response?.data?.message ?? err?.message);
        }
      },
    });
  };

  const showCounts = true;
  const columns = [
    {
      title: "Skill",
      key: "skill",
      sorter: (a, b) => a.SKILL_NAME.localeCompare(b.SKILL_NAME),
      render: (_, skill) => (
        <div className={clsx("max-w-md", !skill.IS_ACTIVE && "opacity-60")}>
          <p className="text-[13px] font-semibold text-[#0f172a]">{skill.SKILL_NAME}</p>
          {skill.DESCRIPTION && (
            <p className="line-clamp-1 text-xs text-[#64748b]">{skill.DESCRIPTION}</p>
          )}
        </div>
      ),
    },
    {
      title: "Category",
      key: "category",
      sorter: (a, b) => (a.CATEGORY_NAME ?? "").localeCompare(b.CATEGORY_NAME ?? ""),
      render: (_, skill) => <CategoryTag categoryId={skill.CATEGORY_ID} name={skill.CATEGORY_NAME} />,
    },
    showCounts && {
      title: "Staff",
      key: "staff",
      align: "center",
      sorter: (a, b) => (a.STAFF_COUNT ?? 0) - (b.STAFF_COUNT ?? 0),
      defaultSortOrder: "descend",
      render: (_, skill) =>
        skill.STAFF_COUNT > 0 && skill.IS_ACTIVE ? (
          <Tooltip title="See who has this skill">
            <Button
              type="link"
              size="small"
              className="!px-1 tabular-nums"
              onClick={() => onViewStaff(skill.SKILL_ID)}
            >
              {skill.STAFF_COUNT}
            </Button>
          </Tooltip>
        ) : (
          <span className="tabular-nums text-[#94a3b8]">{skill.STAFF_COUNT ?? "—"}</span>
        ),
    },
    showCounts && {
      title: "Average level",
      key: "avg",
      sorter: (a, b) => (a.AVERAGE_LEVEL ?? 0) - (b.AVERAGE_LEVEL ?? 0),
      render: (_, skill) =>
        skill.STAFF_COUNT && skill.AVERAGE_LEVEL != null ? (
          <div className="flex items-center gap-2">
            <ProficiencyMeter level={Math.round(skill.AVERAGE_LEVEL)} size="sm" />
            <span className="text-xs tabular-nums text-[#475569]">{skill.AVERAGE_LEVEL.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-[#94a3b8]">—</span>
        ),
    },
    showCounts && {
      title: "Verified",
      key: "verified",
      align: "center",
      render: (_, skill) =>
        skill.STAFF_COUNT && skill.VERIFIED_COUNT != null ? (
          <span className="text-xs tabular-nums text-[#475569]">
            {Math.round((skill.VERIFIED_COUNT / skill.STAFF_COUNT) * 100)}%
          </span>
        ) : (
          <span className="text-[#94a3b8]">—</span>
        ),
    },
    {
      title: "Active",
      key: "active",
      align: "center",
      render: (_, skill) => (
        <Switch
          size="small"
          checked={Boolean(skill.IS_ACTIVE)}
          loading={toggling && toggleVars?.skill_id === skill.SKILL_ID}
          onChange={(checked) => toggleActive(skill, checked)}
          aria-label={`${skill.SKILL_NAME} active`}
        />
      ),
    },
    {
      title: <span className="sr-only">Actions</span>,
      key: "actions",
      align: "right",
      render: (_, skill) => (
        <div className="flex justify-end gap-1">
          <Tooltip title="Edit">
            <Button
              type="text"
              aria-label={`Edit ${skill.SKILL_NAME}`}
              icon={<Pencil size={15} className="text-[#475569]" />}
              onClick={() => setDrawer({ open: true, skill })}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              aria-label={`Delete ${skill.SKILL_NAME}`}
              icon={<Trash2 size={15} className="text-[#D92D20]" />}
              onClick={() => handleDelete(skill)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const categoryPills = [
    { id: "all", name: "All", count: skills.length },
    ...categories.map((c) => ({
      id: c.CATEGORY_ID,
      name: c.CATEGORY_NAME,
      count: categoryCounts.get(c.CATEGORY_ID) ?? 0,
    })),
  ];

  return (
    <div className="space-y-4">
      {modalContext}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          allowClear
          size="large"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search skills"
          prefix={<Search size={15} className="text-[#94a3b8]" />}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            value={status}
            onChange={setStatus}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "all", label: "All" },
            ]}
          />
          <Button type="primary" icon={<Plus size={15} />} onClick={() => setDrawer({ open: true, skill: null })}>
            Add skill
          </Button>
        </div>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Skill categories">
        {categoryPills.map((pill) => {
          const active = category === pill.id;
          const color = pill.id === "all" ? "#0f172a" : getCategoryColor(pill.id);
          return (
            <button
              key={pill.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(pill.id)}
              className={clsx(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium outline-none transition-all",
                "focus-visible:ring-2 focus-visible:ring-[#6366F1]/40",
                active ? "text-white shadow-sm" : "border-[#e2e8f0] bg-white text-[#475569] hover:border-[#D0D5DD]",
              )}
              style={active ? { backgroundColor: color, borderColor: color } : undefined}
            >
              {pill.name}
              <span className={clsx("tabular-nums", active ? "text-white/80" : "text-[#94a3b8]")}>
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <Table
          rowKey="SKILL_ID"
          columns={columns.filter(Boolean)}
          dataSource={filtered}
          loading={isPending}
          scroll={{ x: 860 }}
          pagination={{ pageSize: 12, hideOnSinglePage: true, className: "!px-4" }}
          locale={{
            emptyText: (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]">
                  <BookOpen size={22} />
                </span>
                <p className="text-sm font-semibold text-[#0f172a]">No skills found</p>
                <p className="text-xs text-[#64748b]">
                  {search ? "Try a different search term." : "Add the first skill in this category."}
                </p>
              </div>
            ),
          }}
        />
      </section>

      <SkillFormDrawer
        open={drawer.open}
        skill={drawer.skill}
        onClose={() => setDrawer({ open: false, skill: null })}
      />
    </div>
  );
}

SkillsLibrary.propTypes = {
  onViewStaff: PropTypes.func.isRequired,
};
