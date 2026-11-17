import { useState } from "react";
import PropTypes from "prop-types";
import { ConfigProvider } from "antd";
import { BarChart3, CalendarDays, FileText, Sparkles } from "lucide-react";
import TrainingReportDashboard from "../../../../components/core/training/training-reports/TrainingReportDashboard";
import TrainingPageHeader from "../../../../components/core/training/shared/TrainingPageHeader";
import TrainingPageTabs from "../../../../components/core/training/shared/TrainingPageTabs";
import { TRAINING_THEME } from "../../../../components/core/training/shared/trainingTheme";
import "../../../../components/core/training/shared/trainingDesignSystem.css";
import TrainingAIReportTab from "../../../../components/core/training/training-reports/TrainingAIReportTab";
import TrainingQuarterlyReportTab from "../../../../components/core/training/training-reports/TrainingQuarterlyReportTab";
import TrainingAnnualReportTab from "../../../../components/core/training/training-reports/TrainingAnnualReportTab";

const TAB_KEYS = {
  GRAPHICAL: "graphical",
  AI: "ai",
  QUARTERLY: "quarterly",
  ANNUAL: "annual",
};

const TAB_ITEMS = [
  { id: TAB_KEYS.GRAPHICAL, label: "Graphical Report", icon: BarChart3 },
  { id: TAB_KEYS.AI, label: "AI Report", icon: Sparkles },
  { id: TAB_KEYS.QUARTERLY, label: "Quarterly Report", icon: CalendarDays },
  { id: TAB_KEYS.ANNUAL, label: "Annual Report", icon: FileText },
];

function TabContent({ activeKey }) {
  switch (activeKey) {
    case TAB_KEYS.GRAPHICAL:
      return <TrainingReportDashboard />;
    case TAB_KEYS.AI:
      return <TrainingAIReportTab />;
    case TAB_KEYS.QUARTERLY:
      return <TrainingQuarterlyReportTab />;
    case TAB_KEYS.ANNUAL:
      return <TrainingAnnualReportTab />;
    default:
      return <TrainingReportDashboard />;
  }
}

TabContent.propTypes = {
  activeKey: PropTypes.string.isRequired,
};

const TrainingReport = () => {
  const [selectedTab, setSelectedTab] = useState(TAB_KEYS.GRAPHICAL);

  return (
    <ConfigProvider theme={TRAINING_THEME}>
    <div className="training-suite space-y-6 py-6">
      <TrainingPageHeader
        header_text="Training Reports"
        breadCrumb_data={[{ name: "HR" }, { name: "Training" }, { name: "Report" }]}
        subtitle="Human Resources / Training"
      />
      <TrainingPageTabs
        tabs={TAB_ITEMS}
        active={selectedTab}
        onChange={setSelectedTab}
        idPrefix="hr-training-report"
        label="Report types"
      />
      <div>
        <TabContent activeKey={selectedTab} />
      </div>
    </div>
    </ConfigProvider>
  );
};

export default TrainingReport;
