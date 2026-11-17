import { useState, useCallback } from "react";
import { ConfigProvider } from "antd";
import { CheckCircle2, Hourglass, Send } from "lucide-react";
import { NewTrainingDrawer } from "../../../components/core/training/create-new-training/NewTraining";
import {
  TrainingTable,
  ViewStaffDrawer,
  TrainingReviewListDrawer,
} from "../../../components/core/training";
import TrainingPageHeader from "../../../components/core/training/shared/TrainingPageHeader";
import TrainingPageTabs from "../../../components/core/training/shared/TrainingPageTabs";
import TrainingStatusStrip from "../../../components/core/training/shared/TrainingStatusStrip";
import { TRAINING_THEME } from "../../../components/core/training/shared/trainingTheme";
import "../../../components/core/training/shared/trainingDesignSystem.css";
import {
  useApproveTraining,
  useCompleteTraining,
  useGetTraining,
  useGetTrainingParticipants,
  useGetTrainingReviews,
} from "../../../API/training";
import { errorToast, successToast } from "../../../utils/toastMsgPop";
import useCurrentUser from "../../../hooks/useCurrentUser";
import { useSaveStaffSkill } from "../../../API/trainingSkills";
import { awardSkillsForCompletedTraining } from "../../../components/core/training/shared/awardCompletionSkills";

const NOTIFICATION_TABS = [
  { id: "awaiting", label: "Awaiting", icon: Hourglass, sub: "Not yet sent" },
  { id: "sent", label: "Sent", icon: Send, sub: "Issued to staff" },
  { id: "completed", label: "Completed", icon: CheckCircle2, sub: "Finished" },
];

