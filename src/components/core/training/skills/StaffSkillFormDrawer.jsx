import { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { Button, Drawer, Form, Input, InputNumber, Segmented, Select, Upload } from "antd";
import { Paperclip } from "lucide-react";
import {
  useGetSkillStaffOptions,
  useGetSkills,
  useGetStaffSkillProfile,
  useSaveStaffSkill,
} from "../../../../API/trainingSkills";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import {
  PROFICIENCY_LEVELS,
  SKILL_SOURCES,
  buildGroupedSkillOptions,
  staffFullName,
} from "./skillsConstants";

/** Accessible 1–5 proficiency picker, used as a controlled antd Form field. */
function LevelPicker({ value, onChange, id }) {
  const handleKeyDown = (event) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const next = Math.min(5, Math.max(1, (value ?? 0) + step));
    onChange?.(next);
    event.currentTarget.parentElement?.querySelector(`[data-level="${next}"]`)?.focus();
  };

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label="Proficiency level"
      className="grid grid-cols-1 gap-2 sm:grid-cols-5"
    >
      {PROFICIENCY_LEVELS.map((item) => {
        const selected = value === item.level;
        return (
          <button
            key={item.level}
            type="button"
            role="radio"
            aria-checked={selected}
            data-level={item.level}
            tabIndex={selected || (!value && item.level === 1) ? 0 : -1}
            onClick={() => onChange?.(item.level)}
            onKeyDown={handleKeyDown}
            className={clsx(
              "flex items-start gap-3 rounded-lg border p-3 text-left outline-none transition-all sm:flex-col sm:gap-1",
              "focus-visible:ring-2 focus-visible:ring-[#6366F1]/40",
              selected
                ? "border-[#6366F1] bg-[#6366F1]/5 shadow-[0_0_0_1px_#6366F1]"
                : "border-[#e2e8f0] bg-white hover:border-[#6366F1]/50",
            )}
          >
            <span
              className={clsx(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                selected ? "bg-[#6366F1] text-white" : "bg-[#f1f5f9] text-[#475569]",
              )}
            >
              {item.level}
            </span>
            <span>
              <span className="block text-[13px] font-semibold text-[#0f172a]">{item.name}</span>
              <span className="block text-[11px] leading-snug text-[#64748b]">{item.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

LevelPicker.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
  id: PropTypes.string,
};

/**
 * Record a new skill for a staff member, or update an existing record's level.
 * `staff` presets the staff member; `record` switches the form to update mode.
 */
export default function StaffSkillFormDrawer({ open, onClose, staff, record }) {
  const [form] = Form.useForm();
  const isEdit = Boolean(record);
  const selectedStaffId = Form.useWatch("staff_id", form);

  const { data: skills = [] } = useGetSkills();
  const { data: staffOptions = [], isPending: staffLoading } = useGetSkillStaffOptions();
  const { data: profile } = useGetStaffSkillProfile(open ? selectedStaffId : null);
  const { mutateAsync: saveSkill, isPending: saving } = useSaveStaffSkill();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      staff_id: staff?.STAFF_ID,
      skill_id: record?.SKILL_ID,
      level: record?.LEVEL,
      years_experience: record?.YEARS_EXPERIENCE ?? 0,
      source: record ? "SUPERVISOR" : "HR",
      note: "",
      evidence: [],
    });
  }, [open, staff, record, form]);

  const heldSkillIds = useMemo(
    () => (isEdit ? [] : (profile?.SKILLS ?? []).map((s) => s.SKILL_ID)),
    [isEdit, profile?.SKILLS],
  );

  const skillOptions = useMemo(
    () => buildGroupedSkillOptions(skills, { disabledIds: heldSkillIds }),
    [skills, heldSkillIds],
  );

  const staffSelectOptions = useMemo(
    () =>
      staffOptions.map((item) => ({
        value: item.STAFF_ID,
        label: `${staffFullName(item)} · ${item.STAFF_NUMBER}`,
        searchText: `${staffFullName(item)} ${item.STAFF_NUMBER} ${item.DEPARTMENT}`,
      })),
    [staffOptions],
  );

  const handleSubmit = async (values) => {
    try {
      const res = await saveSkill({
        staff_skill_id: record?.STAFF_SKILL_ID,
        staff_id: values.staff_id,
        skill_id: values.skill_id,
        level: values.level,
        years_experience: values.years_experience ?? 0,
        source: values.source,
        note: values.note?.trim() ?? "",
        evidence_name: values.evidence?.[0]?.name,
      });
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
      width="min(640px, 100vw)"
      title={
        <div className="font-helvetica">
          <p className="text-base font-semibold">
            {isEdit ? `Update ${record?.SKILL_NAME}` : "Record a staff skill"}
          </p>
          {staff && (
            <p className="text-xs font-normal text-[#64748b]">
              {staffFullName(staff)} · {staff.DESIGNATION}
            </p>
          )}
        </div>
      }
      classNames={{ body: "font-helvetica", footer: "!px-6 !py-3" }}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {isEdit ? "Save new level" : "Record skill"}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" requiredMark onFinish={handleSubmit}>
        <Form.Item
          name="staff_id"
          label="Staff"
          rules={[{ required: true, message: "Select the staff member this skill belongs to." }]}
          hidden={Boolean(staff)}
        >
          <Select
            showSearch
            size="large"
            placeholder="Search by name or staff number"
            options={staffSelectOptions}
            optionFilterProp="searchText"
            loading={staffLoading}
            virtual={false}
            onChange={() => form.setFieldValue("skill_id", undefined)}
          />
        </Form.Item>

        <Form.Item
          name="skill_id"
          label="Skill"
          rules={[{ required: true, message: "Choose a skill from the library." }]}
          extra={
            !isEdit && heldSkillIds.length > 0
              ? "Skills this staff member already has are greyed out. Update them from their profile."
              : undefined
          }
        >
          <Select
            showSearch
            size="large"
            placeholder="Choose a skill"
            options={skillOptions}
            optionFilterProp="label"
            disabled={isEdit}
            virtual={false}
          />
        </Form.Item>

        <Form.Item
          name="level"
          label="Proficiency level"
          rules={[{ required: true, message: "Pick the level that best describes this staff member." }]}
          extra={isEdit ? `Current level is L${record?.LEVEL}. The old level is kept in the skill's history.` : undefined}
        >
          <LevelPicker />
        </Form.Item>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="years_experience"
            label="Years of experience"
            rules={[{ type: "number", min: 0, max: 50, message: "Enter a number between 0 and 50." }]}
          >
            <InputNumber min={0} max={50} className="!w-full" size="large" />
          </Form.Item>
          <Form.Item
            name="source"
            label="Assessed by"
            rules={[{ required: true, message: "Say who assessed this level." }]}
            extra="Self-declared skills stay pending until verified."
          >
            <Segmented block size="large" options={SKILL_SOURCES} />
          </Form.Item>
        </div>

        <Form.Item
          name="evidence"
          label="Evidence (optional)"
          valuePropName="fileList"
          getValueFromEvent={(event) => (Array.isArray(event) ? event : event?.fileList)}
          extra="Certificate, transcript or appraisal extract. PDF or image, up to 5 MB."
        >
          <Upload
            beforeUpload={() => false}
            maxCount={1}
            accept=".pdf,.png,.jpg,.jpeg"
          >
            <Button icon={<Paperclip size={14} />}>Attach file</Button>
          </Upload>
        </Form.Item>

        <Form.Item name="note" label="Note (optional)">
          <Input.TextArea
            rows={3}
            maxLength={300}
            showCount
            placeholder="e.g. Led the 2026 SMS audit for two operators."
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

StaffSkillFormDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  staff: PropTypes.object,
  record: PropTypes.object,
};
