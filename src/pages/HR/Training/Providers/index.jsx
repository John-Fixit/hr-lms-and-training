import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ConfigProvider } from "antd";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Building2, Presentation } from "lucide-react";
import TrainingPageHeader from "../../../../components/core/training/shared/TrainingPageHeader";
import "../../../../components/core/training/shared/trainingDesignSystem.css";
import TrainingPageTabs from "../../../../components/core/training/shared/TrainingPageTabs";
import {
  TRAINING_THEME,
  tabPanelProps,
} from "../../../../components/core/training/shared/trainingTheme";
import ProvidersOverviewStrip from "../../../../components/core/training/providers/ProvidersOverviewStrip";
import ProvidersTab from "../../../../components/core/training/providers/ProvidersTab";
import TrainersTab from "../../../../components/core/training/providers/TrainersTab";
import ProviderDetailDrawer from "../../../../components/core/training/providers/ProviderDetailDrawer";
import ProviderFormDrawer from "../../../../components/core/training/providers/ProviderFormDrawer";
import TrainerDetailDrawer from "../../../../components/core/training/providers/TrainerDetailDrawer";
import TrainerFormDrawer from "../../../../components/core/training/providers/TrainerFormDrawer";
import useDirectoryActions from "../../../../components/core/training/providers/useDirectoryActions";
import {
  DEFAULT_PROVIDER_FILTERS,
  DEFAULT_TRAINER_FILTERS,
} from "../../../../components/core/training/providers/providersConstants";

const TABS = [
  { id: "providers", label: "Providers", icon: Building2 },
  { id: "trainers", label: "Trainers", icon: Presentation },
];

const CLOSED_PROVIDER_FORM = { open: false, provider: null };
const CLOSED_TRAINER_FORM = { open: false, trainer: null, presetProvider: null };

export default function TrainersProviders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "trainers" ? "trainers" : "providers";
  const reduceMotion = useReducedMotion();

  const [providerFilters, setProviderFilters] = useState(DEFAULT_PROVIDER_FILTERS);
  const [trainerFilters, setTrainerFilters] = useState(DEFAULT_TRAINER_FILTERS);
  const [openProviderId, setOpenProviderId] = useState(null);
  const [openTrainerId, setOpenTrainerId] = useState(null);
  const [providerForm, setProviderForm] = useState(CLOSED_PROVIDER_FORM);
  const [trainerForm, setTrainerForm] = useState(CLOSED_TRAINER_FORM);

  const setTab = useCallback(
    (tab) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === "providers") next.delete("tab");
          else next.set("tab", tab);
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  const actions = useDirectoryActions({
    onEditProvider: (provider) => setProviderForm({ open: true, provider }),
    onEditTrainer: (trainer) => setTrainerForm({ open: true, trainer, presetProvider: null }),
    onAddTrainer: (provider) => setTrainerForm({ open: true, trainer: null, presetProvider: provider }),
  });

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
        transition: { duration: 0.2, ease: "easeOut" },
      };

  return (
    <ConfigProvider theme={TRAINING_THEME}>
      <main className="training-suite space-y-6 py-6">
        {actions.contextHolder}
        <TrainingPageHeader
          header_text="Trainers & Providers"
          breadCrumb_data={[{ name: "HR" }, { name: "Skill management" }, { name: "Trainers & Providers" }]}
          subtitle="Human Resources / Skill management"
          buttonProp={[
            { button_text: "Register Provider", fn: () => setProviderForm({ open: true, provider: null }) },
            { button_text: "Add Trainer", fn: () => setTrainerForm({ open: true, trainer: null, presetProvider: null }) },
          ]}
        />

        <ProvidersOverviewStrip
          onShowTrainers={() => setTab("trainers")}
          onShowAlerts={() => {
            setProviderFilters({ ...DEFAULT_PROVIDER_FILTERS, alerts_only: true });
            setTab("providers");
          }}
        />

        <TrainingPageTabs tabs={TABS} active={activeTab} onChange={setTab} idPrefix="providers" label="Directory sections" />

        <AnimatePresence mode="wait" initial={false}>
          <motion.section key={activeTab} {...tabPanelProps("providers", activeTab)} {...motionProps}>
            {activeTab === "providers" ? (
              <ProvidersTab
                filters={providerFilters}
                onFiltersChange={setProviderFilters}
                onOpenProvider={setOpenProviderId}
                actions={actions}
              />
            ) : (
              <TrainersTab
                filters={trainerFilters}
                onFiltersChange={setTrainerFilters}
                onOpenTrainer={setOpenTrainerId}
                actions={actions}
              />
            )}
          </motion.section>
        </AnimatePresence>

        <ProviderDetailDrawer
          open={Boolean(openProviderId)}
          providerId={openProviderId}
          onClose={() => setOpenProviderId(null)}
          onOpenTrainer={setOpenTrainerId}
          actions={actions}
        />
        <TrainerDetailDrawer
          open={Boolean(openTrainerId)}
          trainerId={openTrainerId}
          onClose={() => setOpenTrainerId(null)}
          onOpenProvider={setOpenProviderId}
          actions={actions}
        />
        <ProviderFormDrawer
          open={providerForm.open}
          provider={providerForm.provider}
          onClose={() => setProviderForm(CLOSED_PROVIDER_FORM)}
        />
        <TrainerFormDrawer
          open={trainerForm.open}
          trainer={trainerForm.trainer}
          presetProvider={trainerForm.presetProvider}
          onClose={() => setTrainerForm(CLOSED_TRAINER_FORM)}
        />
      </main>
    </ConfigProvider>
  );
}
