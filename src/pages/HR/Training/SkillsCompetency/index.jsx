import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ConfigProvider } from "antd";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BookOpen, LayoutGrid, Users } from "lucide-react";
import TrainingPageHeader from "../../../../components/core/training/shared/TrainingPageHeader";
import "../../../../components/core/training/shared/trainingDesignSystem.css";
import TrainingPageTabs from "../../../../components/core/training/shared/TrainingPageTabs";
import {
  TRAINING_THEME,
  tabPanelProps,
} from "../../../../components/core/training/shared/trainingTheme";
import SkillsOverviewStrip from "../../../../components/core/training/skills/SkillsOverviewStrip";
import SkillsDirectory from "../../../../components/core/training/skills/SkillsDirectory";
import SkillsLibrary from "../../../../components/core/training/skills/SkillsLibrary";
import SkillsMatrix from "../../../../components/core/training/skills/SkillsMatrix";
import StaffSkillProfileDrawer from "../../../../components/core/training/skills/StaffSkillProfileDrawer";
import StaffSkillFormDrawer from "../../../../components/core/training/skills/StaffSkillFormDrawer";
import { DEFAULT_DIRECTORY_FILTERS } from "../../../../components/core/training/skills/skillsConstants";

const TABS = [
  { id: "matrix", label: "Skills Matrix", icon: LayoutGrid },
  { id: "directory", label: "Skills Directory", icon: Users },
  { id: "library", label: "Skills Library", icon: BookOpen },
];
const TAB_IDS = TABS.map((tab) => tab.id);

export default function SkillsCompetency() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = TAB_IDS.includes(tabParam) ? tabParam : "matrix";
  const reduceMotion = useReducedMotion();

  const [filters, setFilters] = useState(DEFAULT_DIRECTORY_FILTERS);
  const [profileStaffId, setProfileStaffId] = useState(null);
  const [skillForm, setSkillForm] = useState({ open: false, staff: null, record: null });

  const setTab = useCallback(
    (tab) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === "matrix") next.delete("tab");
          else next.set("tab", tab);
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  const showDirectory = useCallback(
    (patch) => {
      setFilters({ ...DEFAULT_DIRECTORY_FILTERS, ...patch });
      setTab("directory");
    },
    [setTab],
  );

  const openSkillForm = useCallback(
    (staff = null, record = null) => setSkillForm({ open: true, staff, record }),
    [],
  );

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
        <TrainingPageHeader
          header_text="Skills & Competency"
          breadCrumb_data={[{ name: "HR" }, { name: "Skill management" }, { name: "Skills & Competency" }]}
          subtitle="Human Resources / Skill management"
          buttonProp={[{ button_text: "Record Staff Skill", fn: () => openSkillForm() }]}
        />

        <SkillsOverviewStrip
          onShowPending={() => showDirectory({ verification: "pending" })}
          onShowSkill={(skillId) => showDirectory({ skill_ids: [skillId] })}
        />

        <TrainingPageTabs
          tabs={TABS}
          active={activeTab}
          onChange={setTab}
          idPrefix="skills"
          label="Skills sections"
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.section key={activeTab} {...tabPanelProps("skills", activeTab)} {...motionProps}>
            {activeTab === "matrix" ? (
              <SkillsMatrix />
            ) : activeTab === "directory" ? (
              <SkillsDirectory
                filters={filters}
                onFiltersChange={setFilters}
                onOpenProfile={setProfileStaffId}
                onRecordSkill={(staff) => openSkillForm(staff)}
              />
            ) : (
              <SkillsLibrary onViewStaff={(skillId) => showDirectory({ skill_ids: [skillId] })} />
            )}
          </motion.section>
        </AnimatePresence>

        <StaffSkillProfileDrawer
          open={Boolean(profileStaffId)}
          staffId={profileStaffId}
          onClose={() => setProfileStaffId(null)}
          onAddSkill={(staff) => openSkillForm(staff)}
          onEditSkill={(staff, record) => openSkillForm(staff, record)}
        />

        <StaffSkillFormDrawer
          open={skillForm.open}
          staff={skillForm.staff}
          record={skillForm.record}
          onClose={() => setSkillForm({ open: false, staff: null, record: null })}
        />
      </main>
    </ConfigProvider>
  );
}
