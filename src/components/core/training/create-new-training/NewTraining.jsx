/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useCallback, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { DatePicker, Select, Input, Button, Drawer, TimePicker } from "antd";
import { User } from "@nextui-org/react";
import { FaUser } from "react-icons/fa";
import useCurrentUser from "../../../../hooks/useCurrentUser";
import {
  useCreateCourseTraining,
  useCreateTraining,
} from "../../../../API/training";
import RecipientSelector from "../RecipientSelector";
import FormHeader from "../../shared/FormHeader";
import { useMutateGetStaffByType } from "../../../../API/variation";
import { filePrefix } from "../../../../utils/filePrefix";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";

const { TextArea } = Input;

const TRAINING_LOCATION_OPTIONS = [
  { value: "LOCAL", label: "LOCAL" },
  { value: "FOREIGN", label: "FOREIGN" },
];

const TRAINING_TYPE_OPTIONS = [
  { value: "SEMINAR", label: "SEMINAR" },
  { value: "WORKSHOP", label: "WORKSHOP" },
  { value: "CONFERENCE", label: "CONFERENCE" },
  { value: "FELLOWSHIP", label: "FELLOWSHIP" },
  { value: "TRAINING", label: "TRAINING" },
];

const NCAA_PREMISES_OPTIONS = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
];

const TRAINING_STATE_OPTIONS = [
  { value: "ABUJA", label: "FCT ABUJA" },
  { value: "ABIA", label: "ABIA" },
  { value: "ADAMAWA", label: "ADAMAWA" },
  { value: "AKWA IBOM", label: "AKWA IBOM" },
  { value: "ANAMBRA", label: "ANAMBRA" },
  { value: "BAUCHI", label: "BAUCHI" },
  { value: "BAYELSA", label: "BAYELSA" },
  { value: "BENUE", label: "BENUE" },
  { value: "BORNO", label: "BORNO" },
  { value: "CROSS RIVER", label: "CROSS RIVER" },
  { value: "DELTA", label: "DELTA" },
  { value: "EBONYI", label: "EBONYI" },
  { value: "EDO", label: "EDO" },
  { value: "EKITI", label: "EKITI" },
  { value: "ENUGU", label: "ENUGU" },
  { value: "GOMBE", label: "GOMBE" },
  { value: "IMO", label: "IMO" },
  { value: "JIGAWA", label: "JIGAWA" },
  { value: "KADUNA", label: "KADUNA" },
  { value: "KANO", label: "KANO" },
  { value: "KATSINA", label: "KATSINA" },
  { value: "KEBBI", label: "KEBBI" },
  { value: "KOGI", label: "KOGI" },
  { value: "KWARA", label: "KWARA" },
  { value: "LAGOS", label: "LAGOS" },
  { value: "NASSARAWA", label: "NASSARAWA" },
  { value: "NIGER", label: "NIGER" },
  { value: "OGUN", label: "OGUN" },
  { value: "ONDO", label: "ONDO" },
  { value: "OSUN", label: "OSUN" },
  { value: "OYO", label: "OYO" },
  { value: "PLATEAU", label: "PLATEAU" },
  { value: "RIVERS", label: "RIVERS" },
  { value: "SOKOTO", label: "SOKOTO" },
  { value: "TARABA", label: "TARABA" },
  { value: "YOBE", label: "YOBE" },
  { value: "ZAMFARA", label: "ZAMFARA" },
];

const FieldLabel = ({ children, required }) => (
  <h5 className="header_h3 uppercase text-[0.825rem] font-medium leading-[1.5] tracking-[2px]">
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </h5>
);

