/**
 * Drawer: training staff list with full details, Excel export, and remove staff (pending only).
 * Uses NextUI Table for a more modern, polished look, and provides a quick way to add more staff
 * using a recipient-style selection drawer.
 */
import { useCallback, useMemo, useState } from "react";
import {
  // Drawer,
  Button,
  Space,
  Spin,
  Modal,
  Input as AntInput,
  message,
  ConfigProvider,
  Dropdown,
} from "antd";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  useDisclosure,
} from "@nextui-org/react";
import * as XLSX from "xlsx";
import PropTypes from "prop-types";
import {
  useRemoveStaffFromTrainng,
  useSendAvailability,
  useSendDirectorNotification,
  useSendStaffNotification,
} from "../../../API/training";
import { errorToast, successToast } from "../../../utils/toastMsgPop";
import { FaExclamationCircle, FaUserPlus } from "react-icons/fa";
import AddStaffDrawer from "./AddStaffDrawer";
import StaffHistoryDrawer from "./StaffHistoryDrawer";
import TrainingFinanceDrawer from "./TrainingFinanceDrawer";
import GenerateLetterDrawer from "./templates/GenerateLetterDrawer";
import PortalNotification from "../templates/PortalNotification";
import useCurrentUser from "../../../hooks/useCurrentUser";
import { Table as AntTable } from "antd";
import ExpandedDrawerWithButton from "../../modals/ExpandedDrawerWithButton";
import AddNoteRejection from "../approvals/AddNoteRejection";
import ConfirmApprovalModal from "../approvals/ConfirmApprovalModal";
import {
  useApprovedApprovalRequest,
  useDeclineApprovalRequest,
} from "../../../API/api_urls/my_approvals";
import toast from "react-hot-toast";
import { toStringDate } from "../../../utils/utitlities";
import { useSendSms } from "../../../API/sms";
import { ChevronDown } from "lucide-react";

