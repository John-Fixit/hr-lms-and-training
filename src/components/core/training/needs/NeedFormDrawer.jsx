import { useEffect } from "react";
import PropTypes from "prop-types";
import { Button, Drawer, Form, Input, InputNumber, Segmented, Select } from "antd";
import { useGetCatalogueCourses } from "../../../../API/trainingCatalogue";
import { useGetSkillStaffOptions, useGetSkills } from "../../../../API/trainingSkills";
import { useSaveTnaNeed } from "../../../../API/trainingNeeds";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { buildGroupedSkillOptions, staffFullName } from "../skills/skillsConstants";
import { NEED_SOURCES, PRIORITIES } from "./needsConstants";

const money = {
  formatter: (x) => `${x}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","),
  parser: (x) => x?.replace(/,/g, "") ?? "",
};

/**
 * Add or edit one training need in a department's submission.
 * `prefill` (from a skill-gap suggestion) = { course_id, skill_ids, staff_ids, source }.
 */
export default function NeedFormDrawer({ open, onClose, submission, need, prefill }) {
  const [form] = Form.useForm();
  const isEdit = Boolean(need);
  const mode = Form.useWatch("mode", form);
  const participants = Form.useWatch("participants", form);
  const courseId = Form.useWatch("course_id", form);

  const { data: courses = [] } = useGetCatalogueCourses();
  const { data: skills = [] } = useGetSkills();
  const { data: staff = [] } = useGetSkillStaffOptions();
  const { mutateAsync: saveNeed, isPending } = useSaveTnaNeed();
  const course = courses.find((c) => c.COURSE_ID === courseId);
  const deptStaff = staff.filter((s) => s.DEPARTMENT === submission?.DEPARTMENT);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (need) {
      form.setFieldsValue({
        mode: need.COURSE_ID ? "CATALOGUE" : "PROPOSED",
        course_id: need.COURSE_ID ?? undefined,
        proposed_title: need.PROPOSED_TITLE,
        skill_ids: need.SKILL_IDS,
        source: need.SOURCE,
        priority: need.PRIORITY,
        staff_ids: need.STAFF_IDS,
        participants: need.PARTICIPANTS,
        estimated_cost: need.ESTIMATED_COST,
        justification: need.JUSTIFICATION,
        expected_outcome: need.EXPECTED_OUTCOME,
      });
      return;
    }
    const picked = courses.find((c) => c.COURSE_ID === prefill?.course_id);
    const count = prefill?.staff_ids?.length || 1;
    form.setFieldsValue({
      mode: prefill && !prefill.course_id ? "PROPOSED" : "CATALOGUE",
      course_id: prefill?.course_id,
      skill_ids: prefill?.skill_ids ?? [],
      source: prefill?.source ?? "DEPARTMENT",
      priority: "MEDIUM",
      staff_ids: prefill?.staff_ids ?? [],
      participants: count,
      estimated_cost: picked ? picked.DEFAULT_COST * count : 0,
    });
    // Only re-run when the drawer opens for a different need/prefill, never mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, need, prefill, form]);

  // If courses load after opening from a suggestion, fill in the cost once.
  useEffect(() => {
    if (!open || need || !prefill?.course_id || !courses.length) return;
    if (form.getFieldValue("estimated_cost")) return;
    const picked = courses.find((c) => c.COURSE_ID === prefill.course_id);
    if (picked) form.setFieldValue("estimated_cost", picked.DEFAULT_COST * (form.getFieldValue("participants") || 1));
  }, [open, need, prefill, courses, form]);

  const recost = (nextCourse = course, nextParticipants = participants) => {
    if (nextCourse) form.setFieldValue("estimated_cost", nextCourse.DEFAULT_COST * (nextParticipants || 0));
  };

  const handleStaffChange = (ids) => {
    const current = form.getFieldValue("participants") ?? 0;
    if (ids.length > current) {
      form.setFieldValue("participants", ids.length);
      recost(course, ids.length);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const res = await saveNeed({
        need_id: need?.NEED_ID,
        submission_id: submission.SUBMISSION_ID,
        tna_id: submission.TNA_ID,
        department_id: submission.DEPARTMENT_ID,
        ...values,
        course_id: values.mode === "CATALOGUE" ? values.course_id : null,
        proposed_title: values.mode === "PROPOSED" ? values.proposed_title : "",
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
      width="min(680px, 100vw)"
      title={
        <div className="font-helvetica">
          <p className="text-base font-semibold">{isEdit ? "Edit training need" : "Add a training need"}</p>
          <p className="text-xs font-normal text-[#64748b]">{submission?.DEPARTMENT}</p>
        </div>
      }
      classNames={{ body: "font-helvetica", footer: "!px-6 !py-3" }}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={isPending} onClick={() => form.submit()}>{isEdit ? "Save need" : "Add need"}</Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} scrollToFirstError>
        <Form.Item name="mode">
          <Segmented block options={[{ value: "CATALOGUE", label: "Course from the catalogue" }, { value: "PROPOSED", label: "Suggest a new training" }]} />
        </Form.Item>
        {mode === "PROPOSED" ? (
          <Form.Item name="proposed_title" label="Training needed" rules={[{ required: true, whitespace: true, message: "Name the training needed." }]}>
            <Input size="large" maxLength={140} placeholder="e.g. Cloud Infrastructure Fundamentals" />
          </Form.Item>
        ) : (
          <Form.Item name="course_id" label="Course" rules={[{ required: true, message: "Choose a course, or suggest a new training." }]}>
            <Select
              showSearch
              size="large"
              optionFilterProp="label"
              placeholder="Choose a course"
              virtual={false}
              options={courses.filter((c) => c.STATUS === "ACTIVE").map((c) => ({ value: c.COURSE_ID, label: `${c.COURSE_CODE} · ${c.COURSE_TITLE}` }))}
              onChange={(id) => {
                const picked = courses.find((c) => c.COURSE_ID === id);
                if (picked) form.setFieldValue("skill_ids", picked.SKILLS.map((s) => s.SKILL_ID));
                recost(picked);
              }}
            />
          </Form.Item>
        )}

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item name="source" label="Where the need comes from">
            <Select options={NEED_SOURCES} virtual={false} />
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <Segmented block options={PRIORITIES.map(({ value, label }) => ({ value, label }))} />
          </Form.Item>
        </div>

        <Form.Item name="skill_ids" label="Skills it addresses">
          <Select mode="multiple" allowClear optionFilterProp="label" options={buildGroupedSkillOptions(skills)} virtual={false} maxTagCount="responsive" />
        </Form.Item>

        <Form.Item name="staff_ids" label="Staff who need it" extra="Optional. Name specific staff, or just estimate the number below.">
          <Select
            mode="multiple"
            allowClear
            optionFilterProp="label"
            placeholder={`Staff in ${submission?.DEPARTMENT ?? "this department"}`}
            options={deptStaff.map((s) => ({ value: s.STAFF_ID, label: `${staffFullName(s)} · Grade ${s.GRADE}` }))}
            onChange={handleStaffChange}
            virtual={false}
            maxTagCount="responsive"
          />
        </Form.Item>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item name="participants" label="Participants (estimate)" rules={[{ required: true, type: "number", min: 1, message: "At least one participant." }]}>
            <InputNumber min={1} max={500} className="!w-full" onChange={(n) => recost(course, n)} />
          </Form.Item>
          <Form.Item name="estimated_cost" label="Estimated cost (₦)" extra={course ? `${course.DEFAULT_COST.toLocaleString("en-NG")} per participant` : undefined}>
            <InputNumber min={0} step={10000} className="!w-full" {...money} />
          </Form.Item>
        </div>

        <Form.Item
          name="justification"
          label="Why it's needed"
          rules={[
            { required: true, whitespace: true, message: "Explain the need." },
            { min: 15, message: "Add a little more detail." },
          ]}
        >
          <Input.TextArea rows={3} maxLength={600} showCount />
        </Form.Item>
        <Form.Item name="expected_outcome" label="Expected outcome" className="!mb-0">
          <Input.TextArea rows={2} maxLength={300} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

NeedFormDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  submission: PropTypes.object,
  need: PropTypes.object,
  prefill: PropTypes.object,
};