function TrainingDetailTab({
  formValue,
  setFormValue,
  onNext,
  courseOnly = false,
}) {
  const update = useCallback(
    (key, value) => setFormValue((prev) => ({ ...prev, [key]: value })),
    [setFormValue],
  );

  return (
    <div className="bg-white shado p-5 rounded border flex justify-center flex-col gap-4">
      <div className="">
        <FieldLabel>TRAINING LOCATION</FieldLabel>
        <Select
          size="large"
          value={formValue.trainingLocation}
          onChange={(v) => update("trainingLocation", v)}
          options={TRAINING_LOCATION_OPTIONS}
          placeholder="Select location"
          virtual={false}
          className="w-full mt-1"
        />
      </div>
      <div className="">
        <FieldLabel>TRAINING TYPE</FieldLabel>
        <Select
          size="large"
          value={formValue.trainingType}
          onChange={(v) => update("trainingType", v)}
          options={TRAINING_TYPE_OPTIONS}
          placeholder="Select type"
          virtual={false}
          className="w-full mt-1"
        />
      </div>
      <div className="">
        <FieldLabel required>COURSE NAME</FieldLabel>
        <Input
          size="large"
          value={formValue.courseName}
          onChange={(e) => update("courseName", e.target.value)}
          placeholder="Enter the course name"
          className="w-full mt-1"
        />
      </div>
      <div className="">
        <FieldLabel>TRAINING ORGANISER</FieldLabel>
        <Input
          size="large"
          value={formValue.trainingOrganiser}
          onChange={(e) => update("trainingOrganiser", e.target.value)}
          placeholder="Enter training organiser"
          className="w-full mt-1"
        />
      </div>
      {courseOnly ? (
        <div className="">
          <FieldLabel>TRAINING OBJECTIVE</FieldLabel>
          <TextArea
            value={formValue.trainingObjective}
            onChange={(e) => update("trainingObjective", e.target.value)}
            placeholder="Enter training objective"
            rows={3}
            className="w-full mt-1"
          />
        </div>
      ) : null}
      <div className="">
        <FieldLabel>TRAINING VENUE</FieldLabel>
        <Input
          size="large"
          value={formValue.trainingVenue}
          onChange={(e) => update("trainingVenue", e.target.value)}
          placeholder="Enter the training venue"
          className="w-full mt-1"
        />
      </div>
      {formValue?.trainingLocation === "LOCAL" && (
        <>
          <div className="">
            <FieldLabel>SELECT TRAINING STATE</FieldLabel>
            <Select
              size="large"
              value={formValue.trainingState}
              onChange={(v) => update("trainingState", v)}
              options={TRAINING_STATE_OPTIONS}
              placeholder="Select An Option"
              virtual={false}
              showSearch
              optionFilterProp="label"
              allowClear
              className="w-full mt-1"
            />
          </div>
          {/* {courseOnly ? (
            <div className="">
              <FieldLabel>TRAINING WITHIN NCAA PREMISES ?</FieldLabel>
              <Select
                size="large"
                value={formValue.withinNcaaPremises}
                onChange={(v) => update("withinNcaaPremises", v)}
                options={NCAA_PREMISES_OPTIONS}
                placeholder="Please Select"
                virtual={false}
                className="w-full mt-1"
              />
            </div>
          ) : null} */}
        </>
      )}
      {formValue?.trainingLocation === "FOREIGN" && (
        <>
          <div className="">
            <FieldLabel>SELECT CONTINENT</FieldLabel>
            <Select
              size="large"
              value={formValue.trainingContinent}
              onChange={(v) => update("trainingContinent", v)}
              options={[
                { value: "US/CA", label: "US/CA" },
                { value: "EUROPEAN", label: "EUROPEAN" },
                { value: "ASIA", label: "ASIA" },
                { value: "AFRICA", label: "AFRICA" },
              ]}
              placeholder="Select An Option"
              virtual={false}
              showSearch
              optionFilterProp="label"
              allowClear
              className="w-full mt-1"
            />
          </div>
          <div className="">
            <FieldLabel>ROUTING</FieldLabel>
            <Input
              size="large"
              value={formValue.trainingRouting}
              onChange={(e) => update("trainingRouting", e.target.value)}
              placeholder="Enter training routing"
              className="w-full mt-1"
            />
          </div>
        </>
      )}

      <div className="">
        <FieldLabel>TRAINING TIME</FieldLabel>
        <TimePicker
          size="large"
          value={
            formValue.trainingTime
              ? dayjs(`2000-01-01 ${formValue.trainingTime}`)
              : null
          }
          onChange={(time) =>
            update("trainingTime", time ? time.format("HH:mm") : "")
          }
          placeholder="Select training time"
          format="HH:mm"
          className="w-full mt-1"
        />
      </div>

      <div className="">
        <FieldLabel>START DATE</FieldLabel>
        <DatePicker
          size="large"
          value={formValue.startDate ? dayjs(formValue.startDate) : null}
          onChange={(_, dateString) => update("startDate", dateString)}
          className="w-full mt-1"
          format="MM/DD/YYYY"
        />
      </div>
      <div className="">
        <FieldLabel>END DATE</FieldLabel>
        <DatePicker
          size="large"
          value={formValue.endDate ? dayjs(formValue.endDate) : null}
          onChange={(_, dateString) => update("endDate", dateString)}
          className="w-full mt-1"
          format="MM/DD/YYYY"
        />
      </div>
      {courseOnly ? (
        <>
          <div className="">
            <FieldLabel>EXTRA DAYS</FieldLabel>
            <Input
              size="large"
              type="number"
              value={formValue.extraDays}
              onChange={(e) => update("extraDays", e.target.value)}
              placeholder="Enter extra days"
              className="w-full mt-1"
            />
          </div>
          <div className="">
            <FieldLabel>TRAINING FEES</FieldLabel>
            <Input
              size="large"
              type="number"
              value={Number(formValue.trainingFees)}
              onChange={(e) => update("trainingFees", e.target.value)}
              placeholder="Enter training fees"
              className="w-full mt-1"
            />
          </div>
        </>
      ) : null}
      <div className="flex justify-end py-3">
        <button
          type="button"
          onClick={onNext}
          className="bg-btnColor px-6 py-2 header_h3 outline-none text-white rounded-xl hover:bg-btnColor/70"
        >
          <span className="font-helvetica">Next</span>
        </button>
      </div>
    </div>
  );
}

