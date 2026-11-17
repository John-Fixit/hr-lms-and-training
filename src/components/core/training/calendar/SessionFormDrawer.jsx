import { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { AutoComplete, Button, DatePicker, Drawer, Form, Input, InputNumber, Segmented, Select, TimePicker } from "antd";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useGetCatalogueCourses } from "../../../../API/trainingCatalogue";
import { useGetProviders, useGetTrainers } from "../../../../API/trainingProviders";
import {
  useCheckSessionClashes,
  useCreateSession,
  useGetSessions,
  useUpdateSession,
} from "../../../../API/trainingSessions";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { DELIVERY_METHODS, LOCATIONS, formatNaira } from "../catalogue/catalogueConstants";

const TIME_FORMAT = "HH:mm";
const toDay = (v) => (v ? dayjs(v) : null);
const toTime = (v) => (v ? dayjs(`2000-01-01 ${v}`) : null);

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 sm:p-5">
      <h4 className="mb-4 text-sm font-semibold text-[#0f172a]">{title}</h4>
      {children}
    </section>
  );
}

Section.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

/**
 * Schedule a new session of a catalogue course, or edit/reschedule one.
 * `preset` = { course_id, need_id, request_id } when opened from a TNA need or a request.
 */
export default function SessionFormDrawer({ open, onClose, session, preset, onSaved }) {
  const [form] = Form.useForm();
  const isEdit = Boolean(session);
  const values = Form.useWatch([], form) ?? {};

  const { data: courses = [] } = useGetCatalogueCourses();
  const { data: providers = [] } = useGetProviders();
  const { data: trainers = [] } = useGetTrainers();
  const { data: sessions = [] } = useGetSessions();
  const { mutateAsync: createSession, isPending: creating } = useCreateSession();
  const { mutateAsync: updateSession, isPending: updating } = useUpdateSession();

  const course = courses.find((c) => c.COURSE_ID === values.course_id);
  const datesChanged =
    isEdit &&
    values.start_date &&
    values.end_date &&
    (!dayjs(values.start_date).isSame(session.START_DATE, "day") || !dayjs(values.end_date).isSame(session.END_DATE, "day"));

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (session) {
      form.setFieldsValue({
        course_id: session.COURSE_ID,
        start_date: toDay(session.START_DATE),
        end_date: toDay(session.END_DATE),
        start_time: toTime(session.START_TIME),
        end_time: toTime(session.END_TIME),
        delivery_method: session.DELIVERY_METHOD,
        location: session.LOCATION,
        venue: session.VENUE,
        city: session.CITY,
        meeting_link: session.MEETING_LINK,
        provider_id: session.PROVIDER_ID ?? undefined,
        trainer_ids: session.TRAINER_IDS,
        capacity_min: session.CAPACITY_MIN,
        capacity_max: session.CAPACITY_MAX,
        cost_per_participant: session.COST_PER_PARTICIPANT,
        notes: session.NOTES,
      });
    } else {
      form.setFieldsValue({
        start_date: toDay(preset?.start_date),
        start_time: toTime("09:00"),
        end_time: toTime("16:00"),
        capacity_min: 5,
        capacity_max: 20,
        trainer_ids: [],
      });
    }
  }, [open, session, form, preset?.start_date]);

  // Pre-select the course when opened from a need or a request (once courses have loaded).
  useEffect(() => {
    if (!open || isEdit || !preset?.course_id || !courses.length) return;
    const match = courses.find((c) => c.COURSE_ID === preset.course_id && c.STATUS === "ACTIVE");
    if (match && form.getFieldValue("course_id") !== match.COURSE_ID) applyCourse(match);
    // applyCourse only reads form + course; safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, preset?.course_id, courses]);

  function applyCourse(picked) {
    const start = form.getFieldValue("start_date");
    form.setFieldsValue({
      course_id: picked.COURSE_ID,
      delivery_method: picked.DELIVERY_METHOD,
      location: picked.LOCATION,
      provider_id: picked.DEFAULT_PROVIDER_ID ?? undefined,
      cost_per_participant: picked.DEFAULT_COST,
      trainer_ids: [],
      end_date: start ? start.add(picked.DURATION_DAYS - 1, "day") : form.getFieldValue("end_date"),
    });
  }

  const handleStartChange = (date) => {
    if (date && course) form.setFieldValue("end_date", date.add(course.DURATION_DAYS - 1, "day"));
  };

  const courseOptions = useMemo(
    () =>
      courses
        .filter((c) => c.STATUS === "ACTIVE" || c.COURSE_ID === session?.COURSE_ID)
        .map((c) => ({ value: c.COURSE_ID, label: `${c.COURSE_CODE} · ${c.COURSE_TITLE}` })),
    [courses, session?.COURSE_ID],
  );

  const trainerOptions = useMemo(
    () =>
      trainers
        .filter((t) => t.STATUS === "ACTIVE" || values.trainer_ids?.includes(t.TRAINER_ID))
        .filter((t) => t.TRAINER_TYPE === "INTERNAL" || !values.provider_id || t.PROVIDER_ID === values.provider_id)
        .map((t) => ({
          value: t.TRAINER_ID,
          label: `${t.FULL_NAME}${t.TRAINER_TYPE === "INTERNAL" ? " (staff)" : ""}`,
        })),
    [trainers, values.provider_id, values.trainer_ids],
  );

  const venueOptions = useMemo(
    () => [...new Set(sessions.map((s) => s.VENUE).filter(Boolean))].sort().map((v) => ({ value: v })),
    [sessions],
  );

  const draft =
    values.start_date && values.end_date
      ? {
          session_id: session?.SESSION_ID,
          start_date: dayjs(values.start_date).format("YYYY-MM-DD"),
          end_date: dayjs(values.end_date).format("YYYY-MM-DD"),
          trainer_ids: values.trainer_ids ?? [],
          venue: values.venue ?? "",
          delivery_method: values.delivery_method,
        }
      : null;
  const { data: clashes = [], isFetching: checking } = useCheckSessionClashes(draft, open && Boolean(draft));
  const needsLink = ["VIRTUAL", "BLENDED"].includes(values.delivery_method);

  const handleSubmit = async (formValues) => {
    const payload = {
      ...formValues,
      start_date: formValues.start_date.format("YYYY-MM-DD"),
      end_date: formValues.end_date.format("YYYY-MM-DD"),
      start_time: formValues.start_time?.format(TIME_FORMAT),
      end_time: formValues.end_time?.format(TIME_FORMAT),
      need_id: preset?.need_id,
      request_id: preset?.request_id,
    };
    try {
      const res = isEdit
        ? await updateSession({ session_id: session.SESSION_ID, ...payload })
        : await createSession(payload);
      successToast(res?.message);
      onSaved?.(res?.data?.SESSION_ID ?? session?.SESSION_ID);
      onClose();
    } catch (err) {
      errorToast(err?.response?.data?.message ?? err?.message);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(760px, 100vw)"
      title={<span className="font-helvetica">{isEdit ? "Edit or reschedule session" : "Schedule a session"}</span>}
      classNames={{ body: "bg-[#F9FAFB] font-helvetica !p-4 sm:!p-6", footer: "!px-6 !py-3" }}
      destroyOnClose
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-[#64748b]">
            {clashes.length ? `${clashes.length} clash${clashes.length === 1 ? "" : "es"} — you can still save.` : ""}
          </span>
          <div className="flex gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" loading={creating || updating} onClick={() => form.submit()}>
              {isEdit ? (datesChanged ? "Reschedule" : "Save changes") : "Schedule session"}
            </Button>
          </div>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} scrollToFirstError className="space-y-4">
        {(preset?.need_id || preset?.request_id) && !isEdit && (
          <div className="flex items-start gap-2 rounded-lg border border-[#B2DDFF] bg-[#EFF8FF] p-3 text-sm text-[#175CD3]">
            <Info size={16} className="mt-0.5 shrink-0" />
            {preset.need_id
              ? "Scheduling from a training need. The new session will be linked to it."
              : "Scheduling for an approved request. The requester will be enrolled automatically."}
          </div>
        )}

        <Section title="Course">
          <Form.Item
            name="course_id"
            label="Catalogue course"
            rules={[{ required: true, message: "Choose the course this session runs." }]}
            className={course ? "" : "!mb-0"}
          >
            <Select
              showSearch
              size="large"
              optionFilterProp="label"
              placeholder="Choose an active course"
              options={courseOptions}
              disabled={isEdit}
              virtual={false}
              onChange={(id) => applyCourse(courses.find((c) => c.COURSE_ID === id))}
            />
          </Form.Item>
          {course && (
            <p className="-mt-2 text-xs text-[#64748b]">
              {course.DURATION_DAYS} day{course.DURATION_DAYS === 1 ? "" : "s"} · default {formatNaira(course.DEFAULT_COST)} per participant
              {course.DEFAULT_PROVIDER_NAME ? ` · ${course.DEFAULT_PROVIDER_NAME}` : ""}
            </p>
          )}
        </Section>

        <Section title="When">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-4">
            <Form.Item name="start_date" label="Start date" rules={[{ required: true, message: "Pick the start date." }]}>
              <DatePicker className="!w-full" format="D MMM YYYY" onChange={handleStartChange} />
            </Form.Item>
            <Form.Item
              name="end_date"
              label="End date"
              dependencies={["start_date"]}
              rules={[
                { required: true, message: "Pick the end date." },
                ({ getFieldValue }) => ({
                  validator: (_, v) =>
                    v && getFieldValue("start_date") && v.isBefore(getFieldValue("start_date"), "day")
                      ? Promise.reject(new Error("Ends before it starts."))
                      : Promise.resolve(),
                }),
              ]}
            >
              <DatePicker className="!w-full" format="D MMM YYYY" />
            </Form.Item>
            <Form.Item name="start_time" label="Daily start">
              <TimePicker className="!w-full" format={TIME_FORMAT} minuteStep={15} />
            </Form.Item>
            <Form.Item name="end_time" label="Daily end">
              <TimePicker className="!w-full" format={TIME_FORMAT} minuteStep={15} />
            </Form.Item>
          </div>
          {datesChanged && (
            <Form.Item
              name="reschedule_reason"
              label="Reason for the new dates"
              rules={[{ required: true, whitespace: true, message: "Participants will see this reason. Please add one." }]}
              className="!mb-0"
            >
              <Input.TextArea rows={2} maxLength={200} placeholder="e.g. Provider asked to move by one week." />
            </Form.Item>
          )}
        </Section>

        <Section title="Where & how">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name="delivery_method" label="Delivery" rules={[{ required: true, message: "Choose how it's delivered." }]}>
              <Select options={DELIVERY_METHODS.map(({ value, label }) => ({ value, label }))} virtual={false} />
            </Form.Item>
            <Form.Item name="location" label="Location">
              <Segmented block options={LOCATIONS} />
            </Form.Item>
            <Form.Item
              name="venue"
              label={values.delivery_method === "VIRTUAL" ? "Platform" : "Venue"}
              rules={[{ required: true, whitespace: true, message: "Say where it takes place." }]}
            >
              <AutoComplete
                options={venueOptions}
                filterOption={(input, option) => option.value.toLowerCase().includes(input.toLowerCase())}
                placeholder="e.g. HQ Training Room A"
              />
            </Form.Item>
            <Form.Item name="city" label="City">
              <Input placeholder="e.g. Abuja" maxLength={60} />
            </Form.Item>
          </div>
          {needsLink && (
            <Form.Item
              name="meeting_link"
              label="Meeting link"
              rules={[{ type: "url", message: "Paste the full link, starting with https://" }]}
              className="!mb-0"
            >
              <Input placeholder="https://teams.microsoft.com/…" />
            </Form.Item>
          )}
        </Section>

        <Section title="Trainers & seats">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name="provider_id" label="Provider">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Choose a provider"
                options={providers.filter((p) => p.STATUS === "ACTIVE" || p.PROVIDER_ID === values.provider_id).map((p) => ({ value: p.PROVIDER_ID, label: p.PROVIDER_NAME }))}
                virtual={false}
                onChange={() => form.setFieldValue("trainer_ids", [])}
              />
            </Form.Item>
            <Form.Item name="trainer_ids" label="Trainers" extra="Trainers from this provider, plus staff trainers.">
              <Select mode="multiple" allowClear optionFilterProp="label" placeholder="Assign trainers" options={trainerOptions} virtual={false} maxTagCount="responsive" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
            <Form.Item name="capacity_min" label="Minimum to run" rules={[{ required: true, message: "Set a minimum." }]}>
              <InputNumber min={0} max={500} className="!w-full" />
            </Form.Item>
            <Form.Item
              name="capacity_max"
              label="Maximum seats"
              dependencies={["capacity_min"]}
              rules={[
                { required: true, message: "Set the maximum." },
                ({ getFieldValue }) => ({
                  validator: (_, v) =>
                    v !== undefined && v < (getFieldValue("capacity_min") ?? 0)
                      ? Promise.reject(new Error("Can't be below the minimum."))
                      : Promise.resolve(),
                }),
              ]}
              extra={isEdit && session.ENROLLED ? `${session.ENROLLED} seats already taken.` : undefined}
            >
              <InputNumber min={1} max={500} className="!w-full" />
            </Form.Item>
            <Form.Item name="cost_per_participant" label="Cost per participant (₦)">
              <InputNumber
                min={0}
                step={5000}
                className="!w-full"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(v) => v?.replace(/,/g, "") ?? ""}
              />
            </Form.Item>
          </div>
          <Form.Item name="notes" label="Notes for participants" className="!mb-0">
            <Input.TextArea rows={2} maxLength={400} showCount placeholder="e.g. Bring your laptop. Lunch provided." />
          </Form.Item>
        </Section>

        {draft && (
          <section
            aria-live="polite"
            className={`rounded-xl border p-4 ${clashes.length ? "border-[#FEDF89] bg-[#FFFCF5]" : "border-[#ABEFC6] bg-[#F6FEF9]"}`}
          >
            {clashes.length ? (
              <>
                <p className="flex items-center gap-2 text-sm font-semibold text-[#93370D]">
                  <AlertTriangle size={16} /> Possible clashes
                </p>
                <ul className="mt-2 space-y-1 pl-6 text-sm text-[#93370D]">
                  {clashes.map((c, i) => (
                    <li key={`${c.SESSION_ID}-${c.TYPE}-${i}`} className="list-disc">
                      {c.MESSAGE}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm font-medium text-[#15803d]">
                <CheckCircle2 size={16} /> {checking ? "Checking for clashes…" : "No trainer, venue or participant clashes on these dates."}
              </p>
            )}
          </section>
        )}
      </Form>
    </Drawer>
  );
}

SessionFormDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  session: PropTypes.object,
  preset: PropTypes.shape({
    start_date: PropTypes.string,
    course_id: PropTypes.string,
    need_id: PropTypes.string,
    request_id: PropTypes.string,
  }),
  onSaved: PropTypes.func,
};
