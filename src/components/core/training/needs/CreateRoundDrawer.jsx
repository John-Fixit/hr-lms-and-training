import { useEffect } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Button, Checkbox, DatePicker, Drawer, Form, Input, InputNumber, Select, Switch } from "antd";
import { useGetSkillFilterOptions } from "../../../../API/trainingSkills";
import { useGetSkillStaffOptions } from "../../../../API/trainingSkills";
import { useCreateTnaRound } from "../../../../API/trainingNeeds";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";

/** Start a new needs assessment exercise. Departments listed here each get a submission to fill. */
export default function CreateRoundDrawer({ open, onClose, onCreated, hasOpenRound }) {
  const [form] = Form.useForm();
  const { data: options } = useGetSkillFilterOptions();
  const { data: staff = [] } = useGetSkillStaffOptions();
  const { mutateAsync: createRound, isPending } = useCreateTnaRound();
  const departmentOptions = options?.departmentRecords?.length
    ? options.departmentRecords.map((department) => ({ value: department.id, label: department.name }))
    : (options?.departments ?? []).map((department) => ({ value: department, label: department }));
  const departments = departmentOptions.map((option) => option.value);
  const chosen = Form.useWatch("departments", form) ?? [];

  useEffect(() => {
    if (!open) return;
    const year = dayjs().year() + 1;
    form.resetFields();
    form.setFieldsValue({
      title: `${year} Training Needs Assessment`,
      year,
      start_date: dayjs(),
      deadline: dayjs().add(30, "day"),
      responsible_officer: undefined,
      departments,
      open_now: !hasOpenRound,
    });
    // `departments` is derived from options; seeding once per open is intended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form, hasOpenRound]);

  const handleSubmit = async (values) => {
    try {
      const res = await createRound({
        ...values,
        start_date: values.start_date.format("YYYY-MM-DD"),
        deadline: values.deadline.format("YYYY-MM-DD"),
        status: values.open_now ? "OPEN" : "DRAFT",
      });
      successToast(res?.message);
      onCreated?.(res?.data?.TNA_ID);
      onClose();
    } catch (err) {
      errorToast(err?.response?.data?.message ?? err?.message);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(620px, 100vw)"
      title={<span className="font-helvetica">New needs assessment</span>}
      classNames={{ body: "font-helvetica", footer: "!px-6 !py-3" }}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={isPending} onClick={() => form.submit()}>Create assessment</Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} scrollToFirstError>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-[1fr_120px]">
          <Form.Item name="title" label="Title" rules={[{ required: true, whitespace: true, message: "Give the assessment a title." }]}>
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="year" label="Plan year" rules={[{ required: true, message: "Set the year." }]}>
            <InputNumber min={2020} max={2100} className="!w-full" />
          </Form.Item>
        </div>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} maxLength={300} placeholder="What departments are being asked to do." />
        </Form.Item>
        <Form.Item name="objectives" label="Objectives">
          <Input.TextArea rows={2} maxLength={400} placeholder="e.g. Prioritise safety-critical and regulatory gaps for the 2027 plan." />
        </Form.Item>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item name="start_date" label="Opens on" rules={[{ required: true, message: "Pick a start date." }]}>
            <DatePicker className="!w-full" format="D MMM YYYY" />
          </Form.Item>
          <Form.Item
            name="deadline"
            label="Submission deadline"
            dependencies={["start_date"]}
            rules={[
              { required: true, message: "Pick a deadline." },
              ({ getFieldValue }) => ({
                validator: (_, v) =>
                  v && getFieldValue("start_date") && v.isBefore(getFieldValue("start_date"), "day")
                    ? Promise.reject(new Error("The deadline is before the start."))
                    : Promise.resolve(),
              }),
            ]}
          >
            <DatePicker className="!w-full" format="D MMM YYYY" />
          </Form.Item>
        </div>
        <Form.Item name="responsible_officer" label="Responsible officer">
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Choose a staff member"
            options={staff.map((member) => ({
              value: member.STAFF_ID,
              label: `${member.LAST_NAME ?? ""} ${member.FIRST_NAME ?? ""} · ${member.STAFF_NUMBER ?? ""}`.trim(),
            }))}
          />
        </Form.Item>
        <Form.Item
          name="departments"
          label={
            <span className="flex w-full items-center justify-between gap-4">
              Departments taking part
              <Checkbox
                checked={chosen.length === departments.length && departments.length > 0}
                indeterminate={chosen.length > 0 && chosen.length < departments.length}
                onChange={(e) => form.setFieldValue("departments", e.target.checked ? departments : [])}
              >
                All
              </Checkbox>
            </span>
          }
          rules={[{ type: "array", min: 1, message: "Choose at least one department." }]}
        >
          <Select mode="multiple" allowClear virtual={false} options={departmentOptions} maxTagCount="responsive" />
        </Form.Item>
        <Form.Item
          name="open_now"
          label="Open to departments now"
          valuePropName="checked"
          extra={hasOpenRound ? "Another assessment is open. Close it before opening this one, or save this as a draft." : "Departments are notified as soon as it opens."}
          className="!mb-0"
        >
          <Switch disabled={hasOpenRound} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

CreateRoundDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func,
  hasOpenRound: PropTypes.bool,
};