function RecipientTab({
  formValue,
  setFormValue,
  companyId,
  onNext,
  handleSaveAsDraft,
  onSubmit,
  isCreatingTraining,
}) {
  const update = useCallback(
    (key, value) => setFormValue((prev) => ({ ...prev, [key]: value })),
    [setFormValue],
  );

  const departmentIds = Array.isArray(formValue.departmentIds)
    ? formValue.departmentIds
    : [];
  const gradeIds = Array.isArray(formValue.gradeIds) ? formValue.gradeIds : [];
  const selectedStaff = formValue.selectedStaff ?? [];

  return (
    <div className="bg-white shado p-5 rounded-xl border flex justify-center flex-col gap-4">
      <RecipientSelector
        companyId={companyId}
        departmentIds={departmentIds}
        gradeIds={gradeIds}
        selectedStaff={selectedStaff}
        onDepartmentIdsChange={(v) => update("departmentIds", v)}
        onGradeIdsChange={(v) => update("gradeIds", v)}
        onSelectedStaffChange={(v) => update("selectedStaff", v)}
        departmentRequired
      />
      <div className="flex justify-end py-3">
        <button
          type="button"
          onClick={onNext}
          className="bg-btnColor px-6 py-2 header_h3 outline-none text-white rounded hover:bg-btnColor/70"
        >
          Next
        </button>
      </div>

      {/* <div className="flex justify-between py-3">
        <button
          type="button"
          onClick={() => handleSaveAsDraft()}
          className="border border-btnColor px-4 font-helvetica py-2 header_h3 outline-none rounded hover:bg-btnColor/70"
        >
          Save as draft
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="bg-btnColor px-6 py-2 header_h3 outline-none text-white rounded hover:bg-btnColor/70"
        >
          {isCreatingTraining ? "Creating Training..." : "Create Training"}
        </button>
      </div> */}
    </div>
  );
}

