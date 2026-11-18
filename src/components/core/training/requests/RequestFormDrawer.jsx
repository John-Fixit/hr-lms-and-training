import { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Button, DatePicker, Drawer, Form, Input, InputNumber, Segmented, Select, Upload } from "antd";
import { ArrowRight, CornerUpLeft, Paperclip, Route } from "lucide-react";
import { useGetCatalogueCourses } from "../../../../API/trainingCatalogue";
import { useGetSkillStaffOptions, useGetSkills, useGetStaffSkillProfile } from "../../../../API/trainingSkills";
import {
  approvalRoleLabel,
  useCreateTrainingRequest,
  usePreviewApprovalRoute,
  useUpdateTrainingRequest,
} from "../../../../API/trainingRequests";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { LOCATIONS, TRAINING_TYPES, formatNaira } from "../catalogue/catalogueConstants";
import { buildGroupedSkillOptions, staffFullName } from "../skills/skillsConstants";
import { ProficiencyMeter } from "../skills/SkillBadges";
import { FUNDING_SOURCES, REQUEST_SOURCES } from "./requestsConstants";

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 sm:p-5">
      <h4 className="mb-4 text-sm font-semibold text-[#0f172a]">{title}</h4>
      {children}
    </section>
  );
}

Section.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

const toDay = (v) => (v ? dayjs(v) : null);

