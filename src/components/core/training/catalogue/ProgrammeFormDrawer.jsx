import { useEffect } from "react";
import PropTypes from "prop-types";
import { Button, Drawer, Form, Input } from "antd";
import { useCreateProgramme, useUpdateProgramme } from "../../../../API/trainingCatalogue";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";

export default function ProgrammeFormDrawer({ open, onClose, programme }) {
  const [form] = Form.useForm();
  const isEdit = Boolean(programme);
  const { mutateAsync: createProgramme, isPending: creating } = useCreateProgramme();
  const { mutateAsync: updateProgramme, isPending: updating } = useUpdateProgramme();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      programme_name: programme?.PROGRAMME_NAME ?? "",
      description: programme?.DESCRIPTION ?? "",
      owner: programme?.OWNER ?? "",
    });
  }, [open, programme, form]);

  const handleSubmit = async (values) => {
    try {
      const res = isEdit
        ? await updateProgramme({ programme_id: programme.PROGRAMME_ID, ...values })
        : await createProgramme({ ...values, status: "ACTIVE" });
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
      width="min(520px, 100vw)"
      title={<span className="font-helvetica">{isEdit ? "Edit programme" : "New programme"}</span>}
      classNames={{ body: "font-helvetica", footer: "!px-6 !py-3" }}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={creating || updating} onClick={() => form.submit()}>
            {isEdit ? "Save changes" : "Create programme"}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="programme_name"
          label="Programme name"
          rules={[
            { required: true, whitespace: true, message: "Give the programme a name." },
            { max: 100, message: "Keep the name under 100 characters." },
          ]}
        >
          <Input size="large" placeholder="e.g. Leadership & Management Development" />
        </Form.Item>
        <Form.Item name="description" label="Description" extra="What the programme develops, and for whom.">
          <Input.TextArea rows={4} maxLength={400} showCount />
        </Form.Item>
        <Form.Item
          name="owner"
          label="Programme owner"
          extra="The officer or office responsible for this programme. Will become a staff picker once connected."
        >
          <Input placeholder="e.g. Head, Training & Development" maxLength={100} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

ProgrammeFormDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  programme: PropTypes.object,
};
