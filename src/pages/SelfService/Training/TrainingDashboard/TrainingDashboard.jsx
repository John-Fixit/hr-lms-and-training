/* eslint-disable no-unused-vars */
import { useState, useCallback } from "react";
import { ConfigProvider, Drawer } from "antd";
import { Building2, CheckCircle2, Hourglass } from "lucide-react";
import useCurrentUser from "../../../../hooks/useCurrentUser.jsx";
import {
  useGetCoordinatorTrainingStaff,
  useGetMyTraining,
  useSeenTrainingNotification,
} from "../../../../API/training.js";
import TrainingTable from "../../../../components/core/training/TrainingTable.jsx";
import {
  TrainingReviewDrawer,
  ViewStaffDrawer,
} from "../../../../components/core/training/index.js";
import TrainingCategoryNotificationTemplate from "../../../../components/core/templates/TrainingCategoryNotificationTemplate.jsx";
import TrainingPageHeader from "../../../../components/core/training/shared/TrainingPageHeader.jsx";
import TrainingPageTabs from "../../../../components/core/training/shared/TrainingPageTabs.jsx";
import TrainingStatusStrip from "../../../../components/core/training/shared/TrainingStatusStrip.jsx";
import { TRAINING_THEME } from "../../../../components/core/training/shared/trainingTheme.js";
import "../../../../components/core/training/shared/trainingDesignSystem.css";
import { errorToast } from "../../../../utils/toastMsgPop.js";
import BookFlightDrawer from "../../../../components/core/templates/BookFlightDrawer.jsx";

