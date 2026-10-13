import { useState } from "react";
import useCurrentUser from "../../../hooks/useCurrentUser";
import { Button, Drawer } from "antd";
import RecipientSelector from "./RecipientSelector";
import PropTypes from "prop-types";
import { errorToast, successToast } from "../../../utils/toastMsgPop";
import { useAddMoreStaff } from "../../../API/training";

export default function AddStaffDrawer({
  open,
  onClose,
  trainingId,
  courseOnly,
}) {
  const { userData } = useCurrentUser();
  const companyId = userData?.data?.COMPANY_ID;

  const [departmentIds, setDepartmentIds] = useState([]);
  const [gradeIds, setGradeIds] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);

  const handleClose = () => {
    onClose();
  };

  const { mutateAsync: addMoreStaff, isPending: isAddingMoreStaff } =
    useAddMoreStaff(courseOnly);

  const handleAddStaff = async () => {
    const json = {
      training_id: trainingId,
      staff: selectedStaff,
    };

    try {
      const res = await addMoreStaff(json);
      successToast(res?.message || "Staff added to training");
      handleClose();
    } catch (err) {
      errorToast(err?.response?.data?.message || err?.message);
    }
  };

  return (
    <Drawer
      title="Add more staff"
      open={open}
      onClose={handleClose}
      width={600}
      className="font-helvetica"
      classNames={{
        body: "bg-slate-50",
        header: "bg-white border-b border-slate-200",
      }}
    >
      <RecipientSelector
        companyId={companyId}
        departmentIds={departmentIds}
        gradeIds={gradeIds}
        selectedStaff={selectedStaff}
        onDepartmentIdsChange={setDepartmentIds}
        onGradeIdsChange={setGradeIds}
        onSelectedStaffChange={setSelectedStaff}
        departmentRequired
        staffNotFoundContent="Select department/grade to load staff"
      />
      <div className="flex justify-end gap-2 pt-4">
        <Button onClick={handleClose}>Close</Button>
        <Button
          type="primary"
          onClick={handleAddStaff}
          className="font-helvetica bg-btnColor"
          loading={isAddingMoreStaff}
        >
          Add Staff
        </Button>
      </div>
    </Drawer>
  );
}

AddStaffDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
