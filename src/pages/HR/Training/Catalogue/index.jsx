import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ConfigProvider } from "antd";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BookOpen, FolderKanban } from "lucide-react";
import TrainingPageHeader from "../../../../components/core/training/shared/TrainingPageHeader";
import "../../../../components/core/training/shared/trainingDesignSystem.css";
import TrainingPageTabs from "../../../../components/core/training/shared/TrainingPageTabs";
import {
  TRAINING_THEME,
  tabPanelProps,
} from "../../../../components/core/training/shared/trainingTheme";
import CatalogueOverviewStrip from "../../../../components/core/training/catalogue/CatalogueOverviewStrip";
import CoursesTab from "../../../../components/core/training/catalogue/CoursesTab";
import ProgrammesTab from "../../../../components/core/training/catalogue/ProgrammesTab";
import CourseDetailDrawer from "../../../../components/core/training/catalogue/CourseDetailDrawer";
import CourseFormDrawer from "../../../../components/core/training/catalogue/CourseFormDrawer";
import useCourseActions from "../../../../components/core/training/catalogue/useCourseActions";
import { DEFAULT_COURSE_FILTERS } from "../../../../components/core/training/catalogue/catalogueConstants";

const TABS = [
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "programmes", label: "Programmes", icon: FolderKanban },
];

export default function TrainingCatalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "programmes" ? "programmes" : "courses";
  const reduceMotion = useReducedMotion();

  const [filters, setFilters] = useState(DEFAULT_COURSE_FILTERS);
  const [detailCourseId, setDetailCourseId] = useState(null);
  const [courseForm, setCourseForm] = useState({ open: false, course: null, programmeId: undefined });

  const setTab = useCallback(
    (tab) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === "courses") next.delete("tab");
          else next.set("tab", tab);
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  const showCourses = useCallback(
    (patch) => {
      setFilters({ ...DEFAULT_COURSE_FILTERS, ...patch });
      setTab("courses");
    },
    [setTab],
  );

  const openCourseForm = useCallback(
    (course = null, programmeId = undefined) => setCourseForm({ open: true, course, programmeId }),
    [],
  );

  const actions = useCourseActions({
    onEdit: (course) => openCourseForm(course),
    onDuplicated: (courseId) => setDetailCourseId(courseId),
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
          header_text="Training Catalogue"
          breadCrumb_data={[{ name: "HR" }, { name: "Skill management" }, { name: "Catalogue" }]}
          subtitle="Human Resources / Skill management"
          buttonProp={[{ button_text: "New Course", fn: () => openCourseForm() }]}
        />

        <CatalogueOverviewStrip
          onShowProgrammes={() => setTab("programmes")}
          onShowDrafts={() => showCourses({ status: "DRAFT" })}
          onShowWithoutSkills={() => showCourses({ status: "all", without_skills: true })}
        />

        <TrainingPageTabs
          tabs={TABS}
          active={activeTab}
          onChange={setTab}
          idPrefix="catalogue"
          label="Catalogue sections"
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.section key={activeTab} {...tabPanelProps("catalogue", activeTab)} {...motionProps}>
            {activeTab === "courses" ? (
              <CoursesTab
                filters={filters}
                onFiltersChange={setFilters}
                onOpenCourse={setDetailCourseId}
                onNewCourse={() => openCourseForm()}
                actions={actions}
              />
            ) : (
              <ProgrammesTab
                onViewCourses={(programmeId) => showCourses({ status: "all", programme_id: programmeId })}
                onAddCourse={(programmeId) => openCourseForm(null, programmeId)}
              />
            )}
          </motion.section>
        </AnimatePresence>

        <CourseDetailDrawer
          open={Boolean(detailCourseId)}
          courseId={detailCourseId}
          onClose={() => setDetailCourseId(null)}
          onOpenCourse={setDetailCourseId}
          actions={actions}
        />

        <CourseFormDrawer
          open={courseForm.open}
          course={courseForm.course}
          presetProgrammeId={courseForm.programmeId}
          onClose={() => setCourseForm({ open: false, course: null, programmeId: undefined })}
        />
      </main>
    </ConfigProvider>
  );
}
