import PropTypes from "prop-types";
import { Modal, Table } from "antd";
import { useGetStaffTrainingHistory } from "../../../../API/trainingSessions";
import { formatDateRange } from "./calendarConstants";
import { OutcomeBadge, ParticipantStatusBadge } from "./SessionBadges";

/** A staff member's sessions across the calendar (replaces the dummy history in RecipientSelector). */
export default function StaffTrainingHistoryModal({ staff, onClose }) {
  const { data = [], isPending } = useGetStaffTrainingHistory(staff?.STAFF_ID);

  return (
    <Modal
      open={Boolean(staff)}
      onCancel={onClose}
      footer={null}
      width={720}
      title={<span className="font-helvetica">Training history · {staff ? `${staff.LAST_NAME} ${staff.FIRST_NAME}` : ""}</span>}
    >
      <Table
        size="small"
        rowKey="SESSION_ID"
        loading={isPending}
        dataSource={data}
        pagination={{ pageSize: 6, hideOnSinglePage: true }}
        scroll={{ x: 560 }}
        columns={[
          {
            title: "Course",
            key: "course",
            render: (_, r) => (
              <div>
                <p className="text-[13px] font-medium text-[#0f172a]">{r.COURSE_TITLE}</p>
                <p className="text-xs text-[#64748b]">{r.COURSE_CODE}</p>
              </div>
            ),
          },
          { title: "Dates", key: "dates", render: (_, r) => <span className="text-[13px]">{formatDateRange(r.START_DATE, r.END_DATE)}</span> },
          {
            title: "Result",
            key: "result",
            render: (_, r) =>
              r.SESSION_STATUS === "CANCELLED" ? (
                <span className="text-xs text-[#64748b]">Session cancelled</span>
              ) : r.OUTCOME ? (
                <OutcomeBadge outcome={r.OUTCOME} />
              ) : (
                <ParticipantStatusBadge status={r.PARTICIPANT_STATUS} />
              ),
          },
        ]}
        locale={{ emptyText: "No training on record." }}
      />
    </Modal>
  );
}

StaffTrainingHistoryModal.propTypes = {
  staff: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
