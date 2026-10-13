/**
 * Drawer: financial breakdown of a course for every nominated staff (course fee, flight,
 * airport taxi, DTA, local running and other fees) with a per-staff total and grand totals.
 * Supports search, row selection, export to Excel and print/save as PDF.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { Button, Drawer, Input, Modal, Space, Table } from "antd";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";
import PropTypes from "prop-types";
import { errorToast, successToast } from "../../../utils/toastMsgPop";
import { toStringDate } from "../../../utils/utitlities";
import { useAddTransport, useAssignFlight, useUpdateFlight } from "../../../API/training";

const AMOUNT_FIELDS = [
  "TRAINING_COST",
  "AIR_TRANSPORT",
  "TRANSPORT",
  "DTA",
  "LOCAL",
];

const SHEET_COLUMNS = [
  { label: "S/N", width: 6 },
  { label: "Full Name", width: 28 },
  { label: "Grade", width: 8 },
  { label: "Staff Number", width: 16 },
  { label: "Department", width: 22 },
  { label: "From", width: 16 },
  { label: "Course Fee", width: 14, amount: true },
  { label: "Flight", width: 14, amount: true },
  { label: "Airport Taxi", width: 14, amount: true },
  { label: "Local Taxi", width: 14, amount: true },
  { label: "DTA", width: 14, amount: true },
  { label: "Local Run", width: 14, amount: true },
  { label: "Total", width: 16, amount: true },
];

const SHEET_COLUMN_COUNT = SHEET_COLUMNS.length;

const FINANCE_PRINT_CSS = `
  @page { size: A4 landscape; margin: 10mm; }
  @media print {
    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .training-finance-print-root {
      border: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
    /* Tailwind's md/lg breakpoints never match the printed page width, so the
       detail grid is pinned to three columns here instead. */
    .training-finance-print-root .training-finance-header-grid {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 6px 16px !important;
      margin-top: 8px !important;
    }
    .training-finance-print-root .training-finance-header-grid p {
      font-size: 10px !important;
      line-height: 1.3 !important;
    }
    .training-finance-print-root .ant-table {
      font-size: 10px !important;
    }
    .training-finance-print-root .ant-table-cell {
      padding: 4px 6px !important;
      word-break: break-word;
    }
    .training-finance-print-root .ant-table-thead > tr > th {
      background: #f1f5f9 !important;
    }
    .training-finance-print-root .ant-table-thead {
      display: table-header-group;
    }
    .training-finance-print-root tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }
