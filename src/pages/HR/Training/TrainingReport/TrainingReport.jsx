import { useState } from "react";
import PropTypes from "prop-types";
import { Card, CardBody, Button } from "@nextui-org/react";
import TrainingReportDashboard from "../../../../components/core/training/training-reports/TrainingReportDashboard";
import {
  HiChartBar,
  HiSparkles,
  HiCalendar,
  HiDocumentText,
} from "react-icons/hi2";
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
  { key: TAB_KEYS.GRAPHICAL, title: "Graphical Report", icon: HiChartBar },
  { key: TAB_KEYS.AI, title: "AI Report", icon: HiSparkles },
  { key: TAB_KEYS.QUARTERLY, title: "Quarterly Report", icon: HiCalendar },
  { key: TAB_KEYS.ANNUAL, title: "Annual Report", icon: HiDocumentText },
];

function ComingSoonPanel({ title, icon: Icon }) {
  return (
    <Card className="border-2 border-dashed border-default-200 bg-default-50/50">
      <CardBody className="flex flex-col items-center justify-center min-h-[320px] gap-4 py-16">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-default-200 text-default-500">
          {Icon && <Icon className="w-8 h-8" />}
        </div>
        <h2 className="text-xl font-semibold text-default-700">{title}</h2>
        <p className="text-sm text-default-500 text-center max-w-sm">
          This report is under development and will be available soon.
        </p>
      </CardBody>
    </Card>
  );
}

ComingSoonPanel.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
};

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
    <div className="w-full max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      {/* Header: title and tab bar horizontal on lg, stacked on sm/md */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-helvetica">
            Training Reports
          </h1>
          <p className="text-default-500 text-sm mt-1 font-helvetica">
            View and analyze training metrics by department and period.
          </p>
        </div>
      </div>
      <div className="flex-shrink-0 w-full lg:w-auto overflow-x-auto pb-1 -mb-1 scrollbar-hide">
        <div
          role="tablist"
          className="flex gap-1 p-1 rounded-lg bg-default-100 border border-default-200 w-max min-w-full lg:min-w-0 font-helvetica"
        >
          {TAB_ITEMS.map((item) => {
            const isSelected = selectedTab === item.key;
            const Icon = item.icon;
            return (
              <Button
                key={item.key}
                role="tab"
                aria-selected={isSelected}
                size="sm"
                variant={isSelected ? "solid" : "light"}
                color={isSelected ? "primary" : "default"}
                className={`min-w-0 font-helvetica whitespace-nowrap ${
                  isSelected
                    ? "bg-[#00BCC2] text-white shadow-sm"
                    : "text-default-600 hover:bg-default-200"
                }`}
                onPress={() => setSelectedTab(item.key)}
                startContent={
                  Icon ? <Icon className="w-4 h-4 shrink-0" /> : null
                }
              >
                {item.title}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Tab panel – full width below header */}
      <div className="pt-2">
        <TabContent activeKey={selectedTab} />
      </div>
    </div>
  );
};

export default TrainingReport;
