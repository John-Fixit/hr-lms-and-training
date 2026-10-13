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
  useApproveCourse,
  useCompleteTraining,
  useGetMyTrainingRequest,
  useGetCourseParticipants,
  useGetTrainingReviews,
  useGetTrainingByID,
} from "../../../API/training";
import { errorToast, successToast } from "../../../utils/toastMsgPop";
import useCurrentUser from "../../../hooks/useCurrentUser";
import RequestCard from "../../Approval/RequestCard";
import { MdOutlinePending } from "react-icons/md";
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
    id: "approved",
    label: "Approved",
    icon: AiOutlineFileDone,
    b_color: "bg-green-100",
    t_color: "text-green-600",
  },
];

const HrCourseTraining = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [whatTodo, setWhatTodo] = useState("");
  const [editTrainingData, setEditTrainingData] = useState(null);

  const [yearFilter, setYearFilter] = useState(null);

  // View Staff drawer: fetch staff first, then open
  const [staffDrawerOpen, setStaffDrawerOpen] = useState(false);
  const [selectedTrainingForStaff, setSelectedTrainingForStaff] =
    useState(null);
  const [staffListForDrawer, setStaffListForDrawer] = useState([]);
  const [isReviewView, setIsReviewView] = useState(false);

  const [selectedTab, setSelectedTab] = useState("awaiting");

  const { userData } = useCurrentUser();

  const { mutateAsync: fetchCourseParticipants, isPending: staffLoading } =
    useGetCourseParticipants();
  const { mutateAsync: fetchTrainingReview, isPending: reviewLoading } =
    useGetTrainingReviews();
  const { mutateAsync: fetchTrainingById } = useGetTrainingByID();

  const { data: pendingTrainingList, isPending: pendingTrainingLoading } =
    useGetMyTrainingRequest({
      company_id: userData?.data?.COMPANY_ID,
      staff_id: userData?.data?.STAFF_ID,
      status: "pending",
      year: yearFilter,
    });
  const { data: approvedTrainingList, isPending: approvedTrainingLoading } =
    useGetMyTrainingRequest({
      company_id: userData?.data?.COMPANY_ID,
      staff_id: userData?.data?.STAFF_ID,
      status: "approved",
      year: yearFilter,
    });
  const detailsNo = (value) => {
    if (value == "awaiting") {
      return pendingTrainingList;
    } else if (value == "approved") {
      return approvedTrainingList;
    }
  };

  const trainingList = detailsNo(selectedTab);

  const tableData = Array.isArray(trainingList) ? trainingList : [];

  const selectTab = (value) => {
    setSelectedTab(value);
  };

  const addNew = useCallback(() => {
    setEditTrainingData(null);
    setWhatTodo("add");
    setIsOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsOpen(false);
    setWhatTodo("");
    setEditTrainingData(null);
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
        const list = await fetchCourseParticipants({
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
    [fetchCourseParticipants],
  );

  const handleCloseStaffDrawer = useCallback(() => {
    setStaffDrawerOpen(false);
    setSelectedTrainingForStaff(null);
    setStaffListForDrawer([]);
    setIsReviewView(false);
  }, []);

  const { mutateAsync: mutateApprove } = useApproveCourse();
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

  const handleEditCourse = useCallback(
    async (row) => {
      try {
        const data = await fetchTrainingById({
          trainingID: row?.TRAINING_ID,
        });
        setEditTrainingData(data || row);
        setWhatTodo("edit");
        setIsOpen(true);
      } catch (err) {
        errorToast(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load course details",
        );
      }
    },
    [fetchTrainingById],
  );

  return (
    <div className="py-8 font-helvetica">
      <Header addNew={addNew} courseOnly={true} />
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
          approved: approvedTrainingLoading,
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
          onEditCourse={handleEditCourse}
          courseOnly={true}
        />
      </div>

      {(whatTodo === "add" || whatTodo === "edit") && (
        <NewTrainingDrawer
          whatTodo={whatTodo}
          isOpen={isOpen}
          setIsOpen={handleCloseDrawer}
          courseOnly={true}
          initialFormValue={whatTodo === "edit" ? editTrainingData : undefined}
        />
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
              const list = await fetchCourseParticipants({
                training_id: selectedTrainingForStaff.TRAINING_ID,
              });
              setStaffListForDrawer(Array.isArray(list) ? list : []);
            } catch {
              setStaffListForDrawer([]);
            }
          }}
          viewFrom={"hr-training"}
          courseOnly={true}
        />
      )}
    </div>
  );
};

export default HrCourseTraining;
