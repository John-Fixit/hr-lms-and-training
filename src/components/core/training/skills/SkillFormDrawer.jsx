import { useEffect } from "react";
import PropTypes from "prop-types";
import { Button, Drawer, Form, Input, Select, Switch } from "antd";
import {
  useCreateSkill,
  useGetSkillCategories,
  useUpdateSkill,
} from "../../../../API/trainingSkills";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { CategoryTag } from "./SkillBadges";

export default function SkillFormDrawer({ open, onClose, skill, onCreated }) {
  const [form] = Form.useForm();
  const isEdit = Boolean(skill);
  const { data: categories = [] } = useGetSkillCategories();
  const { mutateAsync: createSkill, isPending: creating } = useCreateSkill();
  const { mutateAsync: updateSkill, isPending: updating } = useUpdateSkill();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      skill_name: skill?.SKILL_NAME ?? "",
      category_id: skill?.CATEGORY_ID,
      description: skill?.DESCRIPTION ?? "",
      is_active: skill ? Boolean(skill.IS_ACTIVE) : true,
    });
  }, [open, skill, form]);

  const handleSubmit = async (values) => {
    try {
      const payload = { ...values, skill_name: values.skill_name.trim() };
      const res = isEdit
        ? await updateSkill({ skill_id: skill.SKILL_ID, ...payload })
        : await createSkill(payload);
      successToast(res?.message);
      if (!isEdit) {
        onCreated?.(res?.data?.SKILL_ID ?? res?.SKILL_ID);
      }
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
      title={<span className="font-helvetica">{isEdit ? "Edit skill" : "Add skill to library"}</span>}
      classNames={{ body: "font-helvetica", footer: "!px-6 !py-3" }}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={creating || updating} onClick={() => form.submit()}>
            {isEdit ? "Save changes" : "Add skill"}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="skill_name"
          label="Skill name"
          rules={[
            { required: true, whitespace: true, message: "Give the skill a name." },
            { max: 80, message: "Keep the name under 80 characters." },
          ]}
        >
          <Input size="large" placeholder="e.g. Safety Management Systems (SMS)" />
        </Form.Item>
        <Form.Item
          name="category_id"
          label="Category"
          rules={[{ required: true, message: "Choose a category so the skill can be grouped." }]}
        >
          <Select
            size="large"
            placeholder="Choose a category"
            virtual={false}
            options={categories.map((c) => ({
              value: c.CATEGORY_ID,
              label: <CategoryTag categoryId={c.CATEGORY_ID} name={c.CATEGORY_NAME} />,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
          extra="Explain what the skill covers so assessors rate it consistently."
        >
          <Input.TextArea rows={4} maxLength={240} showCount />
        </Form.Item>
        <Form.Item
          name="is_active"
          label="Available for use"
          valuePropName="checked"
          extra="Inactive skills stay on existing staff records but can't be newly assigned or searched."
        >
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

SkillFormDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  skill: PropTypes.object,
  onCreated: PropTypes.func,
};
