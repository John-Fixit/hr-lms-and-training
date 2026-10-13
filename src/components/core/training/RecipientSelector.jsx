/**
 * Shared recipient selection: department, grade, staff.
 * Each staff option has a "History" button that opens training history (dummy data for now).
 * Used in: NewTraining (Step 2) and ViewStaffDrawer "Add staff" drawer.
 */
import { useCallback, useMemo, useState, useEffect } from "react";
import { Drawer, Select, Button, Table } from "antd";
import PropTypes from "prop-types";
import { AiOutlineHistory } from "react-icons/ai";
import { useGetAllDepartment } from "../../../API/memo";
import { useGetTrainingStaff } from "../../../API/training";
import { Button as NextUIButton } from "@nextui-org/react";

const GRADE_OPTIONS = [
  ...Array.from({ length: 17 }, (_, i) => ({
    label: `Grade ${i + 1}`,
    value: `${i + 1}`,
  })),
  { label: "Grade 50", value: "50" },
  { label: "Grade 60", value: "60" },
];

const FieldLabel = ({ children, required }) => (
  <h5 className="header_h3 uppercase text-[0.825rem] font-medium leading-[1.5] tracking-[2px]">
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </h5>
);

FieldLabel.propTypes = {
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
};

const DUMMY_HISTORY = [
  {
    key: "1",
    courseName: "Leadership Essentials",
    dateAttended: "2024-02-10",
    status: "Completed",
    category: "Leadership",
  },
  {
    key: "2",
    courseName: "Workplace Safety",
    dateAttended: "2023-11-05",
    status: "Completed",
    category: "Compliance",
  },
  {
    key: "3",
    courseName: "Customer Service Excellence",
    dateAttended: "2023-07-22",
    status: "Did Not Attend",
    category: "Customer Experience",
  },
];

const historyColumns = [
  { title: "Course Name", dataIndex: "courseName", key: "courseName" },
  { title: "Date Attended", dataIndex: "dateAttended", key: "dateAttended" },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (value) => {
      const color =
        value === "Completed"
          ? "green"
          : value === "Pending"
            ? "orange"
            : "red";
      return (
        <p
          className={`text-xs ${color} py-1 px-3 font-helvetica rounded-full text-white`}
        >
          {value}
        </p>
      ); //<Tag color={color}>{value}</Tag>;
    },
  },
  { title: "Training Category", dataIndex: "category", key: "category" },
];

