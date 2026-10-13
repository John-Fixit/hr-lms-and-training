import { useState, useCallback } from "react";
import Header from "./components/Header";
import Separator from "../../../components/payroll_components/Separator";
import { NewTrainingDrawer } from "../../../components/core/training/create-new-training/NewTraining";
import {
  TrainingTable,
  ViewStaffDrawer,
  TrainingReviewListDrawer,
} from "../../../components/core/training";
import {
  useApproveTraining,
  useCompleteTraining,
  useGetTraining,
  useGetTrainingParticipants,
  useGetTrainingReviews,
} from "../../../API/training";
import { errorToast, successToast } from "../../../utils/toastMsgPop";
import useCurrentUser from "../../../hooks/useCurrentUser";
import RequestCard from "../../Approval/RequestCard";
import { MdOutlinePending } from "react-icons/md";
import { FaFirstdraft } from "react-icons/fa6";
import { AiOutlineFileDone } from "react-icons/ai";

const statusData = [
  {
    id: "awaiting",
    label: "Awaiting",
    icon: MdOutlinePending,
    b_color: "bg-amber-100",
    t_color: "text-amber-600",
  },
  {
    id: "sent",
    label: "Sent",
    icon: FaFirstdraft,
    b_color: "bg-purple-100",
    t_color: "text-purple-600",
  },
  {
    id: "completed",
    label: "Completed",
    icon: AiOutlineFileDone,
    b_color: "bg-green-100",
    t_color: "text-green-600",
  },
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
        successToast(res?.data?.message || res?.message);
        // refetch();
      } catch (err) {
        errorToast(
          err?.response?.data?.message || err?.message || "Failed to approve",
        );
      }
    },
    [mutateComplete, userData?.data?.COMPANY_ID],
  );

  return (
    <div className="py-8 font-helvetica">
      <Header addNew={addNew} />
      <div className="mb-6">
        <Separator separator_text={"History"} />
      </div>
    
      <RequestCard
        requestHistory={statusData}
        selectTab={selectTab}
        requestStatus={selectedTab}
        requestNo={detailsNo}
        loading={{
          awaiting: pendingTrainingLoading,
          sent: draftTrainingLoading,
          completed: completedTrainingLoading,
        }}
      />
      <div className="my-8">
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
  );
};

export default HrTraining;
