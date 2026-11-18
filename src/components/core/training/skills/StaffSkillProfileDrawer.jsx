import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Button, Drawer, Dropdown, Empty, Modal, Skeleton } from "antd";
import {
  Briefcase,
  Check,
  ChevronDown,
  History,
  MapPin,
  MoreHorizontal,
  Paperclip,
  Plus,
  X,
} from "lucide-react";
import {
  useGetStaffSkillProfile,
  useRemoveStaffSkill,
  useSetStaffSkillStatus,
} from "../../../../API/trainingSkills";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import {
  CategoryTag,
  ProficiencyMeter,
  StaffAvatar,
  VerificationBadge,
} from "./SkillBadges";
import { getLevelName, getSourceLabel, staffFullName } from "./skillsConstants";

const formatDate = (value) => (value ? dayjs(value).format("D MMM YYYY") : "—");

function SkillRecord({ record, onEdit, onVerify, onReject, onRemove, busy }) {
  const [showHistory, setShowHistory] = useState(false);
  const history = record.HISTORY ?? [];

  return (
    <li className="rounded-lg border border-[#e2e8f0] bg-white p-3.5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[#0f172a]">{record.SKILL_NAME}</p>
            <VerificationBadge status={record.STATUS} />
            {!record.SKILL_IS_ACTIVE && (
              <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11px] text-[#64748b]">
                Inactive skill
              </span>
            )}
          </div>
          <div className="mt-2">
            <ProficiencyMeter level={record.LEVEL} showLabel />
          </div>
        </div>
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              { key: "edit", label: "Update level" },
              { key: "remove", label: "Remove from profile", danger: true },
            ],
            onClick: ({ key }) => (key === "edit" ? onEdit(record) : onRemove(record)),
          }}
        >
          <Button
            type="text"
            size="small"
            aria-label={`More actions for ${record.SKILL_NAME}`}
            icon={<MoreHorizontal size={16} />}
          />
        </Dropdown>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
        {record.YEARS_EXPERIENCE != null && (
          <div>
            <dt className="text-[#94a3b8]">Experience</dt>
            <dd className="text-[#344054]">
              {record.YEARS_EXPERIENCE} yr{record.YEARS_EXPERIENCE === 1 ? "" : "s"}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-[#94a3b8]">Assessed by</dt>
          <dd className="truncate text-[#344054]">
            {getSourceLabel(record.SOURCE)}
            {record.SOURCE !== "SELF" && record.ASSESSED_BY ? ` · ${record.ASSESSED_BY}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-[#94a3b8]">Last updated</dt>
          <dd className="text-[#344054]">{formatDate(record.ASSESSED_AT)}</dd>
        </div>
      </dl>

      {(record.EVIDENCE_NAME || record.NOTE) && (
        <div className="mt-2.5 space-y-1 text-xs text-[#475569]">
          {record.EVIDENCE_NAME && (
            <p className="flex items-center gap-1.5">
              <Paperclip size={12} /> {record.EVIDENCE_NAME}
            </p>
          )}
          {record.NOTE && <p className="italic">“{record.NOTE}”</p>}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {history.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowHistory((open) => !open)}
            aria-expanded={showHistory}
            className="inline-flex items-center gap-1 rounded text-xs font-medium text-[#64748b] outline-none hover:text-[#0f172a] focus-visible:ring-2 focus-visible:ring-[#6366F1]/40"
          >
            <History size={12} />
            {showHistory ? "Hide" : "Show"} history ({history.length})
            <ChevronDown
              size={12}
              className={`transition-transform ${showHistory ? "rotate-180" : ""}`}
            />
          </button>
        ) : (
          <span />
        )}
        {record.STATUS === "PENDING" && (
          <div className="flex gap-2">
            <Button size="small" icon={<X size={13} />} onClick={() => onReject(record)} disabled={busy}>
              Reject
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<Check size={13} />}
              onClick={() => onVerify(record)}
              loading={busy}
            >
              Verify
            </Button>
          </div>
        )}
      </div>

      {showHistory && (
        <ol className="mt-3 space-y-2 border-l-2 border-[#e2e8f0] pl-3">
          {history.map((entry, index) => (
            <li key={`${entry.ASSESSED_AT}-${index}`} className="text-xs text-[#475569]">
              <span className="font-medium text-[#344054]">
                L{entry.LEVEL} · {getLevelName(entry.LEVEL)}
              </span>{" "}
              — {getSourceLabel(entry.SOURCE)}
              {entry.ASSESSED_BY ? ` (${entry.ASSESSED_BY})` : ""}, {formatDate(entry.ASSESSED_AT)}
            </li>
          ))}
        </ol>
      )}
    </li>
  );
}

SkillRecord.propTypes = {
  record: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onVerify: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  busy: PropTypes.bool,
};

export default function StaffSkillProfileDrawer({ staffId, open, onClose, onAddSkill, onEditSkill }) {
  const { data: profile, isPending } = useGetStaffSkillProfile(open ? staffId : null);
  const { mutateAsync: setStatus, isPending: statusPending, variables } = useSetStaffSkillStatus();
  const { mutateAsync: removeSkill } = useRemoveStaffSkill();
  const [modal, modalContext] = Modal.useModal();

  const grouped = useMemo(() => {
    const groups = new Map();
    (profile?.SKILLS ?? []).forEach((record) => {
      if (!groups.has(record.CATEGORY_NAME)) {
        groups.set(record.CATEGORY_NAME, { categoryId: record.CATEGORY_ID, records: [] });
      }
      groups.get(record.CATEGORY_NAME).records.push(record);
    });
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, group]) => ({
        name,
        ...group,
        records: group.records.sort((a, b) => b.LEVEL - a.LEVEL),
      }));
  }, [profile?.SKILLS]);

  const skills = profile?.SKILLS ?? [];
  const verifiedCount = skills.filter((s) => s.STATUS === "VERIFIED").length;
  const averageLevel = skills.length
    ? (skills.reduce((sum, s) => sum + s.LEVEL, 0) / skills.length).toFixed(1)
    : "—";

  const handleStatus = async (record, status) => {
    try {
      const res = await setStatus({ staff_skill_id: record.STAFF_SKILL_ID, status });
      successToast(res?.message);
    } catch (err) {
      errorToast(err?.response?.data?.message ?? err?.message);
    }
  };

  const handleRemove = (record) => {
    modal.confirm({
      title: `Remove ${record.SKILL_NAME}?`,
      content: "This removes the skill and its assessment history from this staff profile.",
      okText: "Remove",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await removeSkill({ staff_skill_id: record.STAFF_SKILL_ID });
          successToast(res?.message);
        } catch (err) {
          errorToast(err?.response?.data?.message ?? err?.message);
        }
      },
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(720px, 100vw)"
      title={<span className="font-helvetica">Skills profile</span>}
      classNames={{ body: "bg-[#F9FAFB] !p-4 sm:!p-6", header: "font-helvetica" }}
      destroyOnClose
    >
      {modalContext}
      {isPending ? (
        <Skeleton active avatar paragraph={{ rows: 6 }} />
      ) : profile ? (
        <div className="space-y-5 font-helvetica">
          <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3.5">
                <StaffAvatar firstName={profile.FIRST_NAME} lastName={profile.LAST_NAME} size={52} />
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold uppercase text-[#0f172a]">
                    {staffFullName(profile)}
                  </h3>
                  <p className="text-[13px] text-[#475569]">{profile.DESIGNATION}</p>
                  <p className="text-xs text-[#64748b]">
                    {profile.STAFF_NUMBER} · Grade {profile.GRADE}, Step {profile.STEP}
                  </p>
                </div>
              </div>
              <Button type="primary" icon={<Plus size={15} />} onClick={() => onAddSkill(profile)}>
                Add skill
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-[#475569]">
              <span className="flex items-center gap-1.5">
                <Briefcase size={13} className="text-[#94a3b8]" />
                {profile.DEPARTMENT} · {profile.UNIT}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-[#94a3b8]" />
                {profile.DIRECTORATE} · {profile.REGION}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 divide-x divide-[#e2e8f0] rounded-lg bg-[#F9FAFB]">
              {[
                { label: "Skills", value: skills.length },
                { label: "Verified", value: verifiedCount },
                { label: "Avg. level", value: averageLevel },
              ].map((stat) => (
                <div key={stat.label} className="px-3 py-2.5 text-center">
                  <p className="text-lg font-bold tabular-nums text-[#0f172a]">{stat.value}</p>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#64748b]">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {grouped.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D0D5DD] bg-white py-10">
              <Empty
                description={
                  <span className="text-sm text-[#64748b]">
                    No skills recorded for this staff member yet.
                  </span>
                }
              >
                <Button type="primary" icon={<Plus size={15} />} onClick={() => onAddSkill(profile)}>
                  Record first skill
                </Button>
              </Empty>
            </div>
          ) : (
            grouped.map((group) => (
              <section key={group.name}>
                <div className="mb-2 flex items-center gap-2">
                  <CategoryTag categoryId={group.categoryId} name={group.name} />
                  <span className="text-xs text-[#94a3b8]">{group.records.length}</span>
                </div>
                <ul className="space-y-2.5">
                  {group.records.map((record) => (
                    <SkillRecord
                      key={record.STAFF_SKILL_ID}
                      record={record}
                      busy={statusPending && variables?.staff_skill_id === record.STAFF_SKILL_ID}
                      onEdit={(item) => onEditSkill(profile, item)}
                      onVerify={(item) => handleStatus(item, "VERIFIED")}
                      onReject={(item) => handleStatus(item, "REJECTED")}
                      onRemove={handleRemove}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      ) : (
        <Empty description="Staff profile could not be loaded." />
      )}
    </Drawer>
  );
}

StaffSkillProfileDrawer.propTypes = {
  staffId: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAddSkill: PropTypes.func.isRequired,
  onEditSkill: PropTypes.func.isRequired,
};