function formattedApprovalStaffLabel(staff) {
  return (
    <User
      avatarProps={{
        icon: <FaUser size={20} className="" />,
        radius: "full",
        src: staff?.FILE_NAME ? filePrefix + staff?.FILE_NAME : "",
        className:
          "w-8 h-8 my-2 object-cover rounded-full border-default-200 border",
      }}
      name={
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-helvetica text-xs uppercase">{`${
            staff?.LAST_NAME || ""
          } ${staff?.FIRST_NAME || ""}`}</span>
          {staff?.STAFF_NUMBER && "-"}
          <span className="font-helvetica text-black opacity-30 my-auto capitalize text-xs">
            {`${staff?.STAFF_NUMBER}`}
          </span>
        </div>
      }
      classNames={{ description: "w-48 truncat", name: "" }}
      css={{
        ".nextui-user-icon svg": { color: "red" },
      }}
      description={
        <div>
          {staff?.DESIGNATION && (
            <p className="font-helvetica my-auto text-black opacity-50 capitalize flex gap-x-2">
              {staff?.DESIGNATION?.toLowerCase()}
            </p>
          )}
          {staff?.DEPARTMENT && (
            <p className="font-helvetica my-auto text-black opacity-50 capitalize">
              {staff?.DEPARTMENT?.toLowerCase()}
            </p>
          )}
          <p className="font-helvetica text-black opacity-30 my-auto capitalize">
            Grade {staff?.GRADE}
            {staff?.GRADE && staff?.STEP && ` - Step ${staff?.STEP}`}
          </p>
        </div>
      }
    />
  );
}

function ApprovalTab({
  formValue,
  setFormValue,
  approvalStaffs,
  approvalLoading,
  searchText,
  setSearchText,
  onSubmit,
  isCreatingTraining,
  handleSaveAsDraft,
}) {
  const update = useCallback(
    (key, value) => setFormValue((prev) => ({ ...prev, [key]: value })),
    [setFormValue],
  );

  const approvals = formValue.approvals ?? [];

  const approvalOptions = useMemo(
    () =>
      (approvalStaffs ?? []).map((item) => ({
        ...item,
        label: formattedApprovalStaffLabel(item),
        value: item?.STAFF_ID,
        searchValue: `${item?.LAST_NAME || ""} ${item?.FIRST_NAME || ""} ${item?.STAFF_ID}`,
        displayName:
          `${item?.LAST_NAME ?? ""} ${item?.FIRST_NAME ?? ""}`.trim(),
      })),
    [approvalStaffs],
  );

  const handleChangeApprovals = (val) => {
    if (!val) {
      update("approvals", []);
      return;
    }

    const enriched = {
      ...val,
      displayName:
        approvalOptions.find((o) => o.value === val.value)?.displayName ??
        val.label,
    };
    // Keep approvals as an array to avoid changing submit mapping downstream.
    update("approvals", [enriched]);
  };

  const handleRemove = (item) => {
    update(
      "approvals",
      approvals.filter(
        (a) => (a.value ?? a.STAFF_ID) !== (item.value ?? item.STAFF_ID),
      ),
    );
  };

  return (
    <div className="bg-white shado p-5 rounded border flex justify-center flex-col gap-4">
      <div className="">
        <FieldLabel>STAFF</FieldLabel>
        <Select
          aria-label="staff"
          size="large"
          showSearch
          virtual={false}
          onSearch={(value) => setSearchText(value)}
          filterOption={false}
          placeholder="Select staff"
          optionFilterProp="label"
          options={approvalOptions}
          loading={approvalLoading}
          labelInValue
          value={approvals?.[0]}
          onChange={handleChangeApprovals}
          allowClear
          className="w-full mt-1"
        />
      </div>
      {approvals?.length > 0 && (
        <div className="mt-2">
          <p className="font-helvetica text-[#00BCC2] font-medium mb-2">
            Selected approvers ({approvals.length})
          </p>
          <ul className="space-y-2">
            {approvals.map((approval, index) => (
              <li
                key={approval.value ?? approval.STAFF_ID ?? index}
                className="flex justify-between items-center py-2 px-3 rounded bg-slate-100"
              >
                <span className="font-helvetica uppercase">
                  {approval.displayName ??
                    `${approval.FIRST_NAME ?? ""} ${approval.LAST_NAME ?? ""}`.trim()}
                </span>
                <Button
                  type="text"
                  size="small"
                  danger
                  onClick={() => handleRemove(approval)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex justify-between flex-row-reverse py-3">
        {/* <button
          type="button"
          onClick={() => handleSaveAsDraft()}
          className="border border-btnColor px-4 font-helvetica py-2 header_h3 outline-none rounded hover:bg-btnColor/70"
        >
          Save as draft
        </button> */}
        <button
          type="button"
          onClick={onSubmit}
          className="bg-btnColor px-6 py-2 header_h3 outline-none text-white rounded hover:bg-btnColor/70"
        >
          {isCreatingTraining ? "Creating Training..." : "Create Training"}
        </button>
      </div>
    </div>
  );
}

const defaultFormValue = {
  trainingLocation: "LOCAL",
  trainingType: "SEMINAR",
  courseName: "",
  trainingOrganiser: "",
  trainingObjective: "",
  trainingVenue: "",
  trainingState: undefined,
  trainingStateOptions: [],
  withinNcaaPremises: undefined,
  trainingContinent: "",
  trainingRouting: "",
  trainingTime: "",
  startDate: null,
  endDate: null,
  extraDays: "",
  trainingFees: "",
  departmentIds: [],
  gradeIds: [],
  selectedStaff: [],
  approvals: [],
};

const pickValue = (data, ...keys) => {
  for (const key of keys) {
    const value = data?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const mapTrainingToFormValue = (data = {}) => {
  const premises = pickValue(
    data,
    "premises",
    "PREMISES",
    "WITHIN_NCAA_PREMISES",
    "within_ncaa_premises",
  );
  let withinNcaaPremises = undefined;
  if (
    premises === 1 ||
    premises === "1" ||
    String(premises).toUpperCase() === "YES"
  ) {
    withinNcaaPremises = "YES";
  } else if (
    premises === 0 ||
    premises === "0" ||
    String(premises).toUpperCase() === "NO"
  ) {
    withinNcaaPremises = "NO";
  }

  const signatory = pickValue(data, "signatory", "SIGNATORY", "SIGNATORY_ID");
  const approvals = Array.isArray(data.approvals)
    ? data.approvals
    : signatory
      ? [{ value: signatory, key: signatory }]
      : [];

  return {
    trainingLocation:
      pickValue(data, "location", "LOCATION", "trainingLocation") || "LOCAL",
    trainingType:
      pickValue(data, "training_type", "TRAINING_TYPE", "trainingType") ||
      "SEMINAR",
    courseName:
      pickValue(
        data,
        "course",
        "COURSE",
        "TRAINING_TITLE",
        "courseName",
        "COURSE_NAME",
      ) || "",
    trainingOrganiser:
      pickValue(
        data,
        "TRAINER",
        "ORGANIZER",
        "ORGANISER",
        "trainingOrganiser",
      ) || "",
    trainingObjective:
      pickValue(
        data,
        "objective",
        "OBJECTIVE",
        "DESCRIPTION",
        "trainingObjective",
      ) || "",
    trainingVenue: pickValue(data, "venue", "VENUE", "trainingVenue") || "",
    trainingState: pickValue(data, "state", "STATE", "trainingState"),
    withinNcaaPremises,
    trainingContinent:
      pickValue(data, "continent", "CONTINENT", "trainingContinent") || "",
    trainingRouting:
      pickValue(data, "routing", "ROUTING", "trainingRouting") || "",
    trainingTime: pickValue(data, "time", "TIME", "trainingTime") || "",
    startDate: pickValue(data, "start_date", "START_DATE", "startDate") || null,
    endDate: pickValue(data, "end_date", "END_DATE", "endDate") || null,
    extraDays:
      pickValue(data, "extra", "EXTRA", "EXTRA_DAYS", "extraDays") || "",
    trainingFees:
      pickValue(
        data,
        "TRAINING_COST",
        "FEES",
        "TRAINING_FEES",
        "trainingFees",
      ) ?? "",
    departmentIds: Array.isArray(
      pickValue(data, "department", "DEPARTMENT", "departmentIds"),
    )
      ? pickValue(data, "department", "DEPARTMENT", "departmentIds")
      : [],
    gradeIds: Array.isArray(pickValue(data, "grade", "GRADE", "gradeIds"))
      ? pickValue(data, "grade", "GRADE", "gradeIds")
      : [],
    selectedStaff: Array.isArray(
      pickValue(data, "staff", "STAFF", "selectedStaff"),
    )
      ? pickValue(data, "staff", "STAFF", "selectedStaff")
      : [],
    approvals,
  };
};

export default function NewTraining({
  initialFormValue,
  isCreatingTraining,
  formValue,
  setFormValue,
  onSubmit,
  courseOnly = false,
}) {
  const { userData } = useCurrentUser();
  const companyId = userData?.data?.COMPANY_ID;

  const [selectedTab, setSelectedTab] = useState(0);

  const [approvalSearchText, setApprovalSearchText] = useState("");

  const {
    mutateAsync: mutateGetApprovalStaff,
    data: approvalStaffData,
    isPending: approvalLoading,
  } = useMutateGetStaffByType();

  useEffect(() => {
    if (approvalSearchText !== "" && companyId) {
      mutateGetApprovalStaff({
        company_id: companyId,
        staff_type: "full time",
        name: approvalSearchText,
      });
    }
  }, [approvalSearchText, companyId, mutateGetApprovalStaff]);

  const approvalStaffs = Array.isArray(approvalStaffData)
    ? approvalStaffData
    : [];

  const handleSaveAsDraft = useCallback(() => {
    if (typeof onSubmit === "function") {
      onSubmit({ ...formValue, is_draft: 1 });
    }
  }, [formValue, onSubmit]);

  const handleSubmit = useCallback(() => {
    if (typeof onSubmit === "function") {
      onSubmit(formValue);
    }
  }, [formValue, onSubmit]);

  const tabs = [
    {
      title: "Details",
      content: (
        <TrainingDetailTab
          formValue={formValue}
          setFormValue={setFormValue}
          onNext={() => setSelectedTab(1)}
          courseOnly={courseOnly}
        />
      ),
    },
    {
      title: "Recipient",
      content: (
        <RecipientTab
          formValue={formValue}
          setFormValue={setFormValue}
          companyId={companyId}
          onNext={() => setSelectedTab(2)}
          isCreatingTraining={isCreatingTraining}
          handleSaveAsDraft={handleSaveAsDraft}
          onSubmit={handleSubmit}
        />
      ),
    },
    {
      title: "Signatory",
      content: (
        <ApprovalTab
          formValue={formValue}
          setFormValue={setFormValue}
          approvalStaffs={approvalStaffs}
          approvalLoading={approvalLoading}
          searchText={approvalSearchText}
          setSearchText={setApprovalSearchText}
          onSubmit={handleSubmit}
          isCreatingTraining={isCreatingTraining}
          handleSaveAsDraft={handleSaveAsDraft}
        />
      ),
    },
  ];

  return (
    <div className="h-full mx-3">
      <div className="bg-[#f5f7fa] min-h-screen px-5 py-5">
        <div className="mb-4">
          <FormHeader
            title={
              courseOnly
                ? "Course Training Programme"
                : "Notification of Training Programme"
            }
          />
        </div>
        <div className="grid grid-cols-1 h-ful md:grid-cols-4 gap-x-7 gap-y-5">
          <div className="w-full p-5 overflow-y-auto col-span-3 shadow-xl bg-white rounded-xl mb-[1rem] form_drawer_body_container order-2 md:order-1">
            {tabs[selectedTab].content}
          </div>
          <div className="flex flex-col border-l-1 border-gray-400 py-10 text-sm gap-3 px-4 ms-8 md:ms-2 my-5 md:my-0 md:h-full order-1 md:order-2">
            {tabs.map((tab, index) => (
              <div
                key={index}
                onClick={() => setSelectedTab(index)}
                className={`${
                  selectedTab === index ? "font-[500]" : "font-[400]"
                } relative cursor-pointer font-[13px] leading-[19.5px] text-[rgba(39, 44, 51, 0.7)]`}
              >
                {tab.title}
                <span
                  className={`w-[0.7rem] h-[0.7rem] rounded-full ${
                    selectedTab === index ? "bg-[#00bcc2]" : "bg-gray-300"
                  } border-1 border-white absolute -left-[22px] top-1 duration-200 transition-all`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

NewTraining.propTypes = {
  initialFormValue: PropTypes.object,
  onSubmit: PropTypes.func,
};

export function NewTrainingDrawer({
  isOpen,
  setIsOpen,
  courseOnly = false,
  whatTodo = "add",
  initialFormValue,
}) {
  const {
    mutateAsync: createCourseNotification,
    isPending: isCreatingCourseNotification,
  } = useCreateTraining();

  const { mutateAsync: createCourse, isPending: isCreatingCourse } =
    useCreateCourseTraining();

  const createTraining = courseOnly ? createCourse : createCourseNotification;
  const isCreatingTraining = courseOnly
    ? isCreatingCourse
    : isCreatingCourseNotification;

  const { userData } = useCurrentUser();

  const [formValue, setFormValue] = useState(() => ({
    ...defaultFormValue,
  }));

  useEffect(() => {
    if (!isOpen) return;

    if (whatTodo === "edit" && initialFormValue) {
      setFormValue({
        ...defaultFormValue,
        ...mapTrainingToFormValue(initialFormValue),
      });
      return;
    }

    setFormValue({ ...defaultFormValue });
  }, [isOpen, whatTodo, initialFormValue]);

  const handleSubmit = async (formValue) => {
    // Edit endpoint not available yet — only autofill for now
    if (whatTodo === "edit") {
      setIsOpen(false);
      return;
    }

    // formValue has all form data, e.g.:
    // courseName, trainingLocation, trainingType, departmentIds, gradeIds,
    // selectedStaff, approvals, startDate, endDate, trainingFees, etc.
    const json = {
      company_id: userData?.data?.COMPANY_ID,
      staff_id: userData?.data?.STAFF_ID,
      training_type: formValue?.trainingType || null,
      location: formValue?.trainingLocation || null,
      course: formValue?.courseName || null,
      organiser: formValue?.trainingOrganiser || null,
      objective: formValue?.trainingObjective || null,
      venue: formValue?.trainingVenue || null,
      state: formValue?.trainingState || null,
      start_date: formValue?.startDate,
      end_date: formValue?.endDate || null,
      premises: formValue?.withinNcaaPremises === "Yes" ? 1 : 0, //0 or 1

      continent: formValue?.trainingContinent || null,
      routing: formValue?.trainingRouting || null,
      fees: formValue?.trainingFees || 0,
      staff: formValue?.selectedStaff || null,
      department: formValue?.departmentIds || null,
      grade: formValue?.gradeIds || null,
      draft: 0, //formValue?.is_draft || 0,
      extra: formValue?.extraDays || null,
      time: formValue?.trainingTime || null,
      signatory:
        formValue?.approvals?.map((item) => item?.value || item?.key)[0] ||
        null,
    };
    try {
      const res = await createTraining(json);
      successToast(res?.message);
      setFormValue(defaultFormValue);
      setIsOpen(false);
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message;
      errorToast(errMsg);
    }
  };
  return (
    <Drawer
      width={900}
      onClose={() => setIsOpen(false)}
      open={isOpen}
      className="bg-[#F5F7FA] z-[10]"
      classNames={{
        body: "bg-[#F7F7F7]",
        header: "font-helvetica bg-[#F7F7F7]",
      }}
    >
      <NewTraining
        isCreatingTraining={isCreatingTraining}
        onSubmit={handleSubmit}
        formValue={formValue}
        setFormValue={setFormValue}
        courseOnly={courseOnly}
      />
    </Drawer>
  );
}

NewTrainingDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  courseOnly: PropTypes.bool,
  whatTodo: PropTypes.string,
  initialFormValue: PropTypes.object,
};
