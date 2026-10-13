/* eslint-disable no-unused-vars */
import { useState, useMemo, useEffect, useCallback } from "react";
import PageHeader from "../../../../components/payroll_components/PageHeader";
import Separator from "../../../../components/payroll_components/Separator";
// import FormBuilder from "../../../HR/Performance/Setup/FormBuilder.jsx";

import useCurrentUser from "../../../../hooks/useCurrentUser.jsx";
import {
  useGetCoordinatorTrainingStaff,
  useGetMyTraining,
  useSeenTrainingNotification,
} from "../../../../API/training.js";
import { MdOutlinePending } from "react-icons/md";
import { AiOutlineFileDone } from "react-icons/ai";
import { Drawer } from "antd";
import TrainingTable from "../../../../components/core/training/TrainingTable.jsx";
import {
  TrainingReviewDrawer,
  ViewStaffDrawer,
} from "../../../../components/core/training/index.js";
import TrainingCategoryNotificationTemplate from "../../../../components/core/templates/TrainingCategoryNotificationTemplate.jsx";
import RequestCard from "../../../Approval/RequestCard.jsx";
import { errorToast } from "../../../../utils/toastMsgPop.js";
import { NewTrainingDrawer } from "../../../../components/core/training/create-new-training/NewTraining.jsx";
import BookFlightDrawer from "../../../../components/core/templates/BookFlightDrawer.jsx";

const statusData = [
  {
    id: "awaiting",
    label: "Awaiting",
    icon: MdOutlinePending,
    b_color: "bg-amber-100",
    t_color: "text-amber-600",
  },
  {
    id: "completed",
    label: "Completed",
    icon: AiOutlineFileDone,
    b_color: "bg-green-100",
    t_color: "text-green-600",
  },
  {
    id: "regional",
    label: "RM/Directorate",
    icon: MdOutlinePending,
    b_color: "bg-amber-100",
    t_color: "text-amber-600",
  },
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
    <>
      <main>
        <PageHeader
          header_text={"Training"}
          breadCrumb_data={[{ name: "Self Service" }, { name: "Training" }]}
        // btnAvailable={true}
        // buttonProp={[
        //   { button_text: "Add New Training", fn: handleAddNewTraining },
        // ]}
        />
        <div className="mt-5">{/* <hr /> */}</div>

        <Separator separator_text={"OVERVIEW"} />
        <RequestCard
          requestHistory={statusData}
          selectTab={selectTab}
          requestStatus={selectedTab}
          requestNo={detailsNo}
          loading={{
            awaiting: pendingTrainingLoading,
            completed: completedTrainingLoading,
            regional: regionalTrainingLoading,
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
    </>
  );
}

//Dashboard
//Courses
//DTA
//Travelings
