import { useMemo } from "react";
import { Drawer } from "antd";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import PropTypes from "prop-types";

function StaffHistoryDrawer({ open, onClose, staff }) {
  const historyData = useMemo(() => {
    if (!staff) return [];
    // Dummy data for now; replace with API data later.
    return [
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
  }, [staff]);

  const staffName = staff
    ? [staff.LAST_NAME, staff.FIRST_NAME, staff.OTHER_NAMES]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <Drawer
      title={
        <div>
          <h3 className="text-lg font-semibold m-0 text-gray-900">
            Training history
          </h3>
          {staff && (
            <p className="text-gray-500 text-sm mt-1 mb-0 truncate max-w-md">
              {staffName}
              {staff.STAFF_NUMBER ? ` · ${staff.STAFF_NUMBER}` : ""}
            </p>
          )}
        </div>
      }
      open={open}
      onClose={onClose}
      width={700}
      className="font-helvetica"
      classNames={{
        body: "bg-gray-50",
        header: "bg-white border-b border-gray-200",
      }}
    >
      {!staff ? (
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
            aria-label="Staff training history"
            removeWrapper
            classNames={{
              wrapper: "max-h-[420px]",
              th: "bg-slate-50 text-[11px] uppercase font-semibold text-slate-500",
              td: "text-[13px]",
            }}
          >
            <TableHeader>
              <TableColumn>Course Name</TableColumn>
              <TableColumn>Date Attended</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Training Category</TableColumn>
            </TableHeader>
            <TableBody items={historyData}>
              {(row) => (
                <TableRow key={row.key}>
                  <TableCell>{row.courseName}</TableCell>
                  <TableCell>{row.dateAttended}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.category}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </Drawer>
  );
}

StaffHistoryDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  staff: PropTypes.object,
};

export default StaffHistoryDrawer;
