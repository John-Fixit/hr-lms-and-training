/**
 * Drawer: training staff list with full details, Excel export, and remove staff (pending only).
 * Uses NextUI Table for a more modern, polished look, and provides a quick way to add more staff
 * using a recipient-style selection drawer.
 */
import { Drawer } from "antd";
import PropTypes from "prop-types";
import ViewStaffForTraining from "./ViewStaffForTraining";

function ViewStaffDrawer({
  open,
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
  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={
        viewFrom !== "coordinator" && viewFrom !== "self-service" ? 1100 : 950
      }
      className="font-helvetica view-staff-drawer"
      classNames={{
        body: "bg-slate-100",
        header: "bg-slate-50 border-b border-slate-200",
      }}
      styles={{ body: { paddingTop: 20, paddingBottom: 20 } }}
    >
      <ViewStaffForTraining
        onClose={onClose}
        trainingId={trainingId}
        trainingTitle={trainingTitle}
        trainingStatus={trainingStatus}
        staffList={staffList}
        loading={loading}
        onRemoveSuccess={onRemoveSuccess}
        emptyMessage={emptyMessage}
        viewFrom={viewFrom}
        staffTraining={staffTraining}
        courseOnly={courseOnly}
      />
    </Drawer>
  );
}

ViewStaffDrawer.propTypes = {
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
};

export default ViewStaffDrawer;