/** New request, or edit a draft / returned request. */
export default function RequestFormDrawer({ open, onClose, request, onSaved }) {
  const [form] = Form.useForm();
  const isEdit = Boolean(request);
  const returned = request?.STATUS === "RETURNED";
  const v = Form.useWatch([], form) ?? {};

  const { data: staff = [] } = useGetSkillStaffOptions();
  const { data: courses = [] } = useGetCatalogueCourses();
  const { data: skills = [] } = useGetSkills();
  const { data: profile } = useGetStaffSkillProfile(open ? v.staff_id : null);
  const { mutateAsync: createRequest, isPending: creating } = useCreateTrainingRequest();
  const { mutateAsync: updateRequest, isPending: updating } = useUpdateTrainingRequest();

  const course = courses.find((c) => c.COURSE_ID === v.course_id);
  const isCatalogue = v.request_type !== "EXTERNAL";

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(
      request
        ? {
            staff_id: request.STAFF_ID,
            source: request.SOURCE,
            request_type: request.REQUEST_TYPE,
            course_id: request.COURSE_ID ?? undefined,
            proposed_title: request.PROPOSED_TITLE,
            proposed_provider: request.PROPOSED_PROVIDER,
            training_type: request.TRAINING_TYPE,
            location: request.LOCATION,
            duration_days: request.DURATION_DAYS,
            preferred_start: toDay(request.PREFERRED_START),
            estimated_cost: request.ESTIMATED_COST,
            funding_source: request.FUNDING_SOURCE,
            skill_ids: request.SKILL_IDS ?? [],
            justification: request.JUSTIFICATION,
            expected_outcome: request.EXPECTED_OUTCOME,
          }
        : { request_type: "CATALOGUE", source: "HR", location: "LOCAL", training_type: "TRAINING", duration_days: 1, funding_source: "TRAINING_BUDGET", skill_ids: [] },
    );
  }, [open, request, form]);

  const handleCourseChange = (id) => {
    const picked = courses.find((c) => c.COURSE_ID === id);
    if (!picked) return;
    form.setFieldsValue({ estimated_cost: picked.DEFAULT_COST, skill_ids: picked.SKILLS.map((s) => s.SKILL_ID) });
  };

  const draft = v.staff_id
    ? { staff_id: v.staff_id, course_id: isCatalogue ? v.course_id : undefined, location: isCatalogue ? undefined : v.location, estimated_cost: v.estimated_cost ?? 0 }
    : null;
  const { data: route } = usePreviewApprovalRoute(open && draft && (v.course_id || !isCatalogue) ? draft : null);

  const gapRows = useMemo(
    () =>
      (v.skill_ids ?? []).map((id) => {
        const held = profile?.SKILLS?.find((s) => s.SKILL_ID === id);
        const target = course?.SKILLS.find((s) => s.SKILL_ID === id)?.TARGET_LEVEL ?? 3;
        return { id, name: skills.find((s) => s.SKILL_ID === id)?.SKILL_NAME ?? id, level: held?.LEVEL ?? 0, target };
      }),
    [v.skill_ids, profile?.SKILLS, course, skills],
  );

  const submit = (send) => async () => {
    try {
      const values = await form.validateFields();
      const days = isCatalogue ? course?.DURATION_DAYS ?? 1 : values.duration_days;
      const payload = {
        ...values,
        preferred_start: values.preferred_start?.format("YYYY-MM-DD") ?? null,
        preferred_end: values.preferred_start ? values.preferred_start.add(days - 1, "day").format("YYYY-MM-DD") : null,
        attachment_name: values.attachment?.[0]?.name ?? request?.ATTACHMENT_NAME ?? null,
        submit: send,
      };
      const res = isEdit
        ? await updateRequest({ request_id: request.REQUEST_ID, ...payload })
        : await createRequest(payload);
      successToast(res?.message);
      onSaved?.(res?.data?.REQUEST_ID ?? request?.REQUEST_ID);
      onClose();
    } catch (err) {
      if (err?.errorFields) {
        form.scrollToField(err.errorFields[0].name, { behavior: "smooth", block: "center" });
        return;
      }
      errorToast(err?.response?.data?.message ?? err?.message);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(780px, 100vw)"
      title={<span className="font-helvetica">{isEdit ? `Edit ${request.REFERENCE_NO}` : "New training request"}</span>}
      classNames={{ body: "bg-[#F9FAFB] font-helvetica !p-4 sm:!p-6", footer: "!px-6 !py-3" }}
      destroyOnClose
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          {!returned && (
            <Button loading={creating || updating} onClick={submit(false)}>
              Save draft
            </Button>
          )}
          <Button type="primary" loading={creating || updating} onClick={submit(true)}>
            {returned ? "Resubmit" : "Submit for approval"}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" className="space-y-4" scrollToFirstError>
        {returned && (
          <div className="flex items-start gap-2 rounded-lg border border-[#FEDF89] bg-[#FFFCF5] p-3 text-sm text-[#93370D]">
            <CornerUpLeft size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Returned for correction</p>
              <p>{request.STEPS.find((s) => s.STATUS === "RETURNED")?.COMMENT}</p>
              <p className="mt-1 text-xs">Resubmitting continues from the step that returned it. Earlier approvals stand.</p>
            </div>
          </div>
        )}

        <Section title="Who it's for">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-[1fr_200px]">
            <Form.Item name="staff_id" label="Staff member" rules={[{ required: true, message: "Choose who the training is for." }]}>
              <Select
                showSearch
                size="large"
                disabled={isEdit}
                placeholder="Search by name or staff number"
                optionFilterProp="searchText"
                virtual={false}
                options={staff.map((s) => ({
                  value: s.STAFF_ID,
                  label: `${staffFullName(s)} · ${s.DEPARTMENT}`,
                  searchText: `${staffFullName(s)} ${s.STAFF_NUMBER} ${s.DEPARTMENT}`,
                }))}
              />
            </Form.Item>
            <Form.Item name="source" label="Raised by">
              <Select size="large" options={REQUEST_SOURCES.filter((s) => s.value !== "TNA" || request?.SOURCE === "TNA")} virtual={false} />
            </Form.Item>
          </div>
        </Section>

        <Section title="Training">
          <Form.Item name="request_type">
            <Segmented
              block
              options={[
                { value: "CATALOGUE", label: "From the catalogue" },
                { value: "EXTERNAL", label: "Not in the catalogue" },
              ]}
            />
          </Form.Item>
          {isCatalogue ? (
            <>
              <Form.Item name="course_id" label="Course" rules={[{ required: true, message: "Choose a catalogue course." }]}>
                <Select
                  showSearch
                  size="large"
                  optionFilterProp="label"
                  placeholder="Choose a course"
                  virtual={false}
                  onChange={handleCourseChange}
                  options={courses.filter((c) => c.STATUS === "ACTIVE").map((c) => ({ value: c.COURSE_ID, label: `${c.COURSE_CODE} · ${c.COURSE_TITLE}` }))}
                />
              </Form.Item>
              {course && (
                <p className="-mt-2 mb-4 text-xs text-[#64748b]">
                  {course.LOCATION === "FOREIGN" ? "Foreign" : "Local"} · {course.DURATION_DAYS} day{course.DURATION_DAYS === 1 ? "" : "s"} · {formatNaira(course.DEFAULT_COST)} per participant
                </p>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Form.Item name="proposed_title" label="Training title" className="sm:col-span-2" rules={[{ required: true, whitespace: true, message: "Name the training." }]}>
                <Input size="large" maxLength={140} placeholder="e.g. ICAO Safety Oversight Inspector Course" />
              </Form.Item>
              <Form.Item name="proposed_provider" label="Provider (if known)">
                <Input maxLength={120} />
              </Form.Item>
              <Form.Item name="training_type" label="Type">
                <Select options={TRAINING_TYPES} virtual={false} />
              </Form.Item>
              <Form.Item name="location" label="Location">
                <Segmented block options={LOCATIONS} />
              </Form.Item>
              <Form.Item name="duration_days" label="Duration (days)" rules={[{ type: "number", min: 1, max: 365, message: "Between 1 and 365." }]}>
                <InputNumber min={1} max={365} className="!w-full" />
              </Form.Item>
            </div>
          )}
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
            <Form.Item name="preferred_start" label="Preferred start">
              <DatePicker className="!w-full" format="D MMM YYYY" disabledDate={(d) => d.isBefore(dayjs(), "day")} />
            </Form.Item>
            <Form.Item name="estimated_cost" label="Estimated cost (₦)" rules={[{ required: true, message: "Estimate the cost." }]}>
              <InputNumber
                min={0}
                step={10000}
                className="!w-full"
                formatter={(x) => `${x}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(x) => x?.replace(/,/g, "") ?? ""}
              />
            </Form.Item>
            <Form.Item name="funding_source" label="Funding">
              <Select options={FUNDING_SOURCES} virtual={false} />
            </Form.Item>
          </div>
        </Section>

        <Section title="Why it's needed">
          <Form.Item
            name="justification"
            label="Business justification"
            rules={[
              { required: true, whitespace: true, message: "Explain why this training is needed." },
              { min: 20, message: "Add a little more detail (at least 20 characters)." },
            ]}
          >
            <Input.TextArea rows={3} maxLength={800} showCount placeholder="What does the role need that this training provides?" />
          </Form.Item>
          <Form.Item name="expected_outcome" label="Expected outcome">
            <Input.TextArea rows={2} maxLength={400} placeholder="What will the staff member do differently afterwards?" />
          </Form.Item>
          <Form.Item name="skill_ids" label="Skills it addresses" extra="Pre-filled from the course. Shows the staff member's current level.">
            <Select mode="multiple" allowClear optionFilterProp="label" options={buildGroupedSkillOptions(skills)} virtual={false} maxTagCount="responsive" />
          </Form.Item>
          {gapRows.length > 0 && v.staff_id && (
            <ul className="-mt-2 mb-4 space-y-1.5 rounded-lg bg-[#F9FAFB] p-3">
              {gapRows.map((g) => (
                <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                  <span className="text-[#344054]">{g.name}</span>
                  <span className="flex items-center gap-2 text-xs text-[#64748b]">
                    {g.level ? <ProficiencyMeter level={g.level} size="sm" /> : <span>Not recorded</span>}
                    <ArrowRight size={12} /> L{g.target}
                    {g.level >= g.target && <span className="font-medium text-[#b45309]">already at target</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Form.Item name="attachment" label="Attachment" valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)} className="!mb-0">
            <Upload beforeUpload={() => false} maxCount={1} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx">
              <Button icon={<Paperclip size={14} />}>{request?.ATTACHMENT_NAME ? `Replace ${request.ATTACHMENT_NAME}` : "Attach brochure or letter"}</Button>
            </Upload>
          </Form.Item>
        </Section>

        {returned && (
          <Section title="Note to approvers">
            <Form.Item name="resubmit_note" className="!mb-0">
              <Input.TextArea rows={2} maxLength={300} placeholder="What did you change?" />
            </Form.Item>
          </Section>
        )}

        <section className="rounded-xl border border-[#B2DDFF] bg-[#F5FAFF] p-4" aria-live="polite">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#175CD3]">
            <Route size={16} /> Approval route
          </p>
          {route ? (
            <>
              <p className="mt-1 text-xs text-[#175CD3]">{route.ROUTE_NAME}</p>
              <ol className="mt-3 flex flex-wrap items-center gap-1.5">
                {route.STEPS.map((s, i) => (
                  <li key={`${s.ROLE}-${i}`} className="flex items-center gap-1.5">
                    <span className="rounded-lg border border-[#B2DDFF] bg-white px-2.5 py-1 text-xs">
                      <span className="font-semibold text-[#0f172a]">{approvalRoleLabel(s.ROLE)}</span>
                      {s.APPROVER_NAME && <span className="block text-[11px] text-[#64748b]">{s.APPROVER_NAME}</span>}
                    </span>
                    {i < route.STEPS.length - 1 && <ArrowRight size={12} className="text-[#84CAFF]" />}
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="mt-1 text-xs text-[#175CD3]">Choose the staff member and training to see who approves it.</p>
          )}
        </section>
      </Form>
    </Drawer>
  );
}

RequestFormDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  request: PropTypes.object,
  onSaved: PropTypes.func,
};
