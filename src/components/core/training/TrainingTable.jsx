/**
 * Reusable Training Table – same columns/display everywhere, actions passed as props.
 * Expects API format: TRAINING_ID, TRAINING_TITLE, FIRST_NAME, LAST_NAME, DIRECTORATE_NAME,
 * TRAINING_TYPE, VENUE, START_DATE, END_DATE, PERIOD_IN_DAYS, TRAINING_COST, COUNT_STAFF, etc.
 */
import { Fragment, useCallback, useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Pagination,
} from "@nextui-org/react";
import { MdFilterList } from "react-icons/md";
import PropTypes from "prop-types";
import { Button, ConfigProvider, DatePicker, Modal } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons";
import clsx from "clsx";
import dayjs from "dayjs";
import { errorToast, successToast } from "../../../utils/toastMsgPop";
import ActionIcons from "../shared/ActionIcons";
import { useDeleteTrainingById } from "../../../API/training";
import { TbPlaneDeparture } from "react-icons/tb";

function formatDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCost(val) {
  if (val == null || val === "") return "—";
  const num = Number(val);
  if (Number.isNaN(num)) return String(val);
  return `₦${num.toLocaleString()}`;
}

const TrainingTable = ({
  tableData = [],
  onViewStaff,
  onApprove,
  isApproveLoading,
  isLoading: tableLoading,
  selectedTab,
  oncomplete,
  pageName,
  onReview,
  onViewStaffReview,
  onViewNominationTemplate,
  setYearFilter,
  yearFilter,
  onEditCourse,
  courseOnly,
  handleBookFlightNow
}) => {
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "START_DATE",
    direction: "descending",
  });

  const COLUMNS = [
    { name: "Course / Title", uid: "TRAINING_TITLE", sortable: true },
    // pageName === "hr-training" && {
    //   name: "Created By",
    //   uid: "created_by",
    //   sortable: true,
    // },
    // pageName === "hr-training" && {
    //   name: "Directorate",
    //   uid: "DIRECTORATE_NAME",
    //   sortable: true,
    // },
    { name: "Type", uid: "TRAINING_TYPE", sortable: true },
    { name: "Training", uid: "TRAINING", sortable: true },
    // pageName !== "hr-training" && {
    //   name: "Course Type",
    //   uid: "COURSE_TYPE",
    //   sortable: true,
    // },
    { name: "Venue", uid: "VENUE", sortable: true },
    { name: "Start Date", uid: "START_DATE", sortable: true },
    { name: "End Date", uid: "END_DATE", sortable: true },
    { name: "Days", uid: "PERIOD_IN_DAYS", sortable: true },
    // pageName === "hr-training" && {
    //   name: "Course Cost",
    //   uid: "TRAINING_COST",
    //   sortable: true,
    // },
    pageName === "hr-training" && {
      name: "Staff",
      uid: "COUNT_STAFF",
      sortable: true,
    },
    pageName === "self-service" &&
    (selectedTab === "pending" || selectedTab === "awaiting") && {
      name: "Training Invite",
      uid: "template",
      sortable: false,
    },
    pageName === "self-service" &&
    (selectedTab === "pending" || selectedTab === "awaiting") && {
      name: "Flight",
      uid: "flight",
      sortable: false,
    },
    { name: "Actions", uid: "actions", sortable: false },
  ]?.filter(Boolean);

  const [page, setPage] = useState(1);

  const showApproveConfirm = useCallback(
    (row) => {
      let typedReferenceNo = row?.REFERENCE_NO || "";
      let startDate = dayjs(row?.START_DATE).format("MM/DD/YYYY") || null;
      let endDate = dayjs(row?.END_DATE).format("MM/DD/YYYY") || null;
      Modal.confirm({
        title: "Are you sure you want to approve this training?",
        icon: <ExclamationCircleFilled />,
        content: (
          <>
            {!courseOnly && (
              <div>
                <div>
                  {
                    <div className="flex flex-col gap-2">
                      <label htmlFor="" className="font-helvetica opacity-60">
                        Memo Reference No
                      </label>
                      <Input
                        type="text"
                        defaultValue={typedReferenceNo}
                        onChange={(e) => {
                          typedReferenceNo = e.target.value;
                        }}
                      />
                    </div>
                  }
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="" className="font-helvetica opacity-60">
                        Start Date
                      </label>
                      <DatePicker
                        size="large"
                        value={startDate ? dayjs(startDate) : null}
                        onChange={(_, dateString) => (startDate = dateString)}
                        className="w-full mt-1"
                        format="MM/DD/YYYY"
                        disabledDate={(current) =>
                          current && current < dayjs().endOf("day")
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="" className="font-helvetica opacity-60">
                        End Date
                      </label>
                      <DatePicker
                        size="large"
                        value={endDate ? dayjs(endDate) : null}
                        onChange={(_, dateString) => (endDate = dateString)}
                        className="w-full mt-1"
                        format="MM/DD/YYYY"
                        disabledDate={(current) =>
                          !startDate || !current
                            ? false
                            : current.isBefore(dayjs(startDate).startOf("day"))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ),
        okText: "Approve",
        cancelText: "Cancel",
        async onOk() {
          const additionalJson = {
            reference_no: typedReferenceNo,
            start_date: startDate,
            end_date: endDate,
          };
          if (!typedReferenceNo && !courseOnly) {
            errorToast("Please enter a reference number");
            return;
          }
          await onApprove?.(row, additionalJson);
        },
      });
    },
    [onApprove],
  );

  const showCompleteConfirm = useCallback(
    (row) => {
      Modal.confirm({
        title: "Complete training",
        icon: <ExclamationCircleFilled />,
        content: "Are you sure you want to mark this training as complete?",
        okText: "Complete",
        cancelText: "Cancel",
        onOk() {
          oncomplete?.(row);
        },
      });
    },
    [oncomplete],
  );

  const hasSearchFilter = Boolean(filterValue);

  const filteredItems = useMemo(() => {
    let filtered = [...tableData];
    if (hasSearchFilter) {
      const search = filterValue.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          (row.TRAINING_TITLE &&
            row.TRAINING_TITLE.toLowerCase().includes(search)) ||
          (row.VENUE && row.VENUE.toLowerCase().includes(search)) ||
          (row.TRAINING_TYPE &&
            String(row.TRAINING_TYPE).toLowerCase().includes(search)) ||
          (row.DIRECTORATE_NAME &&
            row.DIRECTORATE_NAME.toLowerCase().includes(search)) ||
          (row.FIRST_NAME && row.FIRST_NAME.toLowerCase().includes(search)) ||
          (row.LAST_NAME && row.LAST_NAME.toLowerCase().includes(search)) ||
          (row.TRAINING_COST &&
            String(row.TRAINING_COST).toLowerCase().includes(search)),
      );
    }
    return filtered;
  }, [tableData, filterValue, hasSearchFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const col = sortDescriptor.column;
      const first =
        col === "created_by" ? `${a.LAST_NAME} ${a.FIRST_NAME}` : a[col];
      const second =
        col === "created_by" ? `${b.LAST_NAME} ${b.FIRST_NAME}` : b[col];
      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const { mutateAsync: deleteTrainingById } = useDeleteTrainingById();

  const onDeleteTraining = (training) => {
    Modal.confirm({
      title: "Are you sure you want to delete this training?",
      icon: <ExclamationCircleFilled />,
      content: "Are you sure you want to delete this training?",
      okText: "Delete",
      cancelText: "Cancel",
      okType: "danger",
      onOk: async () => {
        try {
          const res = await deleteTrainingById({
            training_id: training.TRAINING_ID,
          });
          successToast(
            res?.data?.message ||
            res?.message ||
            "Training deleted successfully",
          );
        } catch (error) {
          errorToast(error?.response?.data?.message || error?.message);
        }
      },
    });
  };

  const renderCell = useCallback(
    (row, columnKey) => {
      switch (columnKey) {
        case "TRAINING_ID":
          return (
            <span className="!font-helvetica opacity-60">
              {row.TRAINING_ID ?? "—"}
            </span>
          );
        case "TRAINING_TITLE":
          return (
            <span className="!font-helvetica font-medium opacity-80 capitalize">
              {String(row.TRAINING_TITLE)?.toLowerCase() ?? "—"}
            </span>
          );
        case "created_by":
          return (
            <span className="font-helvetica capitalize opacity-60">
              {[row.LAST_NAME, row.FIRST_NAME]
                .filter(Boolean)
                .join(" ")
                .toLowerCase() || "—"}
            </span>
          );
        case "DIRECTORATE_NAME":
          return (
            <span className="font-helvetica capitalize opacity-60">
              {row.DIRECTORATE_NAME?.toLowerCase() ?? "—"}
            </span>
          );
        case "TRAINING_TYPE":
          return (
            <span className="capitalize font-helvetica opacity-60">
              {row.TRAINING_TYPE?.toLowerCase() ?? "—"}
            </span>
          );
        case "TRAINING":
          return (
            <span className="capitalize font-helvetica opacity-60">
              {row.TRAINING?.toLowerCase() ?? "—"}
            </span>
          );
        case "VENUE":
          return (
            <span className="font-helvetica opacity-60">
              {row.VENUE ?? "—"}
            </span>
          );
        case "START_DATE":
          return (
            <span className="font-helvetica opacity-60">
              {formatDate(row.START_DATE)}
            </span>
          );
        case "END_DATE":
          return (
            <span className="font-helvetica opacity-60">
              {formatDate(row.END_DATE)}
            </span>
          );
        case "PERIOD_IN_DAYS":
          return (
            <span className="font-helvetica opacity-60">
              {row.PERIOD_IN_DAYS ?? "—"}
            </span>
          );
        case "TRAINING_COST":
          return (
            <p className="font-helvetica opacity-60">
              {formatCost(row.TRAINING_COST)}
            </p>
          );
        case "COUNT_STAFF":
          return (
            <span className="font-helvetica opacity-60">
              {row.COUNT_STAFF ?? 0}
            </span>
          );
        case "actions":
          return (
            <div className="flex items-center justify-center gap-2 flexwrap">
              {(selectedTab === "pending" ||
                selectedTab === "approved" ||
                selectedTab === "sent") && (
                  <Button
                    size="small"
                    className="bg-[#00BCC2] text-white font-medium min-w-0 px-2 tex-xs"
                    onClick={() => onViewStaff?.(row)}
                  >
                    View Staff
                  </Button>
                )}
              {selectedTab === "awaiting" && pageName === "hr-training" && (
                <>
                  <Button
                    size="small"
                    className="bg-[#00BCC2] text-white font-medium min-w-0 px-2 tex-xs"
                    onClick={() => onViewStaff?.(row)}
                  >
                    View Staff
                  </Button>
                  <Button
                    size="small"
                    className="bg-[#00BCC2] text-white font-medium min-w-0 px-2 tex-xs"
                    onClick={() => onEditCourse?.(row)}
                  >
                    Edit Course
                  </Button>
                </>
              )}

              {(selectedTab === "pending" ||
                (selectedTab === "awaiting" && courseOnly)) &&
                pageName === "hr-training" && (
                  <ConfigProvider
                    theme={{
                      token: {
                        colorPrimary: "#22C55E",
                      },
                    }}
                  >
                    <Button
                      size="small"
                      type="primary"
                      className="font-medium min-w-0 px-2 text-xs"
                      onClick={() => showApproveConfirm(row)}
                      isDisabled={isApproveLoading}
                    >
                      Approve
                    </Button>
                  </ConfigProvider>
                )}

              {selectedTab === "sent" && pageName !== "self-service" && (
                <ConfigProvider
                  theme={{
                    token: {
                      colorPrimary: "#389c3f",
                    },
                  }}
                  className="flex flex-col gap-1"
                >
                  <Button
                    size="small"
                    type="primary"
                    className="font-medium min-w-0 px-2"
                    onClick={() => showCompleteConfirm(row)}
                  >
                    Complete
                  </Button>
                </ConfigProvider>
              )}
              {((selectedTab === "awaiting" && !courseOnly) ||
                selectedTab === "regional") && (
                  // <ConfigProvider
                  //   theme={{
                  //     token: {
                  //       colorPrimary: "#00BCC2",
                  //     },
                  //   }}
                  // >
                  //   <Button
                  //     type="primary"
                  //     className="!bg-[#00BCC2] text-white hover:text-white font-medium min-w-0 px-2 tex-xs"
                  //     onClick={() => onViewStaff?.(row)}
                  //   >
                  //     View
                  //   </Button>
                  // </ConfigProvider>
                  <ActionIcons
                    variant={"VIEW"}
                    action={() => onViewStaff?.(row)}
                  />
                )}
              {selectedTab === "awaiting" &&
                !courseOnly &&
                pageName === "hr-training" && (
                  <ActionIcons
                    variant={"DELETE"}
                    action={() => onDeleteTraining?.(row)}
                  />
                )}
              {pageName === "hr-training" && selectedTab === "completed" && (
                <ConfigProvider
                  theme={{
                    token: {
                      colorPrimary: "#389c3f",
                    },
                  }}
                  className="flex flex-col gap-1"
                >
                  <Button
                    size="small"
                    type="primary"
                    className="font-medium min-w-0 px-2"
                    onClick={() => onViewStaffReview?.(row)}
                  >
                    View Reviews
                  </Button>
                </ConfigProvider>
              )}
              {pageName !== "hr-training" &&
                selectedTab === "completed" &&
                !row?.IS_REVIEWED && (
                  <ConfigProvider
                    theme={{
                      token: {
                        colorPrimary: "#389c3f",
                      },
                    }}
                    className="flex flex-col gap-1"
                  >
                    <Button
                      size="small"
                      type="primary"
                      className="font-medium min-w-0 px-2"
                      onClick={() => onReview?.(row)}
                    >
                      Review
                    </Button>
                  </ConfigProvider>
                )}
            </div>
          );
        case "template":
          return (
            <div className="flex items-center justify-center">
              <ActionIcons
                variant={"DOWNLOAD"}
                action={() => onViewNominationTemplate?.(row)}
              />
            </div>
          );
        case "flight":
          return (
            <div className="flex items-center justify-center">
              
              <Button
                    size="small"
                    className="bg-[#00BCC2] text-white font-medium min-w-0 px-2 tex-xs"
                    icon={<TbPlaneDeparture size={18} />}
                onClick={() => handleBookFlightNow?.(row)}
                  >
                    Check Ticket
                  </Button>
            </div>
          );
        default:
          return (
            <span className="font-helvetica opacity-60">
              {row[columnKey] ?? "—"}
            </span>
          );
      }
    },
    [
      selectedTab,
      isApproveLoading,
      pageName,
      onViewStaff,
      showApproveConfirm,
      showCompleteConfirm,
      onReview,
      onViewStaffReview,
      onViewNominationTemplate,
    ],
  );

  const onRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = useCallback((value) => {
    setFilterValue(value || "");
    setPage(1);
  }, []);

  const onClear = useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  const topContent = useMemo(
    () => (
      <div className="flex flex-col gap-4 font-medium">
        <div className="flex gap-2">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by title, venue, type, directorate, creator, cost"
            startContent={<MdFilterList size={20} />}
            value={filterValue}
            onClear={onClear}
            variant="bordered"
            onValueChange={onSearchChange}
            classNames={{
              inputWrapper: "bg-white round-0 py-0 shadow-none hover:bg-white",
              input: "font-helvetica opacity-60 font-extralight",
              // innerWrapper: "focus:bg-white active:bg-white",
            }}
          />
          <DatePicker
            picker="year"
            placeholder="Select year"
            value={yearFilter ? dayjs(yearFilter) : null}
            onChange={(_, dateString) => setYearFilter(dateString)}
            format="YYYY"
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total: {filteredItems.length} training(s)
          </span>
          <label className="flex items-center text-default-400 text-small gap-1">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={onRowsPerPageChange}
              value={rowsPerPage}
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="75">75</option>
              <option value="100">100</option>
            </select>
          </label>
        </div>
      </div>
    ),
    [
      filterValue,
      onSearchChange,
      onClear,
      onRowsPerPageChange,
      filteredItems.length,
      rowsPerPage,
      setYearFilter,
      yearFilter,
    ],
  );

  const bottomContent = useMemo(
    () => (
      <div className="py-2 px-2 flex justify-between items-center font-medium">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeys === "all"
            ? "All items selected"
            : `${selectedKeys.size} of ${filteredItems.length} selected`}
        </span>
        <Pagination
          isCompact
          showControls
          classNames={{
            wrapper:
              "gap-0 overflow-visible h-full rounded-xl bg-transparent shadow",
            item: "w-10 h-10 text-small rounded-none bg-transparent",
            active: "bg-red-500",
            cursor:
              "bg-btnColor shadow from-default-500 to-default-800 dark:from-default-300 dark:to-default-100 text-white font-bold",
          }}
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button
            size="sm"
            variant="flat"
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            isDisabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => setPage((p) => Math.min(pages, p + 1))}
            isDisabled={page >= pages}
          >
            Next
          </Button>
        </div>
      </div>
    ),
    [selectedKeys, filteredItems.length, page, pages],
  );

  const getRowKey = (row) =>
    row.TRAINING_ID ?? row.id ?? String(row.TRAINING_TITLE);

  return (
    <Fragment>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden p-6">
        <Table
          aria-label="Training table"
          isHeaderSticky
          bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{ wrapper: "max-h-[550px]" }}
          sortDescriptor={sortDescriptor}
          topContent={topContent}
          topContentPlacement="outside"
          onSelectionChange={setSelectedKeys}
          onSortChange={setSortDescriptor}
          isLoading={tableLoading}
          isStriped={true}
        >
          <TableHeader columns={COLUMNS}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "actions" ? "center" : "start"}
                allowsSorting={column.sortable}
                className={clsx(
                  column.uid === "actions"
                    ? "text-center font-medium uppercase"
                    : "font-medium uppercase",
                  "font-helvetica",
                )}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody emptyContent="No training found" items={sortedItems}>
            {(item) => (
              <TableRow key={getRowKey(item)}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Fragment>
  );
};

export default TrainingTable;

TrainingTable.propTypes = {
  tableData: PropTypes.array,
  onViewStaff: PropTypes.func,
  onApprove: PropTypes.func,
  isApproveLoading: PropTypes.bool,
  isLoading: PropTypes.bool,
  selectedTab: PropTypes.string,
  oncomplete: PropTypes.func,
  pageName: PropTypes.string,
  onReview: PropTypes.func,
  onViewStaffReview: PropTypes.func,
  onViewNominationTemplate: PropTypes.func,
  setYearFilter: PropTypes.func,
  yearFilter: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onEditCourse: PropTypes.func,
  courseOnly: PropTypes.bool,
};