`;

const toAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const formatAmount = (value) =>
  toAmount(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function TrainingFinanceDrawer({
  open,
  onClose,
  staffList = [],
  trainingTitle,
  training,
  venue,
  onRefresh,
}) {
  const [searchValue, setSearchValue] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modal, modalContextHolder] = Modal.useModal();
  const printRef = useRef(null);

  const fileBaseName = `training-finances-${(trainingTitle ?? "export").replace(/\s+/g, "-")}`;

  const headerDetails = useMemo(
    () => [
      ["Type of Training", training?.TRAINING_TYPE ?? ""],
      ["Course Type", training?.COURSE_TYPE ?? training?.TRAINING ?? ""],
      ["Organizer", training?.ORGANIZER ?? ""],
      ["Objective", training?.DESCRIPTION ?? ""],
      ["Training Venue", venue ?? training?.VENUE ?? ""],
      ["Training Cost", `₦${formatAmount(training?.TRAINING_COST)}` ?? ""],
      ["Training Duration", `${training?.PERIOD_IN_DAYS} Days` ?? ""],
      ["Start Date", toStringDate(training?.START_DATE) ?? ""],
      ["End Date", toStringDate(training?.END_DATE) ?? ""],
      ["Time", training?.TIME || "9:00am"],
    ],
    [training, venue],
  );

  const financeRows = useMemo(
    () =>
      (staffList ?? [])
        .map((staff, index) => ({
          key: String(staff?.TRAINING_MEMBER_ID ?? staff?.STAFF_ID ?? index),
          staffId: staff?.STAFF_ID ?? null,
          trainingMemberId: staff?.TRAINING_MEMBER_ID ?? null,
          fullName: [staff?.LAST_NAME, staff?.FIRST_NAME]
            .map((name) => name?.trim())
            .filter(Boolean)
            .join(" "),
          grade: staff?.GRADE ?? "",
          staffNumber: staff?.STAFF_NUMBER ?? "",
          from: staff?.START_FROM ?? staff?.FROM ?? "",
          departmentName: staff?.DEPARTMENT_NAME ?? "",
          courseFee: toAmount(staff?.TRAINING_COST),
          flightAmount: toAmount(staff?.AIR_TRANSPORT),
          airportTaxi: toAmount(staff?.AIRPORT_TAXI),
          localTaxi: toAmount(staff?.TRANSPORT),
          dta: toAmount(staff?.DTA),
          localAmount: toAmount(staff?.LOCAL),
          otherFees: toAmount(staff?.OTHER_FEES),
          total: AMOUNT_FIELDS.reduce(
            (sum, field) => sum + toAmount(staff?.[field]),
            0,
          ),
        }))
        .sort((a, b) => toAmount(b.grade) - toAmount(a.grade)),
    [staffList],
  );

  const filteredRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return financeRows;

    return financeRows.filter((row) =>
      [row.fullName, row.staffNumber, row.from, String(row.grade)].some(
        (field) => field?.toLowerCase().includes(query),
      ),
    );
  }, [financeRows, searchValue]);

  const selectedRows = useMemo(
    () => financeRows.filter((row) => selectedRowKeys.includes(row.key)),
    [financeRows, selectedRowKeys],
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    // Keeps ticked rows selected while the search box narrows the table.
    preserveSelectedRowKeys: true,
  };

  const grandTotals = useMemo(() => {
    const initial = {
      courseFee: 0,
      flightAmount: 0,
      airportTaxi: 0,
      localTaxi: 0,
      dta: 0,
      localAmount: 0,
      otherFees: 0,
      total: 0,
    };

    return filteredRows.reduce((totals, row) => {
      Object.keys(initial).forEach((field) => {
        totals[field] += row[field];
      });
      return totals;
    }, initial);
  }, [filteredRows]);

  const amountColumn = (title, dataIndex) => ({
    title: <p className="font-helvetica m-0 text-[11px] font-bold">{title}</p>,
    dataIndex,
    key: dataIndex,
    align: "right",
    width: 90,
    render: (value) => (
      <span className="font-helvetica text-slate-700">
        {formatAmount(value)}
      </span>
    ),
  });

  const columns = [
    {
      title: <p className="font-helvetica m-0 text-[11px] font-bold">S/N</p>,
      dataIndex: "s/n",
      key: "s/n",
      width: 40,
      render: (_, __, index) => (
        <span className="font-helvetica text-slate-700">{index + 1}.</span>
      ),
    },
    {
      title: <p className="font-helvetica m-0 text-[11px] font-bold">Full Name</p>,
      dataIndex: "fullName",
      key: "fullName",
      width: 100,
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      render: (value) => (
        <span className="font-helvetica font-medium text-slate-800 capitalize text-[10px]">
          {value?.toLowerCase() || "—"}
        </span>
      ),
    },
    {
      title: <p className="font-helvetica m-0 text-[11px] font-bold">Grade</p>,
      dataIndex: "grade",
      key: "grade",
      width: 60,
      sorter: (a, b) => toAmount(a.grade) - toAmount(b.grade),
      render: (value) => (
        <span className="font-helvetica text-slate-700">{value || "—"}</span>
      ),
    },
    {
      title: <p className="font-helvetica m-0 text-[11px] font-bold">Staff Number</p>,
      dataIndex: "staffNumber",
      key: "staffNumber",
      width: 70,
      render: (value) => (
        <span className="font-helvetica text-slate-700">{value || "—"}</span>
      ),
    },
    {
      title: <p className="font-helvetica m-0 text-[11px] font-bold">Department</p>,
      dataIndex: "departmentName",
      key: "departmentName",
      width: 100,
      render: (value) => (
        <span className="font-helvetica text-slate-700">{value || "—"}</span>
      ),
    },
    {
      title: <p className="font-helvetica m-0 text-[11px] font-bold">From</p>,
      dataIndex: "from",
      key: "from",
      width: 50,
      render: (value) => (
        <span className="font-helvetica text-slate-700 capitalize">
          {value?.toLowerCase() || "—"}
        </span>
      ),
    },
    amountColumn("Course Fee", "courseFee"),
    amountColumn("Flight", "flightAmount"),
    amountColumn("Airport Taxi", "airportTaxi"),
    amountColumn("Local Taxi", "localTaxi"),
    amountColumn("DTA", "dta"),
    amountColumn("Local Run", "localAmount"),
    // amountColumn("Other Fees", "otherFees"),
    {
      title: <p className="font-helvetica m-0 text-[11px] font-bold">Total</p>,
      dataIndex: "total",
      key: "total",
      align: "right",
      width: 80,
      sorter: (a, b) => a.total - b.total,
      render: (value) => (
        <span className="font-helvetica font-semibold text-slate-900">
          {formatAmount(value)}
        </span>
      ),
    },
  ];

  const handleExportExcel = () => {
    if (!filteredRows.length) return;

    const padRow = (cells) => {
      const row = [...cells];
      while (row.length < SHEET_COLUMN_COUNT) row.push("");
      return row;
    };

    // Header details are laid out as label/value pairs, three pairs per row,
    // so the sheet mirrors the three-column grid shown in the drawer.
    const detailRows = [];
    for (let i = 0; i < headerDetails.length; i += 3) {
      detailRows.push(
        padRow(
          headerDetails
            .slice(i, i + 3)
            .flatMap(([label, value]) => [label, value, ""]),
        ),
      );
    }

    const sheetData = [
      padRow(["Training Finances"]),
      padRow([trainingTitle ? `Training: ${trainingTitle}` : "Training: —"]),
      padRow([]),
      ...detailRows,
      padRow(["Total Staff", filteredRows.length]),
      padRow([]),
      SHEET_COLUMNS.map((column) => column.label),
      ...filteredRows.map((row, index) => [
        index + 1,
        row.fullName,
        row.grade,
        row.staffNumber,
        row.departmentName,
        row.from,
        row.courseFee,
        row.flightAmount,
        row.airportTaxi,
        row.localTaxi,
        row.dta,
        row.localAmount,
        row.total,
      ]),
      [
        "",
        "Grand Total",
        "",
        "",
        "",
        "",
        grandTotals.courseFee,
        grandTotals.flightAmount,
        grandTotals.airportTaxi,
        grandTotals.localTaxi,
        grandTotals.dta,
        grandTotals.localAmount,
        grandTotals.total,
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    worksheet["!cols"] = SHEET_COLUMNS.map((column) => ({ wch: column.width }));
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: SHEET_COLUMN_COUNT - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: SHEET_COLUMN_COUNT - 1 } },
    ];

    // Amount columns keep their numeric type; only the display format is set so
    // the figures stay summable in Excel.
    const firstBodyRow = sheetData.length - filteredRows.length - 1;
    for (let r = firstBodyRow; r < sheetData.length; r += 1) {
      SHEET_COLUMNS.forEach((column, c) => {
        if (!column.amount) return;
        const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
        if (cell && typeof cell.v === "number") {
          cell.t = "n";
          cell.z = "#,##0.00";
        }
      });
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Finances");
    XLSX.writeFile(workbook, `${fileBaseName}.xlsx`);
  };

  const handlePrintToPdf = useReactToPrint({
    content: () => printRef.current,
    documentTitle: fileBaseName,
    pageStyle: FINANCE_PRINT_CSS,
    removeAfterPrint: true,
    // Selection checkboxes and the horizontal scroll container are dropped for the
    // printed copy, so the sheet renders as a plain full-width table.
    onBeforeGetContent: () =>
      new Promise((resolve) => {
        setIsPrinting(true);
        setTimeout(resolve, 0);
      }),
    onAfterPrint: () => setIsPrinting(false),
  });

  const handleExportPdf = useCallback(() => {
    if (!filteredRows.length) return;
    if (typeof handlePrintToPdf !== "function") return;
    handlePrintToPdf();
  }, [filteredRows.length, handlePrintToPdf]);

  const { mutateAsync: updateFlight } = useUpdateFlight();
  const { mutateAsync: addTransport } = useAddTransport();
  const { mutateAsync: assignFlight } = useAssignFlight();

  const handleDoubleFlightAmount = () => {
    if (!selectedRows.length) return;

    modal.confirm({
      title: "Double flight amount",
      centered: true,
      okText: "Yes, double it",
      cancelText: "Cancel",
      content: (
        <span className="font-helvetica">
          The flight amount will be doubled for{" "}
          <strong>{selectedRows.length}</strong>{" "}
          {selectedRows.length === 1 ? "staff" : "staff members"}. Do you want
          to continue?
        </span>
      ),
      onOk: async () => {
        try {
          await updateFlight({
            training_id: training?.TRAINING_ID,
            staff: selectedRows.map((row) => row.staffId),
          });
          // Pulls the updated staff list so the new flight amounts and totals show
          // without closing and reopening the drawer.
          await onRefresh?.();
          setSelectedRowKeys([]);
          successToast("Flight amount updated successfully");
        } catch (error) {
          const errMsg = error?.response?.data?.message || error?.message;
          errorToast(errMsg);
        }
      },
    });
  };
  const handleUpdateFlighTransportAmount = () => {
    if (!selectedRows.length) return;

    modal.confirm({
      title: "Update transport",
      centered: true,
      okText: "Yes, update it",
      cancelText: "Cancel",
      content: (
        <span className="font-helvetica">
          The transport will be updated for{" "}
          <strong>{selectedRows.length}</strong>{" "}
          {selectedRows.length === 1 ? "staff" : "staff members"}. Do you want
          to continue?
        </span>
      ),
      onOk: async () => {
        try {
          await addTransport({
            training_id: training?.TRAINING_ID,
            staff: selectedRows.map((row) => row.staffId),
          });
          await onRefresh?.();
          setSelectedRowKeys([]);
          successToast("Transport updated successfully");
        } catch (error) {
          const errMsg = error?.response?.data?.message || error?.message;
          errorToast(errMsg);
        }
      },
    });
  };

  const [flightAmount, setFlightAmount] = useState("");
  const [assignFlightOpen, setAssignFlightOpen] = useState(false);

  const handleAssignFlighAmount = () => {
    if (!selectedRows.length) return;
    setAssignFlightOpen(true);
  };

  const closeAssignFlightModal = () => {
    setAssignFlightOpen(false);
    setFlightAmount("");
  };

  const handleConfirmAssignFlight = async () => {
    if (!flightAmount || isNaN(flightAmount) || Number(flightAmount) < 0) {
      errorToast("Please enter a valid flight amount");
      return;
    }
    try {
      await assignFlight({
        training_id: training?.TRAINING_ID,
        staff: selectedRows.map((row) => row.staffId),
        amount: Number(flightAmount),
      });
      await onRefresh?.();
      setSelectedRowKeys([]);
      successToast("Flight amount updated successfully");
      closeAssignFlightModal();
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message;
      errorToast(errMsg);
    }
  };

  return (
    <Drawer
      title={
        <div>
          <h3 className="text-lg font-semibold m-0 text-gray-900 font-helvetica capitalize">
            Course finances
          </h3>
          {trainingTitle && (
            <p className="text-gray-500 text-sm mt-1 mb-0 truncate max-w-md font-helvetica capitalize">
              {trainingTitle?.toLowerCase()}
            </p>
          )}
        </div>
      }
      open={open}
      onClose={onClose}
      width={1500}
      className="font-helvetica"
      classNames={{
        body: "bg-gray-50",
        header: "bg-white border-b border-gray-200",
      }}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Input
            allowClear
            placeholder="Search by name, staff number, grade or location"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="w-full max-w-[340px] font-helvetica"
          />
          <Space size="middle">
        
            <Button
              type="primary"
              size="small"
              disabled={!filteredRows.length}
              onClick={handleExportExcel}
            >
              <span className="font-helvetica opacity-80 font-extralight text-xs">
                Export to Excel
              </span>
            </Button>
            <Button
              size="small"
              disabled={!filteredRows.length}
              onClick={handleExportPdf}
            >
              <span className="font-helvetica opacity-80 font-extralight text-xs">
                Print / Save as PDF
              </span>
            </Button>
          </Space>
        </div>

        <div
          ref={printRef}
          className="training-finance-print-root bg-white rounded-xl border border-gray-200 shadow-sm p-4"
        >
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold font-helvetica m-0 text-gray-900 capitalize">
                {trainingTitle
                  ? `Training: ${trainingTitle?.toLowerCase()}`
                  : "Training staff"}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Total:{" "}
                  <span className="font-semibold">{filteredRows.length}</span>
                </span>
              </div>
            </div>

            <div className="training-finance-header-grid mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {headerDetails.map(([label, value]) => (
                <div
                  key={label}
                  className="border-gray-200 space-y-1 rounded-lg"
                >
                  <p className="font-helvetica text-sm font-medium m-0">
                    {label}
                  </p>
                  <p className="font-helvetica text-sm font-medium capitalize opacity-60 m-0">
                    {String(value)?.toLowerCase() || "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
             {selectedRows.length > 0 && (
              <>
              <Button size="small" color="primary" variant="outlined" onClick={handleAssignFlighAmount}>
                <span className="font-helvetica opacity-80 font-extralight text-xs">
                  Assign Flight ({selectedRows.length})
                </span>
              </Button>
              <Button size="small" color="pink" variant="outlined" onClick={handleUpdateFlighTransportAmount}>
                <span className="font-helvetica opacity-80 font-extralight text-xs">
                  Add Transport ({selectedRows.length})
                </span>
              </Button>
              <Button size="small" danger variant="outlined" onClick={handleDoubleFlightAmount}>
                <span className="font-helvetica opacity-80 font-extralight text-xs">
                  Double Flight Amount ({selectedRows.length})
                </span>
              </Button>
            
              </>
            )}
          </div>
          <div className="mt-8">
            <Table
              columns={columns}
              dataSource={filteredRows}
              pagination={false}
              rowSelection={isPrinting ? undefined : rowSelection}
              scroll={isPrinting ? undefined : { x: 1400 }}
              size="small"
              
              bordered
              rowClassName={(_, index) =>
                index % 2 === 0 ? "bg-white text-[10px]" : "bg-slate-50/70 text-[10px]"
              }
              
              locale={{ emptyText: "No staff finances found." }}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row className="bg-slate-200 text-[12px]">
                    <Table.Summary.Cell index={0} colSpan={isPrinting ? 6 : 7}>
                      <span className="font-helvetica font-semibold text-slate-800">
                        Grand Total
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">
                      <span className="font-helvetica font-semibold text-slate-800">
                        {formatAmount(grandTotals.courseFee)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right">
                      <span className="font-helvetica font-semibold text-slate-800">
                        {formatAmount(grandTotals.flightAmount)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={8} align="right">
                      <span className="font-helvetica font-semibold text-slate-800">
                        {formatAmount(grandTotals.airportTaxi)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={8} align="right">
                      <span className="font-helvetica font-semibold text-slate-800">
                        {formatAmount(grandTotals.localTaxi)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={9} align="right">
                      <span className="font-helvetica font-semibold text-slate-800">
                        {formatAmount(grandTotals.dta)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={10} align="right">
                      <span className="font-helvetica font-semibold text-slate-800">
                        {formatAmount(grandTotals.localAmount)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={11} align="right">
                      <span className="font-helvetica font-bold text-slate-900">
                        {formatAmount(grandTotals.total)}
                      </span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </div>
        </div>
      </div>
      {modalContextHolder}

      <Modal
        title="Assign Flight"
        open={assignFlightOpen}
        centered
        okText="Yes, Confirm"
        cancelText="Cancel"
        onOk={handleConfirmAssignFlight}
        onCancel={closeAssignFlightModal}
      >
        <span className="font-helvetic font-open-sans font-light text-sm">
          The Flight amount will be updated for{" "}
          <strong>{selectedRows.length}</strong>{" "}
          {selectedRows.length === 1 ? "staff" : "staff members"}. Do you want
          to continue?
        </span>
        <div className="mt-4 flex flex-col gap-2">
          <label htmlFor="flight_amount">Enter Flight Amount:</label>
          <Input
            id="flight_amount"
            onChange={(e) => setFlightAmount(e.target.value)}
            type="number"
            value={flightAmount}
            placeholder="Enter Flight Amount"
          />
        </div>
      </Modal>
    </Drawer>
  );
}

TrainingFinanceDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  staffList: PropTypes.array,
  trainingTitle: PropTypes.string,
  training: PropTypes.object,
  venue: PropTypes.string,
  onRefresh: PropTypes.func,
};

export default TrainingFinanceDrawer;
