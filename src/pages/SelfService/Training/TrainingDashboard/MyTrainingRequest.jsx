/* eslint-disable no-unused-vars */
import { useState, useCallback } from "react";
import { ConfigProvider } from "antd";
import {
  BadgeCheck,
  CheckCircle2,
  FileText,
  Hourglass,
  XCircle,
} from "lucide-react";
import useCurrentUser from "../../../../hooks/useCurrentUser.jsx";
import {
  useGetMyTrainingRequest,
  useGetTrainingParticipants,
  useSeenTrainingNotification,
} from "../../../../API/training.js";
import TrainingTable from "../../../../components/core/training/TrainingTable.jsx";
import { ViewStaffDrawer } from "../../../../components/core/training/index.js";
import TrainingPageHeader from "../../../../components/core/training/shared/TrainingPageHeader.jsx";
import TrainingPageTabs from "../../../../components/core/training/shared/TrainingPageTabs.jsx";
import TrainingStatusStrip from "../../../../components/core/training/shared/TrainingStatusStrip.jsx";
import { TRAINING_THEME } from "../../../../components/core/training/shared/trainingTheme.js";
import "../../../../components/core/training/shared/trainingDesignSystem.css";
import { errorToast } from "../../../../utils/toastMsgPop.js";
import { NewTrainingDrawer } from "../../../../components/core/training/create-new-training/NewTraining.jsx";

const REQUEST_TABS = [
  { id: "draft", label: "Draft", icon: FileText, sub: "Not submitted" },
  { id: "pending", label: "Pending", icon: Hourglass, sub: "Awaiting approval" },
  { id: "approved", label: "Approved", icon: CheckCircle2, sub: "Line manager approved" },
  { id: "hr approved", label: "HR Approved", icon: BadgeCheck, sub: "Cleared by HR" },
  { id: "completed", label: "Completed", icon: CheckCircle2, sub: "Finished" },
  { id: "declined", label: "Declined", icon: XCircle, sub: "Not approved" },
];

