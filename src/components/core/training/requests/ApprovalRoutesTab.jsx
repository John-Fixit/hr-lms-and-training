import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { Button, Drawer, Form, Input, InputNumber, Modal, Segmented, Select, Switch } from "antd";
import { ArrowDown, ArrowRight, ArrowUp, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import {
  APPROVAL_ROLES,
  approvalRoleLabel,
  useDeleteApprovalRoute,
  useGetApprovalRoutes,
  useMoveApprovalRoute,
  useSaveApprovalRoute,
} from "../../../../API/trainingRequests";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { CARD_CLASS } from "../shared/trainingTheme";
import { formatNaira } from "../catalogue/catalogueConstants";

const LOCATION_RULES = [
  { value: "ANY", label: "Any location" },
  { value: "LOCAL", label: "Local" },
  { value: "FOREIGN", label: "Foreign" },
];

const ruleText = (r) => {
  const where = r.LOCATION === "ANY" ? "Any training" : r.LOCATION === "FOREIGN" ? "Foreign training" : "Local training";
  if (r.MAX_COST === null && !r.MIN_COST) return `${where}, any cost`;
  if (r.MAX_COST === null) return `${where} from ${formatNaira(r.MIN_COST)}`;
  return `${where} from ${formatNaira(r.MIN_COST || 0)} to ${formatNaira(r.MAX_COST)}`;
};

function RouteFormDrawer({ open, onClose, route }) {
  const [form] = Form.useForm();
  const { mutateAsync: saveRoute, isPending } = useSaveApprovalRoute();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(
      route
        ? { route_name: route.ROUTE_NAME, location: route.LOCATION, min_cost: route.MIN_COST, max_cost: route.MAX_COST, steps: route.STEPS, is_active: Boolean(route.IS_ACTIVE) }
        : { location: "LOCAL", min_cost: 0, max_cost: null, steps: ["LINE_MANAGER", "HR_TRAINING"], is_active: true },
    );
  }, [open, route, form]);

  const handleSubmit = async (values) => {
    try {
      const res = await saveRoute({ route_id: route?.ROUTE_ID, ...values });
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
      width="min(560px, 100vw)"
      title={<span className="font-helvetica">{route ? "Edit approval route" : "New approval route"}</span>}
      classNames={{ body: "font-helvetica", footer: "!px-6 !py-3" }}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={isPending} onClick={() => form.submit()}>Save route</Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="route_name" label="Route name" rules={[{ required: true, whitespace: true, message: "Name the route." }]}>
          <Input placeholder="e.g. Local training above ₦500,000" maxLength={80} />
        </Form.Item>
        <p className="mb-2 text-sm font-medium text-[#0f172a]">Applies to</p>
        <Form.Item name="location">
          <Segmented block options={LOCATION_RULES} />
        </Form.Item>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name="min_cost" label="Cost from (₦)">
            <InputNumber min={0} step={50000} className="!w-full" formatter={(x) => `${x}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} parser={(x) => x?.replace(/,/g, "") ?? ""} />
          </Form.Item>
          <Form.Item name="max_cost" label="Cost up to (₦)" extra="Leave empty for no upper limit.">
            <InputNumber min={0} step={50000} className="!w-full" formatter={(x) => (x === null || x === undefined || x === "" ? "" : `${x}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","))} parser={(x) => (x ? x.replace(/,/g, "") : null)} />
          </Form.Item>
        </div>
        <p className="mb-2 text-sm font-medium text-[#0f172a]">Approval steps, in order</p>
        <Form.List
          name="steps"
          rules={[{ validator: (_, steps) => (steps?.length ? Promise.resolve() : Promise.reject(new Error("Add at least one step."))) }]}
        >
          {(fields, { add, remove, move }, { errors }) => (
            <div className="mb-6 space-y-2">
              {fields.map((field, index) => (
                <div key={field.key} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6366F1]/10 text-xs font-bold text-[#4F46E5]">{index + 1}</span>
                  <Form.Item {...field} className="!mb-0 flex-1" rules={[{ required: true, message: "Pick a role." }]}>
                    <Select options={APPROVAL_ROLES} virtual={false} />
                  </Form.Item>
                  <Button aria-label="Move up" icon={<ArrowUp size={14} />} disabled={index === 0} onClick={() => move(index, index - 1)} />
                  <Button aria-label="Move down" icon={<ArrowDown size={14} />} disabled={index === fields.length - 1} onClick={() => move(index, index + 1)} />
                  <Button aria-label="Remove step" icon={<Minus size={14} />} onClick={() => remove(field.name)} disabled={fields.length === 1} />
                </div>
              ))}
              <Button type="dashed" icon={<Plus size={14} />} onClick={() => add("HR_TRAINING")} disabled={fields.length >= APPROVAL_ROLES.length}>
                Add step
              </Button>
              <Form.ErrorList errors={errors} />
            </div>
          )}
        </Form.List>
        <Form.Item name="is_active" label="In use" valuePropName="checked" className="!mb-0">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