function ViewStaffForTraining({
  onClose,
  trainingId,
  trainingTitle,
  trainingStatus,
  staffList = [],
  loading,
  onRemoveSuccess,
  emptyMessage = "No staff assigned to this training.",
  viewFrom,
  staffTraining,
  courseOnly,
}) {
  const [selectedRowKeys, setSelectedRowKeys] = useState(new Set());
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyStaff, setHistoryStaff] = useState(null);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [coordinatorPageSize, setCoordinatorPageSize] = useState(10);
  const { mutateAsync: removeStaff, isPending: removing } =
    useRemoveStaffFromTrainng(courseOnly);

  const isPending =
    trainingStatus === "pending" || trainingStatus === "awaiting";
  const isSelfService = viewFrom?.includes("self-service");
  const isCoordinator =
    viewFrom?.includes("coordinator") || trainingStatus === "regional";
  const isApproval = viewFrom?.includes("approval");
  const isTrainingApproval = viewFrom?.includes("training-approval");
  const isSelfServiceRequest = viewFrom?.includes("request");

  // const ishrTraining = viewFrom === "hr-training";

  const COLUMNS = [
    { name: "S/N", uid: "s/n" },
    { name: "Name", uid: "name" },
    { name: "Staff No", uid: "STAFF_NUMBER" },
    { name: "Department", uid: "DEPARTMENT_NAME" },
    { name: "Grade", uid: "GRADE" },
    // { name: "Region", uid: "START_FROM" },
    // { name: "Taxi", uid: "TRANSPORT" },
    // { name: "DTA", uid: "DTA" },
    // { name: "Local Running", uid: "LOCAL" },
    // { name: "Flight", uid: "AIR_TRANSPORT" },
    !isTrainingApproval &&
      !courseOnly &&
      trainingStatus !== "awaiting" && {
        name: "Availability Status",
        uid: "IS_AVAILABLE",
      },
  ].filter(Boolean);

  const exportToExcel = useCallback(() => {
    if (!staffList?.length) return;
    const rows = staffList.map((r, i) => ({
      "S/N": i + 1,
      "Last Name": r.LAST_NAME,
      "First Name": r.FIRST_NAME,
      "Other Names": r.OTHER_NAMES,
      "Staff Number": r.STAFF_NUMBER,
      Department: r.DEPARTMENT_NAME,
      Grade: r.GRADE,
      Region: r.START_FROM,
      Taxi: r.TRANSPORT != null ? Number(r.TRANSPORT) : "",
      DTA: r.DTA != null ? Number(r.DTA) : "",
      "Local Running": r.LOCAL != null ? Number(r.LOCAL) : "",
      Flight: r.AIR_TRANSPORT != null ? Number(r.AIR_TRANSPORT) : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staff");
    XLSX.writeFile(
      wb,
      `training-staff-${(trainingTitle ?? "export").replace(/\s+/g, "-")}.xlsx`,
    );
  }, [staffList, trainingTitle]);

  const handleRemoveSelected = useCallback(async () => {
    const keysArray =
      selectedRowKeys === "all"
        ? staffList.map((item) => item.STAFF_ID)
        : Array.from(selectedRowKeys || []);
    if (!trainingId || !keysArray.length) return;
    const staffIds = keysArray.map((k) => Number(k));
    try {
      const json = { training_id: trainingId, staff: staffIds };

      Modal.confirm({
        title: `Are you sure to remove the selected staff from the training? ${staffIds.length} staff will be removed.`,
        icon: <FaExclamationCircle size={20} className="text-red-600" />,
        okText: "Remove",
        okType: "danger",
        cancelText: "Cancel",
        async onOk() {
          await removeStaff(json);
          successToast("Staff removed from training");
          setSelectedRowKeys([]);
          onRemoveSuccess?.();
        },
      });
    } catch (err) {
      errorToast(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to remove staff",
      );
    }
  }, [trainingId, selectedRowKeys, removeStaff, onRemoveSuccess, staffList]);

  const dataSource = useMemo(
    () =>
      (staffList ?? []).map((r, i) => ({
        ...r,
        key: String(r.STAFF_ID ?? r.TRAINING_MEMBER_ID ?? i),
        s_n: i + 1,
      })),
    [staffList],
  );

  const filteredDataSource = useMemo(() => {
    return dataSource.filter((item) => {
      const matchesSearch =
        item?.LAST_NAME?.toLowerCase().includes(searchValue.toLowerCase()) ||
        item?.FIRST_NAME?.toLowerCase().includes(searchValue.toLowerCase()) ||
        item?.OTHER_NAMES?.toLowerCase().includes(searchValue.toLowerCase()) ||
        item?.STAFF_NUMBER?.toLowerCase().includes(searchValue.toLowerCase()) ||
        item?.DEPARTMENT_NAME?.toLowerCase().includes(
          searchValue.toLowerCase(),
        ) ||
        item?.START_FROM?.toLowerCase().includes(searchValue.toLowerCase());

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" &&
          Number(item?.IS_AVAILABLE) === 1) ||
        (availabilityFilter === "unavailable" &&
          Number(item?.IS_AVAILABLE) === 0) ||
        (availabilityFilter === "not_set" &&
          (item?.IS_AVAILABLE === null || item?.IS_AVAILABLE === undefined));

      return matchesSearch && matchesAvailability;
    });
  }, [dataSource, searchValue, availabilityFilter]);

  const renderCell = useCallback((item, columnKey, index) => {
    switch (columnKey) {
      case "s/n":
        return (
          <span className="font-helvetica opacity-80 capitalize">
            {index + 1}.
          </span>
        );
      case "name":
        return (
          <span className="font-helvetica opacity-80 capitalize">
            {[item.LAST_NAME, item.FIRST_NAME, item.OTHER_NAMES]
              .filter(Boolean)
              .join(" ")
              ?.toLowerCase() ?? "—"}
          </span>
        );
      case "STAFF_NUMBER": {
        return (
          <span className="font-helvetica opacity-60 capitalize">
            {item[columnKey] ?? "—"}
          </span>
        );
      }
      case "TRANSPORT":
      case "DTA":
      case "LOCAL":
      case "AIR_TRANSPORT": {
        const val = item[columnKey];
        return val != null ? (
          <span className="font-helvetica opacity-60">
            {Number(val).toLocaleString()}
          </span>
        ) : (
          <span className="font-helvetica opacity-60">—</span>
        );
      }
      case "IS_AVAILABLE": {
        const val = item[columnKey];
        return val !== null && !isPending ? (
          <div className="flex flex-col gap-1 items-center justify-center">
            <span
              className={`font-helvetica opacity-60 flex flex-col text-center rounded-md ${val === 1 ? "text-green-600 bg-green-100 px-2 py-1" : val === 0 && item?.ABSENT_REASON ? "text-red-600 bg-red-100 px-2 py-1" : "text-orange-600 bg-orange-100 px-2 py-1"}`}
            >
              {val === 1
                ? "Available"
                : val === 0 && item?.ABSENT_REASON
                  ? "Unavailable"
                  : "Pending"}
            </span>
            {val === 0 && (
              <span className="text-xs font-helvetica opacity-60">
                {item?.ABSENT_REASON}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span className="font-helvetica opacity-60 text-center">—</span>
          </div>
        );
      }
      default:
        return (
          <span className="font-helvetica opacity-60 capitalize">
            {item[columnKey] ? String(item[columnKey])?.toLowerCase() : "—"}
          </span>
        );
    }
  }, []);

  const { mutateAsync: sendAvailability } = useSendAvailability();
  const { userData } = useCurrentUser();
  const onAvailabilityConfirm = useCallback(
    async ({ training_id, available }) => {
      try {
        const res = await sendAvailability({
          training_id,
          staff_id: userData?.data?.STAFF_ID,
          is_available: available,
          reason: null,
        });
        successToast(res?.data?.message || "Availability confirmed");
        onClose?.();
      } catch (err) {
        errorToast(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to confirm availability",
        );
      }
    },
    [sendAvailability, userData?.data?.STAFF_ID, onClose],
  );
  const onAvailabilityDecline = useCallback(
    async ({ training_id, available, reason }) => {
      try {
        const res = await sendAvailability({
          training_id,
          staff_id: userData?.data?.STAFF_ID,
          is_available: available,
          reason: reason,
        });
        successToast(res?.data?.message || "Availability confirmed");
        onClose?.();
      } catch (err) {
        errorToast(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to confirm availability",
        );
      }
    },
    [sendAvailability, userData?.data?.STAFF_ID, onClose],
  );

  const handleConfirmAvailability = useCallback(() => {
    Modal.confirm({
      title: "Would you be available for this training?",
      icon: <FaExclamationCircle size={18} className="text-[#00bcc2]" />,
      content: "Select Yes if you will attend, or No if you are unavailable.",
      okText: "Yes",
      cancelText: "No",

      async onOk() {
        await onAvailabilityConfirm?.({
          training_id: trainingId,
          available: 1,
        });
      },
      onCancel() {
        let reason = "";
        Modal.confirm({
          title: "Provide reason for unavailability",
          icon: <FaExclamationCircle size={18} className="text-amber-500" />,
          content: (
            <AntInput.TextArea
              rows={4}
              placeholder="Provide the reason for unavailability"
              onChange={(e) => {
                reason = e.target.value;
              }}
            />
          ),
          okText: "Confirm",
          cancelText: "Back",
          async onOk() {
            const cleanedReason = reason.trim();
            if (!cleanedReason) {
              message.warning("Please provide a reason for unavailability.");
              return Promise.reject();
            }

            await onAvailabilityDecline?.({
              training_id: trainingId,
              available: 0,
              reason: cleanedReason,
            });
          },
        });
      },
    });
  }, [onAvailabilityConfirm, onAvailabilityDecline, trainingId]);

  const staffColumns = [
    {
      title: <p className="font-helvetica">S/N</p>,
      dataIndex: "s/n",
      key: "s/n",
      render: (value, record, index) => (
        <span className="font-medium text-slate-800 font-helvetica capitalize opacity-80">
          {index + 1}.
        </span>
      ),
    },
    {
      title: <p className="font-helvetica">Name</p>,
      dataIndex: "staffName",
      key: "staffName",
      sorter: (a, b) => a.staffName.localeCompare(b.staffName),
      render: (value, record) => (
        <>
          <span className="font-medium text-slate-800 font-helvetica capitalize opacity-80">
            {String(value)?.toLowerCase()} ({record?.STAFF_NUMBER})
          </span>
        </>
      ),
    },
    {
      title: <p className="font-helvetica">GL</p>,
      dataIndex: "GRADE",
      key: "GRADE",
      // sorter: (a, b) => a.staffNumber.localeCompare(b.staffNumber),
      render: (value) => (
        <span className="text-slate-700 font-helvetica opacity-80">
          {value || "N/A"}
        </span>
      ),
    },

    {
      title: <p className="font-helvetica">Location</p>,
      dataIndex: "REGION_NAME",
      key: "REGION_NAME",
      width: 180,
      render: (value) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize font-helvetica opacity-80">
          {value?.toLowerCase() || "—"}
        </span>
      ),
    },
  ];

  const staffDataSource = staffTraining?.STAFF?.map((review) => {
    const name =
      review?.LAST_NAME + " " + review?.FIRST_NAME + " " + review?.OTHER_NAMES;
    return {
      key: review.STAFF_ID ?? name,
      staffName: name?.toLowerCase(),
      staffNumber: review?.STAFF_NUMBER || "N/A",
      ...review,
    };
  });

  const coordinatorFilteredDataSource = useMemo(() => {
    const query = searchValue?.trim().toLowerCase();
    if (!query) return staffDataSource;

    return (staffDataSource || []).filter((item) => {
      const fullName = [item?.LAST_NAME, item?.FIRST_NAME, item?.OTHER_NAMES]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const staffNo = String(item?.STAFF_NUMBER || "").toLowerCase();
      const region = String(item?.REGION_NAME || "").toLowerCase();

      return (
        fullName.includes(query) ||
        staffNo.includes(query) ||
        region.includes(query)
      );
    });
  }, [staffDataSource, searchValue]);

  const coordinatorTotalStaff = staffDataSource?.length || 0;
  const coordinatorPageSizeOptions = useMemo(() => {
    const baseOptions = ["10", "20", "50", "100"];
    const allOption = String(coordinatorTotalStaff);

    if (coordinatorTotalStaff > 0 && !baseOptions.includes(allOption)) {
      baseOptions.push(allOption);
    }

    return baseOptions;
  }, [coordinatorTotalStaff]);

  const {
    isOpen: isRejectModalOpen,
    onOpen: onRejectModalOpen,
    onClose: onRejectModalClose,
  } = useDisclosure();
  const {
    isOpen: Loading,
    onOpen: startLoading,
    onClose: stopLoading,
  } = useDisclosure();
  const {
    isOpen: isModalOpen,
    onOpen: openModal,
    onClose: onModalCancel,
  } = useDisclosure();

  const { mutateAsync: declineRequestAction, isPending: isDeclinePending } =
    useDeclineApprovalRequest();
  const { mutateAsync: approveRequestAction, isPending: isApprovePending } =
    useApprovedApprovalRequest();

  const rejectRequest = async (rejectnote) => {
    if (isDeclinePending) return;
    startLoading();
    let notes = "";

    if (rejectnote && rejectnote !== "<p><br></p>") {
      notes = rejectnote;
    }
    const json = {
      company_id: userData?.data?.COMPANY_ID,
      staff_id: userData?.data?.STAFF_ID,
      request_id: staffTraining?.requestID,
      rejection_note: notes,
    };

    try {
      const res = await declineRequestAction(json);
      if (res) {
        toast.success("You successfully decline request", { duration: 5000 });
        stopLoading();
        onRejectModalClose();
        onClose("refresh");
      }
    } catch (error) {
      toast.error(`${error?.response?.data?.message}.`, { duration: 10000 });
      stopLoading();
    }
  };

  const approveRequest = async () => {
    if (isApprovePending) return;

    const json = {
      company_id: userData?.data?.COMPANY_ID,
      staff_id: userData?.data?.STAFF_ID,
      request_id: staffTraining?.requestID,
      leave_start_date: null,
      leave_end_date: null,
      leave_date_array: null,
      memo_content: null,
      memo_signature: null,
      duration: null,
    };

    try {
      startLoading();
      const res = await approveRequestAction(json);
      if (res) {
        toast.success("You successfully approve request", { duration: 2000 });
        stopLoading();
        onModalCancel();
        onRejectModalClose();
        onClose("refresh");
      }
    } catch (error) {
      toast.error(`${error?.response?.data?.message}.`, { duration: 10000 });
      stopLoading();
    }
  };

  const tableItems = filteredDataSource.map((item, index) => ({
    ...item,
    rowIndex: index,
  }));

  const { mutateAsync: sendStaffNotification } = useSendStaffNotification();
  const { mutateAsync: sendDirectorNotification } =
    useSendDirectorNotification();
  const { mutateAsync: sendSms } = useSendSms();

  const handleSendStaffNotification = async () => {
    Modal.confirm({
      title: "Send notification to staff",
      content: "Are you sure you want to send notification to staff?",
      okText: "Send",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const res = await sendStaffNotification({ training_id: trainingId });
          const smsData = res?.staff_sms?.length ? res?.staff_sms : [];

          if (smsData?.length > 0) {
            for (const sms of smsData) {
              await sendSms({
                message: sms.message,
                phone: sms?.phone,
              });
            }
            successToast(res?.data?.message || res?.message);
          }
        } catch (error) {
          console.log(error);
          errorToast(
            error?.response?.data?.message ||
              error?.message ||
              "Failed to send notification",
          );
        }
      },
    });
  };

  const handleSendDirectorNotification = () => {
    Modal.confirm({
      title: "Send notification to directors",
      content: "Are you sure you want to send notification to directors?",
      okText: "Send",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const res = await sendDirectorNotification({
            training_id: trainingId,
          });
          const smsData = res?.staff_sms;

          for (const sms of smsData) {
            await sendSms({
              message: sms.message,
              phone: sms?.phone,
            });
          }
          successToast(res?.data?.message || res?.message);
        } catch (error) {
          errorToast(
            error?.response?.data?.message ||
              error?.message ||
              "Failed to send notification",
          );
        }
      },
    });
  };

  if (!staffTraining?.TRAINING_ID) return null;

  return (
    <>
      {isSelfService &&
        !isSelfServiceRequest &&
        !staffTraining?.ATTESTATION_DATE &&
        !isCoordinator && (
          <div className="flex justify-end">
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: "#00bcc2",
                },
              }}
            >
              <Button
                type="primary"
                className="font-helvetica"
                onClick={handleConfirmAvailability}
              >
                Confirm Availability
              </Button>
            </ConfigProvider>
          </div>
        )}
      {
        //if viewing from self-service side
        (isSelfService || isCoordinator) && (
          <div className="my-8">
            <PortalNotification
              training={staffTraining}
              isCoordinator={isCoordinator}
              staffList={staffTraining?.STAFF}
              showDownloadButton={true}
            />
          </div>
        )
      }

      {isCoordinator && (
        <div className="space-y-3">
          <div className="w-full max-w-[360px]">
            <AntInput
              allowClear
              placeholder="Search by name, staff no, or region"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <AntTable
            rowClassName={(_, index) =>
              index % 2 === 0 ? "bg-white" : "bg-slate-50/70"
            }
            columns={staffColumns}
            dataSource={coordinatorFilteredDataSource}
            pagination={{
              pageSize: coordinatorPageSize,
              showSizeChanger: {
                optionRender: (option) =>
                  Number(option?.value) === coordinatorTotalStaff
                    ? "All"
                    : option?.label,
              },
              onShowSizeChange: (_, size) => {
                setCoordinatorPageSize(size);
              },
              pageSizeOptions: coordinatorPageSizeOptions,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} Staff(s)`,
            }}
            scroll={{ x: 760 }}
            className="training-review-table"
          />
        </div>
      )}

      {
        //if viewing from hr side
        !isCoordinator && !isSelfService && (
          <div className="min-h-[240px] space-y-4">
            <div className="border bg-white rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="font-helvetica">
                  <h3 className="text-lg font-semibold font-helvetica m-0 text-gray-900 capitalize">
                    {trainingTitle
                      ? `Training: ${trainingTitle?.toLowerCase()}`
                      : "Training staff"}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Total:{" "}
                    <span className="font-semibold">
                      {staffList?.length ?? 0}
                    </span>
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className=" border-gray-200 space-y-1 rounded-lg">
                  <p className="font-helvetica text-sm font-medium">
                    Type of Training
                  </p>
                  <p className="font-helvetica text-sm capitalize opacity-60">
                    {staffTraining?.TRAINING_TYPE?.toLowerCase()}
                  </p>
                </div>
                <div className=" border-gray-200 space-y-1 rounded-lg">
                  <p className="font-helvetica text-sm font-medium">
                    Course Type
                  </p>
                  <p className="font-helvetica text-sm capitalize opacity-60">
                    {(
                      staffTraining?.COURSE_TYPE ?? staffTraining?.TRAINING
                    )?.toLowerCase()}
                  </p>
                </div>
                <div className=" border-gray-200 space-y-1 rounded-lg">
                  <p className="font-helvetica text-sm font-medium">
                    Organizer
                  </p>
                  <p className="font-helvetica text-sm capitalize opacity-60">
                    {(
                      staffTraining?.TRAINING
                    )?.toLowerCase()}
                  </p>
                </div>
                <div className=" border-gray-200 space-y-1 rounded-lg">
                  <p className="font-helvetica text-sm font-medium">
                    Objective
                  </p>
                  <p className="font-helvetica text-sm font-medium capitalize opacity-60">
                    {staffTraining?.DESCRIPTION?.toLowerCase() || "N/A"}
                  </p>
                </div>
                <div className=" border-gray-200 space-y-1 rounded-lg">
                  <p className="font-helvetica text-sm font-medium">
                    Training Venue
                  </p>
                  <p className="font-helvetica text-sm font-medium capitalize opacity-60">
                    {staffTraining?.VENUE?.toLowerCase()}
                  </p>
                </div>
                <div className=" border-gray-200 space-y-1 rounded-lg">
                  <p className="font-helvetica text-sm font-medium">
                    Training Cost
                  </p>
                  <p className="font-helvetica text-sm font-medium capitalize opacity-60">
                    {staffTraining?.TRAINING_COST?.toLowerCase()}
                  </p>
                </div>
                <div className=" border-gray-200 space-y-1 rounded-lg">
                  <p className="font-helvetica text-sm font-medium">
                    Training Duration
                  </p>
                  <p className="font-helvetica text-sm font-medium capitalize opacity-60">
                    {staffTraining?.PERIOD_IN_DAYS} Days
                  </p>
                </div>
                <div className=" border-gray-200 space-y-1 rounded-lg">
                  <p className="font-helvetica text-sm font-medium">
                    Start Date
                  </p>
                  <p className="font-helvetica text-sm font-medium capitalize opacity-60">
                    {toStringDate(staffTraining?.START_DATE)}
                  </p>
                </div>
                <div className=" border-gray-200 space-y-1 rounded-lg">
                  <p className="font-helvetica text-sm font-medium">End Date</p>
                  <p className="font-helvetica text-sm font-medium capitalize opacity-60">
                    {toStringDate(staffTraining?.END_DATE)}
                  </p>
                </div>
                <div className=" border-gray-200 space-y-1 rounded-lg">
                  <p className="font-helvetica text-sm font-medium">Time</p>
                  <p className="font-helvetica text-sm font-medium capitalize opacity-60">
                    {staffTraining?.TIME || "9:00am"}
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Spin size="large" />
                <span className="text-gray-500">Loading staff...</span>
              </div>
            ) : !staffList?.length ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-500 m-0">{emptyMessage}</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="w-full max-w-[600px] flex items-center justify-between gap3">
                    <Input
                      type="search"
                      placeholder="Search with staff name or number"
                      classNames={{
                        inputWrapper:
                          "w-full max-w-[300px] shadow-none border-1",
                        input: "font-helvetica opacity-60 font-extralight",
                      }}
                      size="md"
                      variant="bordered"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                    />
                    {!isTrainingApproval && !courseOnly && (
                      <select
                        className="h-10 min-w-[150px] rounded-xl border border-slate-300 bg-white px-2 text-[13px] text-slate-600 font-helvetica outline-none"
                        value={availabilityFilter}
                        onChange={(e) => setAvailabilityFilter(e.target.value)}
                      >
                        <option value="all">All availability</option>
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                        <option value="not_set">Pending</option>
                      </select>
                    )}
                  </div>

                  {(trainingStatus === "draft" ||
                    (isTrainingApproval &&
                      (trainingStatus === "pending" ||
                        trainingStatus === "awaiting")) ||
                    (viewFrom === "hr-training" &&
                      (trainingStatus === "pending" ||
                        trainingStatus === "awaiting" ||
                        trainingStatus === "sent"))) && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<FaUserPlus size={12} />}
                      className=""
                      onClick={() => setAddStaffOpen(true)}
                    >
                      <span className="font-helvetica opacity-80 font-extralight">
                        Add staff
                      </span>
                    </Button>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden py-3">
                  <div className="flex items-center justify-between mb-2 px-1 pe-6">
                    {trainingStatus === "awaiting" && !courseOnly && (
                      <div className="flex gap-3 items-center px-3">
                        <ConfigProvider
                          theme={{
                            token: {
                              colorPrimary: "#211571",
                            },
                          }}
                        >
                          <Dropdown
                            menu={{
                              items: [
                                {
                                  key: "sms-to-staff",
                                  label: (
                                    <ConfigProvider
                                      theme={{
                                        token: {
                                          colorPrimary: "#211571",
                                        },
                                      }}
                                    >
                                      <Button type="primary" size="small">
                                        <span className="font-helvetica text-white font-extralight text-xs">
                                          Email to Staff
                                        </span>
                                      </Button>
                                    </ConfigProvider>
                                  ),
                                  onClick: handleSendStaffNotification,
                                },
                                {
                                  key: "sms-to-region-manager-directorate",
                                  label: (
                                    <ConfigProvider
                                      theme={{
                                        token: {
                                          colorPrimary: "#4F46E5",
                                        },
                                      }}
                                    >
                                      <Button
                                        type="primary"
                                        size="small"
                                        className=""
                                      >
                                        <span className="font-helvetica text-white font-extralight text-xs">
                                          Email to Region Manager/Directorate
                                        </span>
                                      </Button>
                                    </ConfigProvider>
                                  ),
                                  onClick: handleSendDirectorNotification,
                                },
                              ],
                            }}
                            placement="bottomLeft"
                            arrow={{ pointAtCenter: true }}
                            trigger={["click"]}
                          >
                            <Button type="primary" size="small">
                              <span className="font-helvetica">Send Email</span>
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </Dropdown>
                        </ConfigProvider>
                      </div>
                    )}
                    <div className="flex items-center justify-end mb-2 px-1">
                      {staffList?.length > 0 && viewFrom !== "self-service" && (
                        <Space size="middle">
                          {isPending &&
                            (selectedRowKeys.size || selectedRowKeys.length) >
                              0 && (
                              <Button
                                type="primary"
                                danger
                                size="middle"
                                loading={removing}
                                onClick={handleRemoveSelected}
                              >
                                Remove selected (
                                {selectedRowKeys.size || selectedRowKeys})
                              </Button>
                            )}
                          {courseOnly ? (
                            <>
                              <Button
                                type="primary"
                                size="small"
                                onClick={() => setFinanceOpen(true)}
                              >
                                <span className="font-helvetica opacity-80 font-extralight text-xs">
                                  View Finances
                                </span>
                              </Button>
                              <Button
                                size="small"
                                onClick={() => setLetterOpen(true)}
                              >
                                <span className="font-helvetica opacity-80 font-extralight text-xs">
                                  Generate Letter
                                </span>
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="primary"
                              size="small"
                              onClick={exportToExcel}
                            >
                              <span className="font-helvetica opacity-80 font-extralight text-xs">
                                Export to Excel
                              </span>
                            </Button>
                          )}
                        </Space>
                      )}
                    </div>
                  </div>
                  <Table
                    aria-label="Training staff table"
                    selectionMode={
                      trainingStatus === "draft" ||
                      (isTrainingApproval &&
                        (trainingStatus === "pending" ||
                          trainingStatus === "awaiting")) ||
                      (viewFrom === "hr-training" &&
                        (trainingStatus === "pending" ||
                          trainingStatus === "awaiting" ||
                          trainingStatus === "sent"))
                        ? "multiple"
                        : "none"
                    }
                    selectedKeys={selectedRowKeys}
                    onSelectionChange={setSelectedRowKeys}
                    classNames={{
                      base: "px-4",
                      wrapper: "max-h-[520px]",
                      th: "bg-gray-200/80 text-[11px] uppercase font-semibold text-slate-500",
                      td: "text-[12px] !font-Helvetica !font-helvetica",
                    }}
                    // removeWrapper
                    isStriped={true}
                  >
                    <TableHeader columns={COLUMNS}>
                      {(column) => (
                        <TableColumn
                          key={column.uid}
                          className={[
                            column.uid === "name"
                              ? "min-w-[180px]"
                              : "whitespace-nowrap",
                            column.uid === "IS_AVAILABLE" && "text-center",
                            "font-helvetica",
                          ]}
                        >
                          {column.name}
                        </TableColumn>
                      )}
                    </TableHeader>
                    <TableBody items={tableItems} emptyContent="No staff found">
                      {(item) => (
                        <TableRow key={item.key}>
                          {(columnKey) => (
                            <TableCell className="!font-helvetica">
                              {renderCell(item, columnKey, item?.rowIndex)}
                            </TableCell>
                          )}
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )
      }

      {/* Approval buttons  */}
      {isApproval &&
        (trainingStatus === "pending" || trainingStatus === "awaiting") &&
        staffTraining?.requestID && (
          <div className="flex justify-between mt-3">
            <button
              disabled={Loading}
              className="header_btnStyle bg-red-500 rounded text-white font-semibold  mx-2 my-1 md:my-0 px-[13px] py-[7px] uppercase"
              onClick={onRejectModalOpen}
            >
              Reject
            </button>

            <div className="flex gap-2">
              <button
                disabled={Loading}
                className="header_btnStyle bg-[#00bcc2] rounded text-white font-semibold  mx-2 my-1 md:my-0 px-[13px] py-[7px] uppercase"
                onClick={openModal}
              >
                Approve
              </button>
            </div>
          </div>
        )}

      {/* ========================= */}

      {isPending && (
        <AddStaffDrawer
          open={addStaffOpen}
          onClose={() => setAddStaffOpen(false)}
          trainingId={trainingId}
          courseOnly={courseOnly}
        />
      )}

      <StaffHistoryDrawer
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          setHistoryStaff(null);
        }}
        staff={historyStaff}
      />

      {courseOnly && (
        <TrainingFinanceDrawer
          open={financeOpen}
          onClose={() => setFinanceOpen(false)}
          staffList={staffList}
          trainingTitle={trainingTitle}
          training={staffTraining}
          venue={staffTraining?.VENUE}
          onRefresh={onRemoveSuccess}
        />
      )}

      {courseOnly && (
        <GenerateLetterDrawer
          open={letterOpen}
          onClose={() => setLetterOpen(false)}
          training={staffTraining}
          staffList={staffList}
        />
      )}
      {/* </Drawer> */}

      <ExpandedDrawerWithButton
        maxWidth={600}
        isOpen={isRejectModalOpen}
        onClose={onRejectModalClose}
      >
        <div className="mt-10 mx-5">
          <AddNoteRejection
            handleConfirm={rejectRequest}
            loading={Loading}
            handleCancel={onRejectModalClose}
          />
        </div>
      </ExpandedDrawerWithButton>
      <ConfirmApprovalModal
        subject={"Are you sure you want to approve request?"}
        isOpen={isModalOpen}
        loading={isApprovePending}
        handleOk={approveRequest}
        handleCancel={onModalCancel}
      />
    </>
  );
}

ViewStaffForTraining.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  trainingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  trainingTitle: PropTypes.string,
  trainingStatus: PropTypes.string,
  staffList: PropTypes.array,
  loading: PropTypes.bool,
  onRemoveSuccess: PropTypes.func,
  emptyMessage: PropTypes.string,
  viewFrom: PropTypes.string,
  staffTraining: PropTypes.object,
  onAvailabilityConfirm: PropTypes.func,
  onAvailabilityDecline: PropTypes.func,
  courseOnly: PropTypes.bool,
};

export default ViewStaffForTraining;
