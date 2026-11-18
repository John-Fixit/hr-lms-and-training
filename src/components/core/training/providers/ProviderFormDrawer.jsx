import { useEffect } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Button, DatePicker, Drawer, Form, Input, Segmented, Select, Upload } from "antd";
import { Minus, Paperclip, Plus } from "lucide-react";
import { useCreateProvider, useUpdateProvider } from "../../../../API/trainingProviders";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { LOCATIONS } from "../catalogue/catalogueConstants";
import { DOCUMENT_TYPES, PROVIDER_TYPES } from "./providersConstants";

const toDate = (value) => (value ? dayjs(value) : null);
const fromDate = (value) => (value ? dayjs(value).format("YYYY-MM-DD") : null);

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 sm:p-5">
      <h4 className="mb-4 text-sm font-semibold text-[#0f172a]">{title}</h4>
      {children}
    </section>
  );
}

Section.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

export default function ProviderFormDrawer({ open, onClose, provider }) {
  const [form] = Form.useForm();
  const isEdit = Boolean(provider);
  const location = Form.useWatch("location", form);
  const providerType = Form.useWatch("provider_type", form);
  const { mutateAsync: createProvider, isPending: creating } = useCreateProvider();
  const { mutateAsync: updateProvider, isPending: updating } = useUpdateProvider();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(
      provider
        ? {
            provider_name: provider.PROVIDER_NAME,
            provider_type: provider.PROVIDER_TYPE,
            location: provider.LOCATION,
            city: provider.CITY,
            country: provider.COUNTRY,
            contact_person: provider.CONTACT_PERSON,
            email: provider.EMAIL,
            phone: provider.PHONE,
            website: provider.WEBSITE,
            accreditation: provider.ACCREDITATION,
            accreditation_expiry: toDate(provider.ACCREDITATION_EXPIRY),
            services: provider.SERVICES,
            documents: (provider.DOCUMENTS ?? []).map((d) => ({
              document_id: d.DOCUMENT_ID,
              document_name: d.DOCUMENT_NAME,
              document_type: d.DOCUMENT_TYPE,
              expiry_date: toDate(d.EXPIRY_DATE),
            })),
            notes: provider.NOTES,
          }
        : { provider_type: "INSTITUTION", location: "LOCAL", country: "Nigeria", services: [], documents: [] },
    );
  }, [open, provider, form]);

  const handleSubmit = async (values) => {
    const payload = {
      ...values,
      accreditation_expiry: fromDate(values.accreditation_expiry),
      documents: (values.documents ?? []).map(({ file, ...d }) => ({
        ...d,
        // Prototype keeps the file name only; the real build uploads via attachment/addChatFile.
        document_name: d.document_name || file?.[0]?.name,
        expiry_date: fromDate(d.expiry_date),
      })),
      status: provider?.STATUS ?? "ACTIVE",
    };
    try {
      const res = isEdit
        ? await updateProvider({ provider_id: provider.PROVIDER_ID, ...payload })
        : await createProvider(payload);
      successToast(res?.message);
      onClose();
    } catch (err) {
      errorToast(err?.response?.data?.message ?? err?.message);
    }
  };

  const isInternal = providerType === "INTERNAL";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(720px, 100vw)"
      title={<span className="font-helvetica">{isEdit ? `Edit ${provider.PROVIDER_NAME}` : "Register a provider"}</span>}
      classNames={{ body: "bg-[#F9FAFB] font-helvetica !p-4 sm:!p-6", footer: "!px-6 !py-3" }}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={creating || updating} onClick={() => form.submit()}>
            {isEdit ? "Save changes" : "Register provider"}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} scrollToFirstError className="space-y-4">
        <Section title="Provider">
          <Form.Item
            name="provider_name"
            label="Name"
            rules={[
              { required: true, whitespace: true, message: "Enter the provider's name." },
              { max: 120, message: "Keep the name under 120 characters." },
            ]}
          >
            <Input size="large" placeholder="e.g. Aviation Safety Academy" />
          </Form.Item>
          <Form.Item name="provider_type" label="Type" rules={[{ required: true, message: "Choose a type." }]}>
            <Segmented block options={PROVIDER_TYPES.map(({ value, label }) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="services" label="Services offered" extra="Type a service and press Enter." className="!mb-0">
            <Select mode="tags" placeholder="e.g. Safety management" tokenSeparators={[","]} open={false} suffixIcon={null} />
          </Form.Item>
        </Section>

        <Section title="Location & contact">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
            <Form.Item name="location" label="Location">
              <Segmented block options={LOCATIONS} />
            </Form.Item>
            <Form.Item name="city" label="City">
              <Input placeholder="e.g. Lagos" maxLength={60} />
            </Form.Item>
            <Form.Item
              name="country"
              label="Country"
              rules={[
                {
                  validator: (_, value) =>
                    location === "FOREIGN" && (!value || value.trim().toLowerCase() === "nigeria")
                      ? Promise.reject(new Error("Enter the country for a foreign provider."))
                      : Promise.resolve(),
                },
              ]}
            >
              <Input placeholder="e.g. Kenya" maxLength={60} />
            </Form.Item>
          </div>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name="contact_person" label={isInternal ? "Responsible officer" : "Contact person"}>
              <Input maxLength={80} />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ type: "email", message: "Enter a valid email address." }]}>
              <Input placeholder="name@example.com" />
            </Form.Item>
            <Form.Item name="phone" label="Phone" className="sm:!mb-0">
              <Input placeholder="+234 …" maxLength={30} />
            </Form.Item>
            <Form.Item
              name="website"
              label="Website"
              className="!mb-0"
              rules={[{ type: "url", message: "Enter a full address, starting with https://" }]}
            >
              <Input placeholder="https://" />
            </Form.Item>
          </div>
        </Section>

        <Section title="Accreditation">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-[1fr_200px]">
            <Form.Item name="accreditation" label="Accrediting body / certificate" className="sm:!mb-0">
              <Input placeholder="e.g. ICAO TRAINAIR PLUS Full Member" maxLength={160} />
            </Form.Item>
            <Form.Item name="accreditation_expiry" label="Expires on" className="!mb-0">
              <DatePicker className="!w-full" format="D MMM YYYY" />
            </Form.Item>
          </div>
        </Section>

        <Section title="Documents">
          <p className="-mt-2 mb-3 text-xs text-[#64748b]">
            Contracts, tax clearance, accreditation certificates. HR is alerted 60 days before a document expires.
          </p>
          <Form.List name="documents">
            {(fields, { add, remove }) => (
              <div className="space-y-3">
                {fields.map((field) => (
                  <div key={field.key} className="grid grid-cols-1 gap-2 rounded-lg border border-[#e2e8f0] p-3 sm:grid-cols-[1fr_170px_160px_32px]">
                    <Form.Item name={[field.name, "document_id"]} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "document_name"]}
                      className="!mb-0"
                      rules={[{ required: true, whitespace: true, message: "Name the document." }]}
                    >
                      <Input placeholder="Document name" />
                    </Form.Item>
                    <Form.Item name={[field.name, "document_type"]} className="!mb-0">
                      <Select options={DOCUMENT_TYPES} virtual={false} />
                    </Form.Item>
                    <Form.Item name={[field.name, "expiry_date"]} className="!mb-0">
                      <DatePicker className="!w-full" placeholder="Expiry (optional)" format="D MMM YYYY" />
                    </Form.Item>
                    <Button aria-label="Remove document" icon={<Minus size={14} />} onClick={() => remove(field.name)} />
                    <Form.Item
                      name={[field.name, "file"]}
                      valuePropName="fileList"
                      getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                      className="!mb-0 sm:col-span-4"
                    >
                      <Upload beforeUpload={() => false} maxCount={1} accept=".pdf,.png,.jpg,.jpeg">
                        <Button size="small" icon={<Paperclip size={13} />}>
                          Attach file
                        </Button>
                      </Upload>
                    </Form.Item>
                  </div>
                ))}
                <Button
                  type="dashed"
                  icon={<Plus size={14} />}
                  onClick={() => add({ document_type: "CONTRACT" })}
                  disabled={fields.length >= 10}
                >
                  Add document
                </Button>
              </div>
            )}
          </Form.List>
        </Section>

        <Section title="Notes">
          <Form.Item name="notes" className="!mb-0">
            <Input.TextArea rows={3} maxLength={500} showCount placeholder="Anything HR should know, e.g. renewal in progress." />
          </Form.Item>
        </Section>
      </Form>
    </Drawer>
  );
}

ProviderFormDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  provider: PropTypes.object,
};