function RecipientSelector({
  companyId,
  departmentIds = [],
  gradeIds = [],
  selectedStaff = [],
  onDepartmentIdsChange,
  onGradeIdsChange,
  onSelectedStaffChange,
  departmentRequired = true,
  // staffSelectDisabled,
  staffNotFoundContent,
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyStaff, setHistoryStaff] = useState(null);

  const { data: departmentData, isPending: departmentLoading } =
    useGetAllDepartment(companyId ?? "");

  const departmentOptions = useMemo(
    () =>
      (departmentData ?? []).map((item) => ({
        value: item?.DEPARTMENT_ID,
        label: item?.DEPARTMENT_NAME,
      })),
    [departmentData],
  );

  const {
    mutateAsync: fetchTrainingStaff,
    data: trainingStaffData,
    isPending: trainingStaffLoading,
  } = useGetTrainingStaff();

  const hasRecipientSelection =
    (departmentIds?.length ?? 0) > 0 || (gradeIds?.length ?? 0) > 0;

  useEffect(() => {
    if (!companyId || !hasRecipientSelection) return;
    fetchTrainingStaff({
      company_id: companyId,
      department: departmentIds ?? [],
      grade: gradeIds ?? [],
    });
  }, [
    companyId,
    hasRecipientSelection,
    departmentIds,
    gradeIds,
    fetchTrainingStaff,
  ]);

  const trainingStaffList = useMemo(
    () =>
      hasRecipientSelection &&
      !trainingStaffLoading &&
      Array.isArray(trainingStaffData)
        ? trainingStaffData
        : [],
    [hasRecipientSelection, trainingStaffLoading, trainingStaffData],
  );

  const openHistory = useCallback((staff) => {
    setHistoryStaff(staff);
    setHistoryOpen(true);
  }, []);

  const closeHistory = useCallback(() => {
    setHistoryOpen(false);
    setHistoryStaff(null);
  }, []);

  const staffOptions = useMemo(
    () =>
      (trainingStaffList ?? []).map((item) => ({
        searchText: [item?.FIRST_NAME, item?.LAST_NAME, item?.STAFF_NUMBER]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
        label: (
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="truncate uppercase">
                {`${String(item?.LAST_NAME)?.toLowerCase() ?? ""} ${String(item?.FIRST_NAME)?.toLowerCase() ?? ""}`.trim()}
              </span>{" "}
              <span className="text-xs text-gray-500">
                - {item?.STAFF_NUMBER}
              </span>
            </div>
            <Button
              type="link"
              size="small"
              className="p-0 text-[#00bcc2] min-w-0"
              icon={<AiOutlineHistory size={16} />}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                openHistory(item);
              }}
            >
              History
            </Button>
          </div>
        ),
        value: item?.STAFF_ID,
      })),
    [trainingStaffList, openHistory],
  );

  const handleDepartmentChange = useCallback(
    (v) => {
      onDepartmentIdsChange?.(v);
      onSelectedStaffChange?.([]);
    },
    [onDepartmentIdsChange, onSelectedStaffChange],
  );

  const handleGradeChange = useCallback(
    (v) => {
      onGradeIdsChange?.(v);
      onSelectedStaffChange?.([]);
    },
    [onGradeIdsChange, onSelectedStaffChange],
  );

  const historyData = historyStaff ? DUMMY_HISTORY : [];

  const handleSelectAllStaff = () => {
    onSelectedStaffChange?.(trainingStaffList?.map((item) => item?.STAFF_ID));
  };

  const handleDeselectAllStaff = () => {
    onSelectedStaffChange?.([]);
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <FieldLabel required={departmentRequired}>
            SELECT DEPARTMENT
          </FieldLabel>
          <Select
            size="large"
            mode="multiple"
            value={departmentIds}
            onChange={handleDepartmentChange}
            options={departmentOptions}
            placeholder="Select department"
            virtual={false}
            showSearch
            optionFilterProp="label"
            allowClear
            loading={departmentLoading}
            className="w-full mt-1"
          />
        </div>
        <div>
          <FieldLabel>SELECT STAFF GRADES</FieldLabel>
          <Select
            size="large"
            mode="multiple"
            value={gradeIds}
            onChange={handleGradeChange}
            options={GRADE_OPTIONS}
            placeholder="Select grade"
            virtual={false}
            showSearch
            optionFilterProp="label"
            allowClear
            className="w-full mt-1"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <FieldLabel>SELECT STAFF</FieldLabel>
            {trainingStaffList?.length > 0 && (
              <div>
                <NextUIButton
                  color="primary"
                  onPress={() =>
                    trainingStaffList?.length &&
                    selectedStaff?.length === trainingStaffList?.length
                      ? handleDeselectAllStaff()
                      : handleSelectAllStaff()
                  }
                  size="sm"
                  radius="full"
                >
                  <span className="font-helvetica text-xs">
                    {selectedStaff?.length === trainingStaffList?.length
                      ? "Deselect All"
                      : "Select All"}
                  </span>
                </NextUIButton>
              </div>
            )}
          </div>
          <Select
            size="large"
            mode="multiple"
            value={selectedStaff}
            onChange={onSelectedStaffChange}
            options={staffOptions}
            placeholder="Select staff"
            virtual={false}
            showSearch
            optionFilterProp="searchText"
            loading={trainingStaffLoading}
            // disabled={
            //   staffSelectDisabled ??
            //   (!departmentIds?.length || !gradeIds?.length)
            // }

            notFoundContent={
              staffNotFoundContent ??
              (trainingStaffLoading ? "Loading staff..." : "No staff found")
            }
            className="w-full mt-1"
          />
        </div>
      </div>

      <Drawer
        title={
          <div>
            <h3 className="text-lg font-semibold m-0 text-gray-800">
              Training history
            </h3>
            {historyStaff && (
              <p className="text-gray-500 text-sm mt-1 mb-0 truncate max-w-md">
                {[historyStaff?.LAST_NAME, historyStaff?.FIRST_NAME]
                  .filter(Boolean)
                  .join(" ")}
                {historyStaff?.STAFF_NUMBER
                  ? ` · ${historyStaff.STAFF_NUMBER}`
                  : ""}
              </p>
            )}
          </div>
        }
        open={historyOpen}
        onClose={closeHistory}
        width={700}
        destroyOnClose
        className="font-helvetica"
        classNames={{
          body: "bg-gray-50",
          header: "bg-white border-b border-gray-200",
        }}
      >
        {!historyStaff ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500 m-0">
              No training history found for this staff member.
            </p>
          </div>
        ) : historyData.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500 m-0">
              No training history found for this staff member.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <Table
              dataSource={historyData}
              columns={historyColumns}
              pagination={false}
              size="middle"
              rowKey="key"
              className="!font-helvetica"
            />
          </div>
        )}
      </Drawer>
    </>
  );
}

RecipientSelector.propTypes = {
  companyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  departmentIds: PropTypes.array,
  gradeIds: PropTypes.array,
  selectedStaff: PropTypes.array,
  onDepartmentIdsChange: PropTypes.func,
  onGradeIdsChange: PropTypes.func,
  onSelectedStaffChange: PropTypes.func,
  departmentRequired: PropTypes.bool,
  staffSelectDisabled: PropTypes.bool,
  staffNotFoundContent: PropTypes.node,
};

export default RecipientSelector;
export { GRADE_OPTIONS };