RouteFormDrawer.propTypes = { open: PropTypes.bool.isRequired, onClose: PropTypes.func.isRequired, route: PropTypes.object };

export default function ApprovalRoutesTab() {
  const { data: routes = [], isPending } = useGetApprovalRoutes();
  const { mutateAsync: moveRoute } = useMoveApprovalRoute();
  const { mutateAsync: saveRoute } = useSaveApprovalRoute();
  const { mutateAsync: deleteRoute } = useDeleteApprovalRoute();
  const [modal, contextHolder] = Modal.useModal();
  const [drawer, setDrawer] = useState({ open: false, route: null });

  const run = (promise) =>
    promise.then((res) => res?.message && successToast(res.message)).catch((err) => errorToast(err?.response?.data?.message ?? err?.message));

  const toggle = (route, checked) =>
    run(
      saveRoute({
        route_id: route.ROUTE_ID,
        route_name: route.ROUTE_NAME,
        location: route.LOCATION,
        min_cost: route.MIN_COST,
        max_cost: route.MAX_COST,
        steps: route.STEPS,
        is_active: checked,
      }),
    );

  return (
    <div className="space-y-4">
      {contextHolder}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-[#475569]">
          When a request is submitted, the first route in this list that matches its location and cost decides who approves it.
          Changes apply to new requests only.
        </p>
        <Button type="primary" icon={<Plus size={15} />} onClick={() => setDrawer({ open: true, route: null })}>New route</Button>
      </div>

      {isPending ? (
        <div className="h-40 animate-pulse rounded-xl border border-[#e2e8f0] bg-white" />
      ) : (
        <ol className="space-y-3">
          {routes.map((route, index) => (
            <li key={route.ROUTE_ID} className={clsx(CARD_CLASS, "p-4 sm:p-5", !route.IS_ACTIVE && "opacity-60")}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-xs font-bold text-[#475569]" title="Match order">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#0f172a]">{route.ROUTE_NAME}</h3>
                    <p className="text-xs text-[#64748b]">
                      {ruleText(route)}
                      {route.PENDING_REQUESTS ? ` · ${route.PENDING_REQUESTS} request${route.PENDING_REQUESTS === 1 ? "" : "s"} in progress` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch size="small" checked={Boolean(route.IS_ACTIVE)} onChange={(c) => toggle(route, c)} aria-label={`${route.ROUTE_NAME} in use`} />
                  <Button
                    type="text"
                    aria-label="Move up"
                    icon={<ArrowUp size={15} />}
                    disabled={index === 0}
                    onClick={() => run(moveRoute({ route_id: route.ROUTE_ID, sort_order: (route.SORT_ORDER ?? index + 1) - 1 }))}
                  />
                  <Button
                    type="text"
                    aria-label="Move down"
                    icon={<ArrowDown size={15} />}
                    disabled={index === routes.length - 1}
                    onClick={() => run(moveRoute({ route_id: route.ROUTE_ID, sort_order: (route.SORT_ORDER ?? index + 1) + 1 }))}
                  />
                  <Button type="text" aria-label={`Edit ${route.ROUTE_NAME}`} icon={<Pencil size={15} />} onClick={() => setDrawer({ open: true, route })} />
                  <Button
                    type="text"
                    aria-label={`Delete ${route.ROUTE_NAME}`}
                    icon={<Trash2 size={15} className="text-[#D92D20]" />}
                    onClick={() =>
                      modal.confirm({
                        title: `Delete ${route.ROUTE_NAME}?`,
                        okText: "Delete",
                        okButtonProps: { danger: true },
                        onOk: () => run(deleteRoute({ route_id: route.ROUTE_ID })),
                      })
                    }
                  />
                </div>
              </div>
              <ol className="mt-4 flex flex-wrap items-center gap-1.5 sm:pl-10">
                {route.STEPS.map((role, i) => (
                  <li key={role} className="flex items-center gap-1.5">
                    <span className="rounded-lg border border-[#e2e8f0] bg-[#F9FAFB] px-2.5 py-1 text-xs font-medium text-[#344054]">{approvalRoleLabel(role)}</span>
                    {i < route.STEPS.length - 1 && <ArrowRight size={12} className="text-[#94a3b8]" />}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      )}

      <RouteFormDrawer open={drawer.open} route={drawer.route} onClose={() => setDrawer({ open: false, route: null })} />
    </div>
  );
}
