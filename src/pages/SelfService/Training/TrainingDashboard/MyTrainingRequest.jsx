/* eslint-disable no-unused-vars */
import { useState, useMemo, useEffect, useCallback } from "react";
import PageHeader from "../../../../components/payroll_components/PageHeader.jsx";
import Separator from "../../../../components/payroll_components/Separator.jsx";
// import FormBuilder from "../../../HR/Performance/Setup/FormBuilder.jsx";

import useCurrentUser from "../../../../hooks/useCurrentUser.jsx";
import {
  useGetMyTrainingRequest,
  useGetTrainingParticipants,
  useSeenTrainingNotification,
} from "../../../../API/training.js";
import {
  MdOutlineApproval,
  MdOutlineCancel,
  MdOutlineCheckCircle,
  MdOutlinePending,
} from "react-icons/md";
import { AiOutlineFileDone } from "react-icons/ai";
import TrainingTable from "../../../../components/core/training/TrainingTable.jsx";
import {
  TrainingReviewDrawer,
  ViewStaffDrawer,
} from "../../../../components/core/training/index.js";
import RequestCard from "../../../Approval/RequestCard.jsx";
import { errorToast } from "../../../../utils/toastMsgPop.js";
import { NewTrainingDrawer } from "../../../../components/core/training/create-new-training/NewTraining.jsx";
import { FaFirstdraft } from "react-icons/fa";

const statusData = [
  {
    id: "draft",
    label: "Draft",
    icon: FaFirstdraft,
    b_color: "bg-purple-100",
    t_color: "text-purple-600",
  },
  {
    id: "pending",
    label: "Pending",
    icon: MdOutlinePending,
    b_color: "bg-amber-100",
    t_color: "text-amber-600",
  },

  {
    id: "approved",
    label: "Approved",
    icon: MdOutlineCheckCircle,
    b_color: "bg-green-100",
    t_color: "text-green-600",
  },
  {
    id: "hr approved",
    label: "HR Approved",
    icon: MdOutlineApproval,
    b_color: "bg-green-100",
    t_color: "text-green-600",
  },
  {
    id: "completed",
    label: "Completed",
    icon: AiOutlineFileDone,
    b_color: "bg-blue-100",
    t_color: "text-blue-600",
  },
  {
    id: "declined",
    label: "Declined",
    icon: MdOutlineCancel,
    b_color: "bg-red-100",
    t_color: "text-red-600",
  },
];

export default function MyTrainingRequest() {
  // drawer data
  const [selectedTab, setSelectedTab] = useState("pending");
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [selectedTrainingForReview, setSelectedTrainingForReview] =
    useState(null);

  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

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
    <>
      <main>
        <PageHeader
          header_text={"My Training Request"}
          breadCrumb_data={[{ name: "Self Service" }, { name: "Training" }]}
          btnAvailable={true}
          buttonProp={[
            { button_text: "Add New Training", fn: handleAddNewTraining },
          ]}
        />
        <div className="mt-5">{/* <hr /> */}</div>

        <Separator separator_text={"OVERVIEW"} />
        <RequestCard
          requestHistory={statusData}
          selectTab={selectTab}
          requestStatus={selectedTab}
          requestNo={detailsNo}
          loading={{
            pending: pending_loading,
            approved: approved_loading,
            hr_approved: hr_approved_loading,
            completed: completed_loading,
            declined: declined_loading,
          }}
        />

        <div className="my-8">
          <TrainingTable
            tableData={tableData}
            selectedTab={selectedTab}
            pageName="self-service"
            onReview={(row) => {
              setSelectedTrainingForReview(row);
              setReviewDrawerOpen(true);
            }}
            onViewStaff={(row) => handleViewStaff(row)}
          />
        </div>

        <NewTrainingDrawer isOpen={isOpen} setIsOpen={handleCloseDrawer} />

        <TrainingReviewDrawer
          open={reviewDrawerOpen}
          onClose={() => {
            setReviewDrawerOpen(false);
            setSelectedTrainingForReview(null);
          }}
          training={selectedTrainingForReview}
          yearFilter={yearFilter}
          setYearFilter={setYearFilter}
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
    </>
  );
}

//Dashboard
//Courses
//DTA
//Travelings
