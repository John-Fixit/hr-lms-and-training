import { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Alert, Button, Drawer, Form, Input, InputNumber, Segmented, Select, Switch } from "antd";
import { Minus, Plus } from "lucide-react";
import {
  useCreateCatalogueCourse,
  useGetCatalogueCourses,
  useGetCatalogueCourse,
  useGetProgrammes,
  useUpdateCatalogueCourse,
} from "../../../../API/trainingCatalogue";
import { useGetSkills } from "../../../../API/trainingSkills";
import { useGetAllCourses } from "../../../../API/lms-apis/course";
import { useGetProviders } from "../../../../API/trainingProviders";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { PROFICIENCY_LEVELS, buildGroupedSkillOptions } from "../skills/skillsConstants";
import {
  DELIVERY_METHODS,
  GRADE_OPTIONS,
  LOCATIONS,
  TRAINING_TYPES,
} from "./catalogueConstants";

function FormSection({ step, title, hint, children }) {
  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6366F1]/10 text-xs font-bold text-[#4F46E5]">
          {step}
        </span>
        <div>
          <h4 className="text-sm font-semibold text-[#0f172a]">{title}</h4>
          {hint && <p className="text-xs text-[#64748b]">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

FormSection.propTypes = {
  step: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  hint: PropTypes.string,
  children: PropTypes.node.isRequired,
};

const EMPTY_VALUES = {
  course_title: "",
  course_code: "",
  programme_id: undefined,
  training_type: "TRAINING",
  delivery_method: "CLASSROOM",
  location: "LOCAL",
  duration_days: 1,
  is_mandatory: false,
  description: "",
  objectives: "",
  learning_outcomes: [""],
  skills: [{ skill_id: undefined, target_level: 3, is_primary: true }],
  target_audience: "",
  target_grades: [],
  prerequisite_ids: [],
  default_provider_id: undefined,
  default_cost: 0,
  lms_course_id: undefined,
};

const valuesFromCourse = (course) => ({
  course_title: course.COURSE_TITLE,
  course_code: course.COURSE_CODE,
  programme_id: course.PROGRAMME_ID,
  training_type: course.TRAINING_TYPE,
  delivery_method: course.DELIVERY_METHOD,
  location: course.LOCATION,
  duration_days: course.DURATION_DAYS,
  is_mandatory: Boolean(course.IS_MANDATORY),
  description: course.DESCRIPTION,
  objectives: course.OBJECTIVES,
  learning_outcomes: course.LEARNING_OUTCOMES.length ? course.LEARNING_OUTCOMES : [""],
  skills: course.SKILLS.map((s) => ({
    skill_id: s.SKILL_ID,
    target_level: s.TARGET_LEVEL,
    is_primary: Boolean(s.IS_PRIMARY),
  })),
  target_audience: course.TARGET_AUDIENCE,
  target_grades: course.TARGET_GRADES,
  prerequisite_ids: course.PREREQUISITE_IDS,
  default_provider_id: course.DEFAULT_PROVIDER_ID ?? undefined,
  default_cost: course.DEFAULT_COST,
  lms_course_id: course.LMS_COURSE_ID ?? undefined,
});

/** Create or edit a catalogue course. `presetProgrammeId` pre-selects the programme for new courses. */
export default function CourseFormDrawer({ open, onClose, course, presetProgrammeId }) {
  const [form] = Form.useForm();
  const isEdit = Boolean(course);
  const watchedSkills = Form.useWatch("skills", form);

  const { data: programmes = [] } = useGetProgrammes();
  const { data: courses = [] } = useGetCatalogueCourses();
  const {
    data: courseDetails,
    isPending: detailsPending,
    isError: detailsError,
  } = useGetCatalogueCourse(open && course ? course.COURSE_ID : null);
  const { data: skills = [] } = useGetSkills();
  const { data: lmsCoursesRaw, isPending: lmsLoading, isError: lmsError } = useGetAllCourses();
  const { data: providers = [], isPending: providersLoading } = useGetProviders();
  const { mutateAsync: createCourse, isPending: creating } = useCreateCatalogueCourse();
  const { mutateAsync: updateCourse, isPending: updating } = useUpdateCatalogueCourse();

  useEffect(() => {
    if (!open) return;
    if (course && detailsPending) return;
    form.resetFields();
    form.setFieldsValue(
      course ? valuesFromCourse(courseDetails ?? course) : { ...EMPTY_VALUES, programme_id: presetProgrammeId },
    );
  }, [open, course, courseDetails, detailsPending, presetProgrammeId, form]);

  const chosenSkillIds = (watchedSkills ?? []).map((s) => s?.skill_id).filter(Boolean);
  const skillOptions = (currentId) =>
    buildGroupedSkillOptions(skills, {
      disabledIds: chosenSkillIds.filter((id) => id !== currentId),
    });

  const programmeOptions = programmes
    .filter((p) => p.STATUS === "ACTIVE" || p.PROGRAMME_ID === course?.PROGRAMME_ID)
    .map((p) => ({ value: p.PROGRAMME_ID, label: p.PROGRAMME_NAME }));

  const prerequisiteOptions = useMemo(
    () =>
      courses
        .filter((c) => c.COURSE_ID !== course?.COURSE_ID && c.STATUS !== "ARCHIVED")
        .map((c) => ({ value: c.COURSE_ID, label: `${c.COURSE_CODE} · ${c.COURSE_TITLE}` })),
    [courses, course?.COURSE_ID],
  );

  const providerOptions = providers
    .filter((p) => p.STATUS === "ACTIVE" || p.PROVIDER_ID === course?.DEFAULT_PROVIDER_ID)
    .map((p) => ({
      value: p.PROVIDER_ID,
      label: p.PROVIDER_TYPE === "INTERNAL" ? `${p.PROVIDER_NAME} (internal)` : p.PROVIDER_NAME,
    }));

  const lmsOptions = (lmsCoursesRaw?.data ?? [])
    .filter((c) => c?.COURSE_ID)
    .map((c) => ({ value: c.COURSE_ID, label: c.COURSE_TITLE || c.COURSE_ID }));

  const submit = (status) => async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, status };
      const res = isEdit
        ? await updateCourse({ course_id: course.COURSE_ID, ...payload })
        : await createCourse(payload);
      successToast(res?.message);
      onClose();
    } catch (err) {
      if (err?.errorFields) {
        form.scrollToField(err.errorFields[0].name, { behavior: "smooth", block: "center" });
        return;
      }
      errorToast(err?.response?.data?.message ?? err?.message);
    }
  };

  const saving = creating || updating;
  const editBlocked = isEdit && (
    detailsPending || detailsError || !courseDetails?.SKILLS_INCLUDED
  );
  const footer = isEdit && course.STATUS !== "DRAFT" ? (
    <div className="flex justify-end gap-2">
      <Button onClick={onClose}>Cancel</Button>
      <Button type="primary" loading={saving || detailsPending} disabled={editBlocked} onClick={submit(course.STATUS)}>
        Save changes
      </Button>
    </div>
  ) : (
    <div className="flex flex-wrap justify-end gap-2">
      <Button onClick={onClose}>Cancel</Button>
      <Button loading={saving || detailsPending} disabled={editBlocked} onClick={submit("DRAFT")}>
        {isEdit ? "Save draft" : "Save as draft"}
      </Button>
      <Button type="primary" loading={saving || detailsPending} disabled={editBlocked} onClick={submit("ACTIVE")}>
        Publish course
      </Button>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(820px, 100vw)"
      title={
        <span className="font-helvetica">
          {isEdit ? `Edit ${course.COURSE_CODE}` : "New catalogue course"}
        </span>
      }
      classNames={{ body: "bg-[#F9FAFB] font-helvetica !p-4 sm:!p-6", footer: "!px-6 !py-3" }}
      destroyOnClose
      footer={footer}
    >
      {detailsError && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message="Course details could not be loaded"
          description="Reload the course details before editing so existing skill links and prerequisites are preserved."
        />
      )}
      {isEdit && !detailsPending && !detailsError && !courseDetails?.SKILLS_INCLUDED && (
        <Alert
          className="mb-4"
          type="warning"
          showIcon
          message="Editing is unavailable"
          description="The course detail response did not include skill links. The form is read-only to avoid overwriting fields that were not returned."
        />
      )}
      <Form form={form} layout="vertical" className="space-y-4" scrollToFirstError>
        <FormSection step={1} title="Basics" hint="How the course appears in the catalogue.">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
            <Form.Item
              name="course_title"
              label="Course title"
              className="sm:col-span-2"
              rules={[
                { required: true, whitespace: true, message: "Give the course a title." },
                { max: 120, message: "Keep the title under 120 characters." },
              ]}
            >
              <Input size="large" placeholder="e.g. Safety Management Systems Fundamentals" />
            </Form.Item>
            <Form.Item
              name="course_code"
              label="Course code"
              normalize={(v) => v?.toUpperCase()}
              rules={[
                { required: true, whitespace: true, message: "Add a short unique code." },
                { pattern: /^[A-Z0-9-]{2,16}$/, message: "Use 2–16 letters, numbers or dashes." },
              ]}
            >
              <Input size="large" placeholder="SAF-101" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item
              name="programme_id"
              label="Programme"
              rules={[{ required: true, message: "Choose the programme this course belongs to." }]}
            >
              <Select size="large" placeholder="Choose a programme" options={programmeOptions} virtual={false} />
            </Form.Item>
            <Form.Item name="training_type" label="Training type" rules={[{ required: true, message: "Choose a type." }]}>
              <Select size="large" options={TRAINING_TYPES} virtual={false} />
            </Form.Item>
            <Form.Item
              name="delivery_method"
              label="Delivery method"
              rules={[{ required: true, message: "Choose how it's delivered." }]}
            >
              <Select size="large" options={DELIVERY_METHODS.map(({ value, label }) => ({ value, label }))} virtual={false} />
            </Form.Item>
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item name="location" label="Location">
                <Segmented block size="large" options={LOCATIONS} />
              </Form.Item>
              <Form.Item
                name="duration_days"
                label="Duration (days)"
                rules={[
                  { required: true, message: "Enter the duration." },
                  { type: "number", min: 1, max: 365, message: "Between 1 and 365 days." },
                ]}
              >
                <InputNumber size="large" min={1} max={365} className="!w-full" />
              </Form.Item>
            </div>
          </div>
          <Form.Item
            name="is_mandatory"
            valuePropName="checked"
            label="Mandatory course"
            extra="Mandatory courses are flagged when nominating staff and in compliance reports."
            className="!mb-0"
          >
            <Switch />
          </Form.Item>
        </FormSection>

        <FormSection step={2} title="Content" hint="What the course covers and what participants should be able to do.">
          <Form.Item name="description" label="Short description">
            <Input.TextArea rows={2} maxLength={300} showCount placeholder="One or two sentences shown on the course card." />
          </Form.Item>
          <Form.Item name="objectives" label="Objective">
            <Input.TextArea rows={3} maxLength={600} showCount placeholder="Why the organisation runs this course." />
          </Form.Item>
          <p className="mb-2 text-sm text-[#0f172a]">Learning outcomes</p>
          <Form.List name="learning_outcomes">
            {(fields, { add, remove }) => (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.key} className="flex items-start gap-2">
                    <Form.Item {...field} className="!mb-0 flex-1">
                      <Input placeholder={index === 0 ? "e.g. Carry out a basic risk assessment" : "Another outcome"} />
                    </Form.Item>
                    <Button
                      aria-label="Remove outcome"
                      icon={<Minus size={14} />}
                      onClick={() => remove(field.name)}
                      disabled={fields.length === 1}
                    />
                  </div>
                ))}
                <Button type="dashed" icon={<Plus size={14} />} onClick={() => add("")} disabled={fields.length >= 8}>
                  Add outcome
                </Button>
              </div>
            )}
          </Form.List>
        </FormSection>

        <FormSection
          step={3}
          title="Skills it builds"
          hint="Links the course to the Skills Library so it can be recommended when staff have a gap."
        >
          <Form.List name="skills">
            {(fields, { add, remove }) => (
              <div className="space-y-2">
                {fields.length > 0 && (
                  <div className="hidden grid-cols-[1fr_190px_170px_32px] gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8] sm:grid">
                    <span>Skill</span>
                    <span>Takes staff to</span>
                    <span>Focus</span>
                    <span />
                  </div>
                )}
                {fields.map((field) => (
                  <div
                    key={field.key}
                    className="grid grid-cols-1 gap-2 rounded-lg border border-[#f1f5f9] p-2 sm:grid-cols-[1fr_190px_170px_32px] sm:border-0 sm:p-0"
                  >
                    <Form.Item
                      name={[field.name, "skill_id"]}
                      className="!mb-0"
                      rules={[{ required: true, message: "Pick a skill or remove this row." }]}
                    >
                      <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder="Choose a skill"
                        options={skillOptions(watchedSkills?.[field.name]?.skill_id)}
                        virtual={false}
                      />
                    </Form.Item>
                    <Form.Item name={[field.name, "target_level"]} className="!mb-0">
                      <Select
                        virtual={false}
                        options={PROFICIENCY_LEVELS.map((l) => ({ value: l.level, label: `L${l.level} · ${l.name}` }))}
                      />
                    </Form.Item>
                    <Form.Item name={[field.name, "is_primary"]} className="!mb-0">
                      <Segmented
                        block
                        options={[
                          { value: true, label: "Primary" },
                          { value: false, label: "Secondary" },
                        ]}
                      />
                    </Form.Item>
                    <Button aria-label="Remove skill" icon={<Minus size={14} />} onClick={() => remove(field.name)} />
                  </div>
                ))}
                <Button
                  type="dashed"
                  icon={<Plus size={14} />}
                  onClick={() => add({ skill_id: undefined, target_level: 3, is_primary: fields.length === 0 })}
                  disabled={fields.length >= 8}
                >
                  Link a skill
                </Button>
              </div>
            )}
          </Form.List>
        </FormSection>

        <FormSection step={4} title="Audience & prerequisites">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name="target_audience" label="Target audience">
              <Input placeholder="e.g. Senior inspectors" maxLength={120} />
            </Form.Item>
            <Form.Item name="target_grades" label="Grades" extra="Leave empty if the course is open to all grades.">
              <Select mode="multiple" allowClear placeholder="All grades" options={GRADE_OPTIONS} virtual={false} maxTagCount="responsive" />
            </Form.Item>
          </div>
          <Form.Item
            name="prerequisite_ids"
            label="Must complete first"
            className="!mb-0"
            extra="Staff without these courses get a warning when nominated."
          >
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="No prerequisites"
              options={prerequisiteOptions}
              virtual={false}
            />
          </Form.Item>
        </FormSection>

        <FormSection
          step={5}
          title="Delivery defaults"
          hint="Pre-filled when HR creates a training from this course. They can still be changed per training."
        >
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item
              name="default_provider_id"
              label="Default provider"
              extra="Missing a provider? Add it under Trainers & Providers."
            >
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Choose a provider"
                loading={providersLoading}
                options={providerOptions}
                virtual={false}
              />
            </Form.Item>
            <Form.Item
              name="default_cost"
              label="Default cost per participant (₦)"
              rules={[{ type: "number", min: 0, message: "Cost can't be negative." }]}
            >
              <InputNumber
                min={0}
                step={5000}
                className="!w-full"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(v) => v?.replace(/,/g, "") ?? ""}
              />
            </Form.Item>
          </div>
          <Form.Item
            name="lms_course_id"
            label="Linked e-learning course"
            className="!mb-0"
            extra={
              lmsError
                ? "Couldn't load LMS courses right now. You can link one later."
                : "Optional. Use for self-paced or blended courses that run in the LMS."
            }
          >
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Not linked"
              loading={lmsLoading}
              options={lmsOptions}
              virtual={false}
            />
          </Form.Item>
        </FormSection>
      </Form>
    </Drawer>
  );
}

CourseFormDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  course: PropTypes.object,
  presetProgrammeId: PropTypes.string,
};