export default function MyTrainingRequest() {
  // drawer data
  const [selectedTab, setSelectedTab] = useState("pending");

  const { userData } = useCurrentUser();

  const { mutateAsync: seenTrainingNotification } =
    useSeenTrainingNotification();

  const handleSeenTrainingNotification = useCallback(
    async (training_id) => {
      await seenTrainingNotification({
        staff_id: userData?.data?.STAFF_ID,
        training_id: training_id,
      });
    },
    [seenTrainingNotification, userData?.data?.STAFF_ID],
  );

  // useEffect(() => {
  //   handleSeenTrainingNotification();
  // }, [handleSeenTrainingNotification]);

  const { data: pendingTrainingList, isPending: pending_loading } =
    useGetMyTrainingRequest({
      staff_id: userData?.data?.STAFF_ID,
      status: "pending",
    });
  const { data: approvedTrainingList, isPending: approved_loading } =
    useGetMyTrainingRequest({
      staff_id: userData?.data?.STAFF_ID,
      status: "approved",
    });
  const { data: hrApprovedTrainingList, isPending: hr_approved_loading } =
    useGetMyTrainingRequest({
      staff_id: userData?.data?.STAFF_ID,
      status: "hr approved",
    });
  const { data: completedTrainingList, isPending: completed_loading } =
    useGetMyTrainingRequest({
      staff_id: userData?.data?.STAFF_ID,
      status: "completed",
    });
  const { data: declinedTrainingList, isPending: declined_loading } =
    useGetMyTrainingRequest({
      staff_id: userData?.data?.STAFF_ID,
      status: "declined",
    });

  const { mutateAsync: fetchTrainingParticipants, isPending: staffLoading } =
    useGetTrainingParticipants();

  const [staffListForDrawer, setStaffListForDrawer] = useState([]);
  const [isReviewView, setIsReviewView] = useState(false);

  const detailsNo = (value) => {
    if (value == "pending") {
      return pendingTrainingList;
    } else if (value == "approved") {
      return approvedTrainingList;
    } else if (value == "hr approved") {
      return hrApprovedTrainingList;
    } else if (value == "completed") {
      return completedTrainingList;
    } else if (value == "declined") {
      return declinedTrainingList;
    }
  };

  const trainingList = detailsNo(selectedTab);

  const tableData = Array.isArray(trainingList) ? trainingList : [];

  const selectTab = (value) => {
    setSelectedTab(value);
  };

  const [selectedTrainingForStaff, setSelectedTrainingForStaff] =
    useState(null);
  const [staffDrawerOpen, setStaffDrawerOpen] = useState(false);

  const handleViewStaff = useCallback(
    async (row) => {
      setSelectedTrainingForStaff(row);
      setStaffListForDrawer([]);
      setIsReviewView(false);
      setStaffDrawerOpen(true);
      try {
        const list = await fetchTrainingParticipants({
          training_id: row.TRAINING_ID,
        });
        setStaffListForDrawer(Array.isArray(list) ? list : []);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load staff";
        errorToast(msg);
        setStaffListForDrawer([]);
      }
    },
    [fetchTrainingParticipants],
  );

  const handleCloseStaffDrawer = useCallback(() => {
    setStaffDrawerOpen(false);
    setSelectedTrainingForStaff(null);
  }, []);

  const [isOpen, setIsOpen] = useState(false);

  const handleAddNewTraining = () => {
    setIsOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsOpen(false);
  };

  return (
    <ConfigProvider theme={TRAINING_THEME}>
      <main className="training-suite space-y-6 py-6">
        <TrainingPageHeader
          header_text="Training Approval"
          breadCrumb_data={[
            { name: "Self service" },
            { name: "Training Approval" },
          ]}
          subtitle="Self service / Training"
          buttonProp={[
            { button_text: "Add New Training", fn: handleAddNewTraining },
          ]}
        />
        <TrainingStatusStrip
          items={REQUEST_TABS.map((tab) => ({
            ...tab,
            count: Array.isArray(detailsNo(tab.id)) ? detailsNo(tab.id).length : 0,
          }))}
          active={selectedTab}
          onChange={selectTab}
          loading={
            pending_loading ||
            approved_loading ||
            hr_approved_loading ||
            completed_loading ||
            declined_loading
          }
        />
        <TrainingPageTabs
          tabs={REQUEST_TABS.map((tab) => ({
            ...tab,
            count: Array.isArray(detailsNo(tab.id)) ? detailsNo(tab.id).length : 0,
          }))}
          active={selectedTab}
          onChange={selectTab}
          idPrefix="hr-training-requests"
          label="Request status"
        />

        <div>
          <TrainingTable
            tableData={tableData}
            selectedTab={selectedTab}
            pageName="hr-training"
            onViewStaff={(row) => handleViewStaff(row)}
          />
        </div>

        <NewTrainingDrawer isOpen={isOpen} setIsOpen={handleCloseDrawer} />

        <ViewStaffDrawer
          open={staffDrawerOpen}
          onClose={handleCloseStaffDrawer}
          trainingId={selectedTrainingForStaff?.TRAINING_ID}
          trainingTitle={selectedTrainingForStaff?.TRAINING_TITLE}
          trainingStatus={selectedTab}
          staffTraining={selectedTrainingForStaff}
        />

        <ViewStaffDrawer
          open={staffDrawerOpen}
          onClose={handleCloseStaffDrawer}
          trainingId={selectedTrainingForStaff?.TRAINING_ID}
          trainingTitle={selectedTrainingForStaff?.TRAINING_TITLE}
          trainingStatus={selectedTab}
          staffList={staffListForDrawer}
          loading={staffLoading}
          staffTraining={selectedTrainingForStaff}
          onRemoveSuccess={async () => {
            if (!selectedTrainingForStaff?.TRAINING_ID) return;
            try {
              const list = await fetchTrainingParticipants({
                training_id: selectedTrainingForStaff.TRAINING_ID,
              });
              setStaffListForDrawer(Array.isArray(list) ? list : []);
            } catch {
              setStaffListForDrawer([]);
            }
          }}
        />
      </main>
    </ConfigProvider>
  );
}

//Dashboard
//Courses
//DTA
//Travelings
