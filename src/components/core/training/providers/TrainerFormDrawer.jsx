import { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Button, Drawer, Form, Input, InputNumber, Segmented, Select } from "antd";
import { Minus, Plus } from "lucide-react";
import { useCreateTrainer, useGetProviders, useUpdateTrainer } from "../../../../API/trainingProviders";
import { useGetSkillStaffOptions, useGetSkills } from "../../../../API/trainingSkills";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { buildGroupedSkillOptions, staffFullName } from "../skills/skillsConstants";
import { TRAINER_TYPES } from "./providersConstants";

/**
 * Add or edit a trainer. `presetProvider` (from a provider's "Add trainer") fixes the provider
 * and the matching trainer type.
 */
export default function TrainerFormDrawer({ open, onClose, trainer, presetProvider }) {
  const [form] = Form.useForm();
  const isEdit = Boolean(trainer);
  const trainerType = Form.useWatch("trainer_type", form);
  const isInternal = trainerType === "INTERNAL";

  const { data: providers = [] } = useGetProviders();
  const { data: skills = [] } = useGetSkills();
  const { data: staff = [], isPending: staffLoading } = useGetSkillStaffOptions();
  const { mutateAsync: createTrainer, isPending: creating } = useCreateTrainer();
  const { mutateAsync: updateTrainer, isPending: updating } = useUpdateTrainer();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (trainer) {
      form.setFieldsValue({
        trainer_type: trainer.TRAINER_TYPE,
        staff_id: trainer.STAFF_ID ?? undefined,
        full_name: trainer.FULL_NAME,
        provider_id: trainer.PROVIDER_ID ?? undefined,
        title: trainer.TITLE,
        department: trainer.DEPARTMENT,
        email: trainer.EMAIL,
        phone: trainer.PHONE,
        expertise_skill_ids: trainer.EXPERTISE_SKILL_IDS,
        qualifications: trainer.QUALIFICATIONS?.length ? trainer.QUALIFICATIONS : [""],
        years_experience: trainer.YEARS_EXPERIENCE,
        bio: trainer.BIO,
      });
      return;
    }
    form.setFieldsValue({
      trainer_type: presetProvider?.PROVIDER_TYPE === "INTERNAL" ? "INTERNAL" : "EXTERNAL",
      provider_id: presetProvider?.PROVIDER_ID,
      expertise_skill_ids: [],
      qualifications: [""],
      years_experience: 0,
    });
  }, [open, trainer, presetProvider, form]);

  const providerOptions = useMemo(
    () =>
      providers
        .filter(
          (p) =>
            (p.STATUS === "ACTIVE" || p.PROVIDER_ID === trainer?.PROVIDER_ID) &&
            (isInternal ? p.PROVIDER_TYPE === "INTERNAL" : p.PROVIDER_TYPE !== "INTERNAL"),
        )
        .map((p) => ({ value: p.PROVIDER_ID, label: p.PROVIDER_NAME })),
    [providers, isInternal, trainer?.PROVIDER_ID],
  );

  const staffOptions = useMemo(
    () =>
      staff.map((s) => ({
        value: s.STAFF_ID,
        label: `${staffFullName(s)} · ${s.STAFF_NUMBER}`,
        searchText: `${staffFullName(s)} ${s.STAFF_NUMBER} ${s.DEPARTMENT}`,
      })),
    [staff],
  );

  const handleStaffChange = (staffId) => {
    const member = staff.find((s) => s.STAFF_ID === staffId);
    form.setFieldsValue({
      full_name: member ? staffFullName(member) : "",
      title: member?.DESIGNATION ?? "",
      department: member?.DEPARTMENT ?? "",
    });
  };

  const handleTypeChange = () => {
    // Providers and identity fields differ by type, so start those fresh.
    form.setFieldsValue({ provider_id: undefined, staff_id: undefined, full_name: "", title: "", department: "" });
  };

  const handleSubmit = async (values) => {
    try {
      const member = staff.find((s) => s.STAFF_ID === values.staff_id);
      const payload = {
        ...values,
        status: trainer?.STATUS ?? "ACTIVE",
        full_name: values.full_name?.trim() || (member ? staffFullName(member) : ""),
      };
      const res = isEdit
        ? await updateTrainer({ trainer_id: trainer.TRAINER_ID, ...payload })
        : await createTrainer(payload);
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
          <p className="text-base font-semibold">{isEdit ? `Edit ${trainer.FULL_NAME}` : "Add a trainer"}</p>
          {presetProvider && !isEdit && (
            <p className="text-xs font-normal text-[#64748b]">{presetProvider.PROVIDER_NAME}</p>
          )}
        </div>
      }
      classNames={{ body: "font-helvetica", footer: "!px-6 !py-3" }}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={creating || updating} onClick={() => form.submit()}>
            {isEdit ? "Save changes" : "Add trainer"}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} scrollToFirstError>
        <Form.Item name="trainer_type" label="Trainer type">
          <Segmented
            block
            disabled={isEdit || Boolean(presetProvider)}
            options={TRAINER_TYPES.map(({ value, label }) => ({ value, label }))}
            onChange={handleTypeChange}
          />
        </Form.Item>

        {isInternal ? (
          <>
            <Form.Item
              name="staff_id"
              label="Staff member"
              rules={[{ required: true, message: "Choose the staff member who facilitates training." }]}
              extra="Name, designation and department come from their staff record."
            >
              <Select
                showSearch
                size="large"
                placeholder="Search by name or staff number"
                options={staffOptions}
                optionFilterProp="searchText"
                loading={staffLoading}
                disabled={isEdit}
                onChange={handleStaffChange}
                virtual={false}
              />
            </Form.Item>
            {/* Filled from the staff record. */}
            <Form.Item name="full_name" hidden>
              <Input />
            </Form.Item>
          </>
        ) : (
          <Form.Item
            name="full_name"
            label="Full name"
            rules={[{ required: true, whitespace: true, message: "Enter the trainer's name." }]}
          >
            <Input size="large" placeholder="e.g. Dr. Amina Yusuf" maxLength={100} />
          </Form.Item>
        )}
        <Form.Item name="department" hidden>
          <Input />
        </Form.Item>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="provider_id"
            label={isInternal ? "Training unit (optional)" : "Provider"}
            rules={isInternal ? [] : [{ required: true, message: "External trainers must belong to a provider." }]}
          >
            <Select
              allowClear={isInternal}
              showSearch
              optionFilterProp="label"
              placeholder={isInternal ? "e.g. HR Training Unit" : "Choose a provider"}
              options={providerOptions}
              disabled={Boolean(presetProvider) && !isEdit}
              virtual={false}
            />
          </Form.Item>
          <Form.Item name="title" label={isInternal ? "Designation" : "Title / role"}>
            <Input placeholder="e.g. Lead SMS Instructor" maxLength={100} disabled={isInternal} />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: "email", message: "Enter a valid email address." }]}>
            <Input placeholder="name@example.com" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="+234 …" maxLength={30} />
          </Form.Item>
        </div>

        <Form.Item
          name="expertise_skill_ids"
          label="Can teach"
          extra="Skills from the Skills Library. Used to suggest trainers for a course."
          rules={[{ type: "array", min: 1, message: "Pick at least one skill this trainer can teach." }]}
        >
          <Select
            mode="multiple"
            showSearch
            optionFilterProp="label"
            placeholder="Choose skills"
            options={buildGroupedSkillOptions(skills)}
            virtual={false}
            maxTagCount="responsive"
          />
        </Form.Item>

        <p className="mb-2 text-sm text-[#0f172a]">Qualifications</p>
        <Form.List name="qualifications">
          {(fields, { add, remove }) => (
            <div className="mb-6 space-y-2">
              {fields.map((field) => (
                <div key={field.key} className="flex gap-2">
                  <Form.Item {...field} className="!mb-0 flex-1">
                    <Input placeholder="e.g. ICAO TRAINAIR PLUS Instructor" maxLength={120} />
                  </Form.Item>
                  <Button
                    aria-label="Remove qualification"
                    icon={<Minus size={14} />}
                    onClick={() => remove(field.name)}
                    disabled={fields.length === 1}
                  />
                </div>
              ))}
              <Button type="dashed" icon={<Plus size={14} />} onClick={() => add("")} disabled={fields.length >= 8}>
                Add qualification
              </Button>
            </div>
          )}
        </Form.List>

        <Form.Item
          name="years_experience"
          label="Years of training experience"
          rules={[{ type: "number", min: 0, max: 60, message: "Between 0 and 60." }]}
        >
          <InputNumber min={0} max={60} className="!w-40" />
        </Form.Item>
        <Form.Item name="bio" label="Short bio" className="!mb-0">
          <Input.TextArea rows={3} maxLength={400} showCount />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

TrainerFormDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  trainer: PropTypes.object,
  presetProvider: PropTypes.object,
};