const HrTraining = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [whatTodo, setWhatTodo] = useState("");

  const [yearFilter, setYearFilter] = useState(null);

  // View Staff drawer: fetch staff first, then open
  const [staffDrawerOpen, setStaffDrawerOpen] = useState(false);
  const [selectedTrainingForStaff, setSelectedTrainingForStaff] =
    useState(null);
  const [staffListForDrawer, setStaffListForDrawer] = useState([]);
  const [isReviewView, setIsReviewView] = useState(false);

  const [selectedTab, setSelectedTab] = useState("awaiting");

  const { userData } = useCurrentUser();

  const { mutateAsync: fetchTrainingParticipants, isPending: staffLoading } =
    useGetTrainingParticipants();
  const { mutateAsync: fetchTrainingReview, isPending: reviewLoading } =
    useGetTrainingReviews();

  const { data: pendingTrainingList, isPending: pendingTrainingLoading } =
    useGetTraining({
      company_id: userData?.data?.COMPANY_ID,
      staff_id: userData?.data?.STAFF_ID,
      status: "awaiting",
      year: yearFilter,
    });
  const { data: draftTrainingList, isPending: draftTrainingLoading } =
    useGetTraining({
      company_id: userData?.data?.COMPANY_ID,
      staff_id: userData?.data?.STAFF_ID,
      status: "sent",
      year: yearFilter,
    });
  const { data: completedTrainingList, isPending: completedTrainingLoading } =
    useGetTraining({
      company_id: userData?.data?.COMPANY_ID,
      staff_id: userData?.data?.STAFF_ID,
      status: "completed",
      year: yearFilter,
    });

  const detailsNo = (value) => {
    if (value == "awaiting") {
      return pendingTrainingList;
    } else if (value == "sent") {
      return draftTrainingList;
    } else if (value == "completed") {
      return completedTrainingList;
    }
  };

  const trainingList = detailsNo(selectedTab);

  const tableData = Array.isArray(trainingList) ? trainingList : [];

  const selectTab = (value) => {
    setSelectedTab(value);
  };

  const addNew = useCallback(() => {
    setWhatTodo("add");
    setIsOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsOpen(false);
    setWhatTodo("");
  }, []);

  /** View Staff: fetch from API then open drawer with staff list */
  const handleViewStaffReview = useCallback(
    async (row) => {
      setSelectedTrainingForStaff(row);
      setStaffListForDrawer([]);
      setIsReviewView(true);
      setStaffDrawerOpen(true);
      try {
        const list = await fetchTrainingReview({
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
    [fetchTrainingReview],
  );
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
    setStaffListForDrawer([]);
    setIsReviewView(false);
  }, []);

  const { mutateAsync: mutateApprove } = useApproveTraining();
  const { mutateAsync: mutateComplete } = useCompleteTraining();
  const { mutateAsync: saveStaffSkill } = useSaveStaffSkill();

  /** Approve – connect your API here (e.g. training_id: row.TRAINING_ID) */
  const handleApprove = useCallback(
    async (row, additionalJson) => {
      try {
        const json = {
          training_id: row.TRAINING_ID,
          staff_id: userData?.data?.STAFF_ID,
          company_id: userData?.data?.COMPANY_ID,
          ...additionalJson,
        };
        const res = await mutateApprove(json);

        successToast(res?.data?.message || res?.message);
      } catch (err) {
        errorToast(
          err?.response?.data?.message || err?.message || "Failed to approve",
        );
      }
    },
    [mutateApprove, userData?.data?.STAFF_ID, userData?.data?.COMPANY_ID],
  );
  const handleComplete = useCallback(
    async (row) => {
      try {
        const res = await mutateComplete({
          training_id: row.TRAINING_ID,
          company_id: userData?.data?.COMPANY_ID,
        });
        await awardSkillsForCompletedTraining({
          row,
          fetchParticipants: fetchTrainingParticipants,
          saveStaffSkill,
        });
        successToast(res?.data?.message || res?.message);
        // refetch();
      } catch (err) {
        errorToast(
          err?.response?.data?.message || err?.message || "Failed to approve",
        );
      }
    },
    [mutateComplete, userData?.data?.COMPANY_ID, fetchTrainingParticipants, saveStaffSkill],
  );

  return (
    <ConfigProvider theme={TRAINING_THEME}>
    <div className="training-suite space-y-6 py-6">
      <TrainingPageHeader
        header_text="Course Notification"
        breadCrumb_data={[
          { name: "HR" },
          { name: "Training" },
          { name: "Course Notification" },
        ]}
        buttonProp={[{ button_text: "Create Notification", fn: addNew }]}
      />
      <TrainingStatusStrip
        items={NOTIFICATION_TABS.map((tab) => ({
          ...tab,
          count: Array.isArray(detailsNo(tab.id)) ? detailsNo(tab.id).length : 0,
        }))}
        active={selectedTab}
        onChange={selectTab}
        loading={pendingTrainingLoading || draftTrainingLoading || completedTrainingLoading}
      />
      <TrainingPageTabs
        tabs={NOTIFICATION_TABS.map((tab) => ({
          ...tab,
          count: Array.isArray(detailsNo(tab.id)) ? detailsNo(tab.id).length : 0,
        }))}
        active={selectedTab}
        onChange={selectTab}
        idPrefix="hr-course-notification"
        label="Notification status"
      />
      <div>
        <TrainingTable
          tableData={tableData}
          onViewStaff={handleViewStaff}
          onApprove={handleApprove}
          selectedTab={selectedTab}
          oncomplete={handleComplete}
          onViewStaffReview={handleViewStaffReview}
          pageName="hr-training"
          setYearFilter={setYearFilter}
          yearFilter={yearFilter}
        />
      </div>

      {whatTodo === "add" && (
        <NewTrainingDrawer isOpen={isOpen} setIsOpen={handleCloseDrawer} />
      )}

      {isReviewView ? (
        <TrainingReviewListDrawer
          open={staffDrawerOpen}
          onClose={handleCloseStaffDrawer}
          trainingTitle={selectedTrainingForStaff?.TRAINING_TITLE}
          training={selectedTrainingForStaff}
          reviews={staffListForDrawer}
          loading={reviewLoading}
        />
      ) : (
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
          viewFrom={"hr-training"}
        />
      )}
    </div>
    </ConfigProvider>
  );
};

export default HrTraining;
