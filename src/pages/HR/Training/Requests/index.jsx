import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ConfigProvider } from "antd";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Inbox, Route } from "lucide-react";
import TrainingPageHeader from "../../../../components/core/training/shared/TrainingPageHeader";
import "../../../../components/core/training/shared/trainingDesignSystem.css";
import TrainingPageTabs from "../../../../components/core/training/shared/TrainingPageTabs";
import { TRAINING_THEME, tabPanelProps } from "../../../../components/core/training/shared/trainingTheme";
import RequestsOverviewStrip from "../../../../components/core/training/requests/RequestsOverviewStrip";
import RequestsTab from "../../../../components/core/training/requests/RequestsTab";
import ApprovalRoutesTab from "../../../../components/core/training/requests/ApprovalRoutesTab";
import RequestDetailDrawer from "../../../../components/core/training/requests/RequestDetailDrawer";
import RequestFormDrawer from "../../../../components/core/training/requests/RequestFormDrawer";
import { DEFAULT_REQUEST_FILTERS } from "../../../../components/core/training/requests/requestsConstants";

const TABS = [
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "routes", label: "Approval routes", icon: Route },
];

const CLOSED_FORM = { open: false, request: null };

export default function TrainingRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "routes" ? "routes" : "requests";
  const reduceMotion = useReducedMotion();
  const [filters, setFilters] = useState(DEFAULT_REQUEST_FILTERS);
  const [openRequestId, setOpenRequestId] = useState(null);
  const [form, setForm] = useState(CLOSED_FORM);

  const setTab = useCallback(
    (tab) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === "requests") next.delete("tab");
          else next.set("tab", tab);
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  const showStatus = (status) => {
    setFilters({ ...DEFAULT_REQUEST_FILTERS, tab: status });
    setTab("requests");
  };

  const motionProps = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 }, transition: { duration: 0.2, ease: "easeOut" } };

  return (
    <ConfigProvider theme={TRAINING_THEME}>
      <main className="training-suite space-y-6 py-6">
        <TrainingPageHeader
          header_text="Training Requests"
          breadCrumb_data={[{ name: "HR" }, { name: "Skill management" }, { name: "Requests & Approvals" }]}
          subtitle="Human Resources / Skill management"
          buttonProp={[{ button_text: "New Request", fn: () => setForm({ open: true, request: null }) }]}
        />

        <RequestsOverviewStrip onShowTab={showStatus} />

        <TrainingPageTabs tabs={TABS} active={activeTab} onChange={setTab} idPrefix="requests" label="Request sections" />

        <AnimatePresence mode="wait" initial={false}>
          <motion.section key={activeTab} {...tabPanelProps("requests", activeTab)} {...motionProps}>
            {activeTab === "requests" ? (
              <RequestsTab filters={filters} onFiltersChange={setFilters} onOpenRequest={setOpenRequestId} />
            ) : (
              <ApprovalRoutesTab />
            )}
          </motion.section>
        </AnimatePresence>

        <RequestDetailDrawer
          open={Boolean(openRequestId)}
          requestId={openRequestId}
          onClose={() => setOpenRequestId(null)}
          onEdit={(request) => setForm({ open: true, request })}
        />
        <RequestFormDrawer
          open={form.open}
          request={form.request}
          onClose={() => setForm(CLOSED_FORM)}
          onSaved={(requestId) => {
            if (!form.request && requestId) setOpenRequestId(requestId);
          }}
        />
      </main>
    </ConfigProvider>
  );
}