const MY_TRAINING_TABS = [
  { id: "awaiting", label: "Awaiting", icon: Hourglass, sub: "Upcoming or in progress" },
  { id: "completed", label: "Completed", icon: CheckCircle2, sub: "Finished" },
  { id: "regional", label: "RM/Directorate", icon: Building2, sub: "Regional nominations" },
];
export default function TrainingDashboard() {
  // drawer data
  const [selectedTab, setSelectedTab] = useState("awaiting");
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [selectedTrainingForReview, setSelectedTrainingForReview] =
    useState(null);
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

  const { data: pendingTrainingList, isPending: pendingTrainingLoading } =
    useGetMyTraining({
      staff_id: userData?.data?.STAFF_ID, //2003
      status: "awaiting",
    });
  const { data: completedTrainingList, isPending: completedTrainingLoading } =
    useGetMyTraining({
      staff_id: userData?.data?.STAFF_ID,
      status: "completed",
    });
  const { data: regionalTrainingList, isPending: regionalTrainingLoading } =
    useGetMyTraining({
      staff_id: userData?.data?.STAFF_ID,
      status: "regional",
    });

  const detailsNo = (value) => {
    if (value == "awaiting") {
      return pendingTrainingList;
    } else if (value == "completed") {
      return completedTrainingList;
    } else if (value == "regional") {
      return regionalTrainingList;
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
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [selectedTrainingForTemplate, setSelectedTrainingForTemplate] =
    useState(null);
  const { mutateAsync: fetchCoordinatorTrainingStaff } =
    useGetCoordinatorTrainingStaff();

  const [bookFlightOpen, setBookFlightOpen] = useState({ state: false });

  const handleViewStaff = async (row) => {
    if (selectedTab === "regional") {
      try {
        const list = await fetchCoordinatorTrainingStaff({
          staff_id: userData?.data?.STAFF_ID,
          training_id: row.TRAINING_ID,
        });
        setSelectedTrainingForStaff({ ...row, ...list });
        setStaffDrawerOpen(true);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load staff";
        errorToast(msg);
      }
    } else {
      setSelectedTrainingForStaff(row);
      setStaffDrawerOpen(true);
    }

    // setSelectedTrainingForStaff(row);
    // // setStaffListForDrawer([]);
    // // setIsReviewView(false);
    // setStaffDrawerOpen(true);
    // try {
    //   const list = await fetchTrainingParticipants({
    //     training_id: row.TRAINING_ID,
    //   });
    //   setStaffListForDrawer(Array.isArray(list) ? list : []);
    // } catch (err) {
    //   const msg =
    //     err?.response?.data?.message ||
    //     err?.message ||
    //     "Failed to load staff";
    //   errorToast(msg);
    //   setStaffListForDrawer([]);
    // }
  };

  const handleCloseStaffDrawer = useCallback(() => {
    setStaffDrawerOpen(false);
    setSelectedTrainingForStaff(null);
  }, []);

  const [isOpen, setIsOpen] = useState(false);

  const handleViewNominationTemplate = useCallback((row) => {
    setSelectedTrainingForTemplate(row);
    setTemplateDrawerOpen(true);
  }, []);

  const handleBookFlightNow = (row) => {
    setBookFlightOpen({ state: true, training: row });
  }

  return (
    <ConfigProvider theme={TRAINING_THEME}>
      <main className="training-suite space-y-6 py-6">
        <TrainingPageHeader
          header_text="My Training"
          breadCrumb_data={[{ name: "Internal" }, { name: "Training" }, { name: "My Training" }]}
          subtitle="Internal / Training"
        />
        <TrainingStatusStrip
          items={MY_TRAINING_TABS.map((tab) => ({
            ...tab,
            count: Array.isArray(detailsNo(tab.id)) ? detailsNo(tab.id).length : 0,
          }))}
          active={selectedTab}
          onChange={selectTab}
          loading={pendingTrainingLoading || completedTrainingLoading || regionalTrainingLoading}
        />
        <TrainingPageTabs
          tabs={MY_TRAINING_TABS.map((tab) => ({
            ...tab,
            count: Array.isArray(detailsNo(tab.id)) ? detailsNo(tab.id).length : 0,
          }))}
          active={selectedTab}
          onChange={selectTab}
          idPrefix="my-training"
          label="My training status"
        />

        <div>
          <TrainingTable
            tableData={tableData}
            selectedTab={selectedTab}
            pageName="self-service"
            onReview={(row) => {
              setSelectedTrainingForReview(row);
              setReviewDrawerOpen(true);
            }}
            onViewStaff={(row) => handleViewStaff(row)}
            onViewNominationTemplate={handleViewNominationTemplate}
            handleBookFlightNow={handleBookFlightNow}
          />
        </div>

        {/* <NewTrainingDrawer isOpen={isOpen} setIsOpen={handleCloseDrawer} /> */}

        <TrainingReviewDrawer
          open={reviewDrawerOpen}
          onClose={() => {
            setReviewDrawerOpen(false);
            setSelectedTrainingForReview(null);
          }}
          training={selectedTrainingForReview}
          onSuccess={() => {
            // Optional: refetch is handled by API hook invalidation
          }}
        />

        <ViewStaffDrawer
          open={staffDrawerOpen}
          onClose={handleCloseStaffDrawer}
          trainingId={selectedTrainingForStaff?.TRAINING_ID}
          trainingTitle={selectedTrainingForStaff?.TRAINING_TITLE}
          trainingStatus={selectedTab}
          staffTraining={selectedTrainingForStaff}
          viewFrom="self-service"
        />

        <BookFlightDrawer
          open={bookFlightOpen.state}
          onClose={() => setBookFlightOpen({ state: false })}
          training={bookFlightOpen?.training}
        />

        <Drawer
          title="Training Notification"
          open={templateDrawerOpen}
          onClose={() => {
            setTemplateDrawerOpen(false);
            setSelectedTrainingForTemplate(null);
          }}
          width={850}
          className="font-helvetica"
          classNames={{
            body: "bg-slate-100",
          }}
        >
          <TrainingCategoryNotificationTemplate
            training={selectedTrainingForTemplate}
          />
        </Drawer>
      </main>
    </ConfigProvider>
  );
}

//Dashboard
//Courses
//DTA
//Travelings
