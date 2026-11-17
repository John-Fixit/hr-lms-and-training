import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, Checkbox, Drawer, Input, Select, Tooltip } from "antd";
import { AlertTriangle, Search } from "lucide-react";
import { useGetSkillStaffOptions } from "../../../../API/trainingSkills";
import { useAddSessionParticipants, useGetEnrolmentEligibility } from "../../../../API/trainingSessions";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { StaffAvatar } from "../skills/SkillBadges";
import { staffFullName } from "../skills/skillsConstants";
import { ParticipantStatusBadge } from "./SessionBadges";

/** Pick staff to nominate, with eligibility warnings (grade, prerequisites, clashes, already completed). */
export default function AddParticipantsDrawer({ open, onClose, session }) {
  const { data: staff = [], isPending } = useGetSkillStaffOptions();
  const { mutateAsync: addParticipants, isPending: adding } = useAddSessionParticipants();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState();
  const [grade, setGrade] = useState();
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setDepartment(undefined);
    setGrade(undefined);
    setSelected([]);
  }, [open]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return staff.filter(
      (s) =>
        (!department || s.DEPARTMENT === department) &&
        (!grade || s.GRADE === grade) &&
        (!term || `${staffFullName(s)} ${s.STAFF_NUMBER} ${s.DESIGNATION}`.toLowerCase().includes(term)),
    );
  }, [staff, search, department, grade]);

  const visibleIds = useMemo(() => visible.map((s) => s.STAFF_ID), [visible]);
  const { data: eligibility = {} } = useGetEnrolmentEligibility(open ? session : null, visibleIds);

  const departments = [...new Set(staff.map((s) => s.DEPARTMENT))].sort();
  const grades = [...new Set(staff.map((s) => s.GRADE))].sort((a, b) => Number(a) - Number(b));
  const seatsLeft = Math.max(0, (session?.CAPACITY_MAX ?? 0) - (session?.ENROLLED ?? 0));
  const selectable = visible.filter((s) => !eligibility[s.STAFF_ID]?.ENROLMENT_STATUS);
  const allSelected = selectable.length > 0 && selectable.every((s) => selected.includes(s.STAFF_ID));

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () =>
    setSelected((prev) =>
      allSelected
        ? prev.filter((id) => !selectable.some((s) => s.STAFF_ID === id))
        : [...new Set([...prev, ...selectable.map((s) => s.STAFF_ID)])],
    );

  const flaggedSelected = selected.filter((id) => eligibility[id]?.FLAGS?.length).length;

  const handleAdd = async () => {
    try {
      const res = await addParticipants({ session_id: session.SESSION_ID, staff_ids: selected, source: "HR_NOMINATION" });
      successToast(res?.message);
      onClose();
    } catch (err) {
      errorToast(err?.response?.data?.message ?? err?.message);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(680px, 100vw)"
      title={
        <div className="font-helvetica">
          <p className="text-base font-semibold">Nominate participants</p>
          <p className="text-xs font-normal text-[#64748b]">
            {session?.COURSE_TITLE} · {seatsLeft} seat{seatsLeft === 1 ? "" : "s"} left
          </p>
        </div>
      }
      classNames={{ body: "font-helvetica !p-0", footer: "!px-6 !py-3" }}
      destroyOnClose
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-[#64748b]">
            {selected.length} selected
            {selected.length > seatsLeft ? ` · ${selected.length - seatsLeft} will go on the waitlist` : ""}
            {flaggedSelected ? ` · ${flaggedSelected} with warnings` : ""}
          </span>
          <div className="flex gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" disabled={!selected.length} loading={adding} onClick={handleAdd}>
              Nominate {selected.length || ""}
            </Button>
          </div>
        </div>
      }
    >
      <div className="sticky top-0 z-10 space-y-2 border-b border-[#e2e8f0] bg-white p-4">
        <Input
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, staff number or designation"
          prefix={<Search size={14} className="text-[#94a3b8]" />}
        />
        <div className="grid grid-cols-2 gap-2">
          <Select allowClear placeholder="Any department" value={department} onChange={setDepartment} options={departments.map((d) => ({ value: d, label: d }))} virtual={false} />
          <Select allowClear placeholder="Any grade" value={grade} onChange={setGrade} options={grades.map((g) => ({ value: g, label: `Grade ${g}` }))} virtual={false} />
        </div>
        <div className="flex items-center justify-between text-xs text-[#64748b]">
          <Checkbox checked={allSelected} indeterminate={!allSelected && selectable.some((s) => selected.includes(s.STAFF_ID))} onChange={toggleAll} disabled={!selectable.length}>
            Select all {selectable.length} shown
          </Checkbox>
          <span>{visible.length} staff</span>
        </div>
      </div>

      {isPending ? (
        <p className="p-6 text-sm text-[#64748b]">Loading staff…</p>
      ) : (
        <ul className="divide-y divide-[#f1f5f9]">
          {visible.map((s) => {
            const info = eligibility[s.STAFF_ID];
            const enrolled = info?.ENROLMENT_STATUS;
            const flags = info?.FLAGS ?? [];
            return (
              <li key={s.STAFF_ID}>
                <label className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-[#F9FAFB] ${enrolled ? "cursor-default opacity-60" : ""}`}>
                  <Checkbox
                    className="mt-2"
                    checked={selected.includes(s.STAFF_ID)}
                    disabled={Boolean(enrolled)}
                    onChange={() => toggle(s.STAFF_ID)}
                  />
                  <StaffAvatar firstName={s.FIRST_NAME} lastName={s.LAST_NAME} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold uppercase text-[#0f172a]">{staffFullName(s)}</p>
                    <p className="truncate text-xs text-[#64748b]">
                      {s.DESIGNATION} · {s.DEPARTMENT} · Grade {s.GRADE}
                    </p>
                    {flags.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {flags.map((f) => (
                          <li key={f.MESSAGE} className="flex items-center gap-1 text-[11px] text-[#b45309]">
                            <AlertTriangle size={11} className="shrink-0" /> {f.MESSAGE}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {enrolled && (
                    <Tooltip title="Already on this session">
                      <span><ParticipantStatusBadge status={enrolled} /></span>
                    </Tooltip>
                  )}
                </label>
              </li>
            );
          })}
          {!visible.length && <li className="p-6 text-center text-sm text-[#94a3b8]">No staff match.</li>}
        </ul>
      )}
    </Drawer>
  );
}

AddParticipantsDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  session: PropTypes.object,
};
