import {
  forwardRef,
  // useCallback,
  // useImperativeHandle,
  // useMemo,
  // useRef,
  // useState,
} from "react";
import PropTypes from "prop-types";
// import { Button } from "antd";
// import { useReactToPrint } from "react-to-print";
// import { exportRefsToPdf } from "../../../utils/exportRefToPdf";
// import dayjs from "dayjs";
// import { numberToWord } from "../../../utils/number-to-word";
import { Chip } from "@nextui-org/react";
import { toStringDate } from "../../../utils/utitlities";

/**
 * @typedef {Object} PortalNotificationData
 * @property {string} refNo
 * @property {string} date
 * @property {string} to
 * @property {string} from
 * @property {string} subject
 * @property {string} intro
 * @property {string} courseTitle
 * @property {string} venue
 * @property {string} courseDate
 * @property {string} note
 * @property {string} additionalNote
 * @property {string} closing
 * @property {string} signatory
 * @property {string} signatoryTitle
 * @property {string} signatoryFor
 */

/** @type {PortalNotificationData} */

// const labelClass = "font-semibold text-[14px] leading-[30px uppercase";
// const valueClass = "text-[14px] leading-28px]";

// const PORTAL_NOTIFICATION_PRINT_CSS = `
//   @page { size: A4 portrait; margin: 14mm 12mm; }
//   @media print {
//     body {
//       -webkit-print-color-adjust: exact !important;
//       print-color-adjust: exact !important;
//     }
//     .staff-list-page {
//       break-before: page;
//       page-break-before: always;
//     }
//     .staff-list-table {
//       border-collapse: collapse;
//       width: 100%;
//     }
//     .staff-list-table th,
//     .staff-list-table td {
//       border: 1px solid #000;
//     }
//     .staff-list-table thead {
//       display: table-header-group;
//     }
//     .staff-list-table tr,
//     .staff-list-table td,
//     .staff-list-table th {
//       break-inside: avoid;
//       page-break-inside: avoid;
//     }
//   }
// `;

const PortalNotification = forwardRef(function PortalNotification(
  {
    training,
    // logoSrc = "/assets/images/NCAA.png",
    // showDownloadButton = false,
    // downloadFileName = "Portal Notification.pdf",
    // isCoordinator = false,
    // staffList = [],
  },
  // ref,
) {
  // const internalRef = useRef(null);
  // const memoRef = useRef(null);
  // const staffListRef = useRef(null);
  // const [isExportingPdf, setIsExportingPdf] = useState(false);
  // useImperativeHandle(ref, () => internalRef.current);
  // const handlePrintToPdf = useReactToPrint({
  //   content: () => internalRef.current,
  //   documentTitle: downloadFileName.replace(/\.pdf$/i, "") || "Document",
  //   pageStyle: PORTAL_NOTIFICATION_PRINT_CSS,
  //   removeAfterPrint: true,
  // });
  // const handlePrintClick = useCallback(() => {
  //   if (!internalRef.current || typeof handlePrintToPdf !== "function") return;
  //   handlePrintToPdf();
  // }, [handlePrintToPdf]);

  // const staffRows = useMemo(
  //   () =>
  //     (staffList ?? []).map((staff, index) => {
  //       const fullName = [
  //         staff?.LAST_NAME,
  //         staff?.FIRST_NAME,
  //         staff?.OTHER_NAMES,
  //       ]
  //         .filter(Boolean)
  //         .join(" ");

  //       return {
  //         id: staff?.STAFF_ID ?? staff?.TRAINING_MEMBER_ID ?? `${index + 1}`,
  //         serial: index + 1,
  //         nameAndNumber: `${fullName || "—"} /${staff?.STAFF_NUMBER ?? "—"}`,
  //         grade: staff?.GRADE ?? "—",
  //         location: staff?.REGION_NAME ?? staff?.START_FROM ?? "—",
  //       };
  //     }),
  //   [staffList],
  // );

  // const handleDownloadPdf = useCallback(async () => {
  //   setIsExportingPdf(true);
  //   await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  //   try {
  //     const refsToExport =
  //       staffRows.length > 0
  //         ? [memoRef, staffListRef]
  //         : [memoRef ?? internalRef ?? memoRef];
  //     await exportRefsToPdf(refsToExport, {
  //       fileName: downloadFileName,
  //       margin: 12,
  //     });
  //   } finally {
  //     setIsExportingPdf(false);
  //   }
  // }, [downloadFileName, staffRows.length]);

  // const data = {
  //   refNo: training?.REFERENCE_NO ?? "", //NCAA/DHR&A/03/2024/VIII",
  //   date: dayjs(training?.START_DATE).format("DD MMMM, YYYY"),
  //   to: "SEE DISTRIBUTION",
  //   from: "DHRA",
  //   subject: `NOTIFICATION TO ATTEND TRAINING PROGRAMME`,
  //   intro: `I am directed to inform you that Management has approved the participation of the underlisted officers to attend ${numberToWord(training?.PERIOD_IN_DAYS).naira} (${training?.PERIOD_IN_DAYS}) days training organized by ${training?.ORGANIZER ?? ""}. The programme is scheduled to hold as follows:`,
  //   courseTitle: training?.TRAINING_TITLE,
  //   venue: training?.VENUE,
  //   courseDate:
  //     dayjs(training?.START_DATE).format("dddd DD MMMM, YYYY") +
  //     " – " +
  //     dayjs(training?.END_DATE).format("dddd DD MMMM, YYYY"),
  //   note: "NOTE that attendance is mandatory as failure to attend will attract necessary sanctions as provided by extant rules, accordingly.",
  //   additionalNote:
  //     "Also note that Management has directed that at the end of the training, participants are required to submit a copy of their certificate and a group report to the office of the Director, Human Resources & Administration (DHRA).",
  //   closing:
  //     "By this notification, you are requested to attend the training accordingly.",
  //   signatory: "DR. (Mrs.) Anastasia Gbem",
  //   signatoryTitle: "Director, Human Resources & Administration",
  //   signatoryFor: "For: Director General of Civil Aviation",
  // };

  const reorderEntries = (entries) => {
    // Priority keys that should appear in this specific order
    const priorityKeys = [
      "TRAINING_TITLE",
      "TRAINING_TYPE",
      "DESCRIPTION",
      "VENUE",
      "ORGANIZER",
      "TRAINING",
      "START_DATE",
      "END_DATE",
      "PERIOD_IN_DAYS",
      "TIME",
    ];
    // Extract entries for priority keys and other fields
    const priorityEntries = [];
    const otherEntries = [];

    entries.forEach((entry) => {
      const key = entry[0].toUpperCase();

      if (priorityKeys.includes(key)) {
        // Store in a way we can sort by priority later
        priorityEntries.push({
          entry,
          index: priorityKeys.indexOf(key),
        });
      }
      // else {
      //   otherEntries.push(entry);
      // }
    });

    // Sort priority entries by their specified order
    const sortedPriorityEntries = priorityEntries
      .sort((a, b) => a.index - b.index)
      .map((item) => item.entry);

    // Combine all entries in desired order: priority keys, then other fields
    return [...sortedPriorityEntries, ...otherEntries];
  };

  const FormattedAmount = (amount) => {
    const formattedAmount = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

    return formattedAmount;
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 bg-white">
      {/* {showDownloadButton && (
        <div className="w-full max-w-[860px] flex justify-end flex-wrap gap-2">
          <Button
            type="primary"
            className="bg-[#00BCC2]"
            onClick={handlePrintClick}
          >
            Print / Save as PDF
          </Button>
         
        </div>
      )} */}

      {
        // <article
        //   ref={internalRef}
        //   className="w-full max-w-[860px] bg-white text-[#111] px-10 py-8 font-helvetica"
        // >
        //   <section ref={memoRef}>
        //     <header className="border-b border-gray-200 pb-4">
        //       <div className="flex items-center justify-center gap-5">
        //         <img
        //           src={logoSrc}
        //           alt="NCAA Logo"
        //           className="w-28 h-20 object-contain"
        //         />
        //         <div className="flex flex-col items-center text-center space-y-0">
        //           <p className="text-[20px] font-bold tracking-wide leading-tight">
        //             NIGERIA CIVIL AVIATION AUTHORITY
        //           </p>
        //           <p className="text-[16px] font-semibold mb-0">
        //             Corporate Headquarters, Abuja
        //           </p>
        //           <p className="text-[14px] uppercase tracking-wide m-0">
        //             Directorate of Human Resources and Administration
        //           </p>
        //           <p className="text-center text-[18px] font-extrabold uppercase mb-0">
        //             Internal Memo
        //           </p>
        //         </div>
        //       </div>
        //     </header>
        //     <section className="mt-7 grid grid-cols-2 gap-x-10 gap-y-3">
        //       <div className="flex gap-4">
        //         <span className={labelClass}>To:</span>
        //         <span className={valueClass}>{data.to}</span>
        //       </div>
        //       <div className="flex gap-4">
        //         <span className={labelClass}>Ref:</span>
        //         <span className={valueClass}>{training.REFERENCE_NO}</span>
        //       </div>
        //       <div className="flex gap-4">
        //         <span className={labelClass}>From:</span>
        //         <span className={valueClass}>{data.from}</span>
        //       </div>
        //       <div className="flex gap-4">
        //         <span className={labelClass}>Date:</span>
        //         <span className={valueClass + " uppercase"}>{data.date}</span>
        //       </div>
        //     </section>
        //     <section className="mt-6">
        //       <div className="flex gap-4">
        //         <span className={labelClass}>Subject:</span>
        //         <span className={`${valueClass} font-bold underline uppercase`}>
        //           {data.subject}
        //         </span>
        //       </div>
        //       <p className="text-[16px] leading-[28px] mt-3 mb-0 text-justify">
        //         This is to notify the under-listed officers that Management has
        //         approved their participation in the Training Programme organized
        //         by <span className="font-bold">{training?.ORGANIZER ?? ""}</span>
        //         <br />
        //         Find the details below:
        //         {/* {data.intro} */}
        //       </p>
        //     </section>
        //     <section className="mt-5 space-y-2">
        //       <div className="grid grid-cols-[180px,1fr] gap-4">
        //         <span className={labelClass}>COURSE TITLE:</span>
        //         <span className={valueClass}>{data.courseTitle}</span>
        //       </div>
        //       <div className="grid grid-cols-[180px,1fr] gap-4">
        //         <span className={labelClass}>VENUE:</span>
        //         <span className={valueClass}>{data.venue}</span>
        //       </div>
        //       <div className="grid grid-cols-[180px,1fr] gap-4">
        //         <span className={labelClass}>Date:</span>
        //         <span className={valueClass}>{data.courseDate}</span>
        //       </div>
        //     </section>
        //     <section className="mt-7 space-y-5">
        //       <p className="text-[16px] leading-[34px m-0 text-justify font-semibold">
        //         {/* {data.note} */}
        //         Kindly note that attendance is mandatory, as failure to attend
        //         will attract necessary sanctions.
        //       </p>
        //       <p className="text-[16px] leading-[34px m-0 text-justify">
        //         However, in the event that you are unable to attend for any
        //         justifiable reason, you are to notify the Director of Human
        //         Resources and Administration (DHR&A) for a possible replacement
        //         prior to the commencement of the programme.
        //         {/* {data.additionalNote} */}
        //       </p>
        //       <p className="text-[16px] leading-[34px m-0">
        //         {/* {data.closing} */}
        //         Also note that at the end of the programme, participants are
        //         required to submit a group report along with the certificates to
        //         the office of the DHR&A.
        //       </p>
        //     </section>
        //     <footer className="mt-10">
        //       <p className="text-[16px] leading-[32px font-bold m-0">
        //         {data.signatory}
        //       </p>
        //       <p className="text-[16px] leading-[32px font-bold m-0">
        //         {data.signatoryTitle}
        //       </p>
        //       <p className="text-[16px] leading-[32px font-bold m-0">
        //         {data.signatoryFor}
        //       </p>
        //     </footer>
        //     {isCoordinator && (
        //       <footer className="mt-7">
        //         <p className="text-[16px] leading-[32px font-bold m-0">Cc:</p>
        //         <p className="text-[16px] leading-[32px font-bold m-0">DHR&A</p>
        //         <p className="text-[16px] leading-[32px font-bold m-0">
        //           RM (Lagos, Kano, PHC, Abuja & Kaduna)
        //         </p>
        //       </footer>
        //     )}
        //   </section>
        //   {staffRows.length > 0 && isCoordinator && (
        //     <section
        //       ref={staffListRef}
        //       className={`staff-list-page mt-10 ${
        //         isExportingPdf ? "block" : "hidden print:block"
        //       }`}
        //     >
        //       <table className="staff-list-table w-full text-[22px] leading-tight border border-black border-collapse">
        //         <thead>
        //           <tr>
        //             <th className="w-[10%] border border-black text-left font-bold px-2 py-1">
        //               S/N
        //             </th>
        //             <th className="w-[55%] border border-black text-left font-bold px-2 py-1">
        //               NAME
        //             </th>
        //             <th className="w-[10%] border border-black text-left font-bold px-2 py-1">
        //               GL
        //             </th>
        //             <th className="w-[25%] border border-black text-left font-bold px-2 py-1">
        //               LOCATION
        //             </th>
        //           </tr>
        //         </thead>
        //         <tbody>
        //           {staffRows.map((row) => (
        //             <tr key={row.id}>
        //               <td className="border border-black px-2 py-1">
        //                 {row.serial}
        //               </td>
        //               <td className="border border-black px-2 py-1 uppercase">
        //                 {row.nameAndNumber}
        //               </td>
        //               <td className="border border-black px-2 py-1">
        //                 {row.grade}
        //               </td>
        //               <td className="border border-black px-2 py-1 uppercase">
        //                 {row.location}
        //               </td>
        //             </tr>
        //           ))}
        //         </tbody>
        //       </table>
        //     </section>
        //   )}
        // </article>
      }

      <ul className="flex flex-col gap-5 my-4 ">
        {training &&
          // Object.entries(training)

          reorderEntries(Object.entries(training))
            ?.filter(
              ([key]) =>
                key !== "TRAINING_ID" &&
                key !== "REFERENCE_NO" &&
                key !== "IS_AVAILABLE" &&
                key !== "ATTESTATION_DATE" &&
                key !== "DATE_APPROVED" &&
                key !== "SIGNATORY_DESIGNATION" &&
                key !== "SIGNATORY_FIRST_NAME" &&
                key !== "SIGNATORY_LAST_NAME" &&
                key !== "SIGNATORY_OTHER_NAMES" &&
                key !== "FILE_NAME" &&
                key !== "REQUEST_ID" &&
                key !== "STAFF_ID" &&
                key !== "STAFF" &&
                key !== "request_id" &&
                key !== "id",
            )
            ?.map(([key, value], i) => (
              <li className="grid grid-cols-3 gap-4 border-b-1 pb-2" key={i}>
                <p className="font-medium font-helvetica uppercase">
                  {key?.replace(/_/g, " ")}
                </p>
                <span className="text-gray-400 col-span-2 text-sm !font-light font-helvetica flex gap-3 items-center">
                  {key?.includes("PRINCIPAL") ||
                  key?.includes("MONTHLY_REPAYMENT") ||
                  key?.includes("current_payment") ||
                  key?.includes("past_payment") ||
                  key?.includes("payment")
                    ? FormattedAmount(value)
                    : key?.includes("SELECTED_DATES")
                      ? value?.split(", ")?.map((el, i) => (
                          <Chip
                            key={i}
                            color="primary"
                            className="m-1"
                            size="sm"
                            variant="flat"
                          >
                            {toStringDate(el) || ""}
                          </Chip>
                        )) || "N/A"
                      : key?.includes("DATE") || key?.includes("commence_date")
                        ? !value
                          ? "N/A"
                          : toStringDate(value) || "N/A"
                        : key?.includes("TIME")
                          ? value || "9:00am"
                          : value !== null
                            ? value || "N/A"
                            : "N/A"}
                </span>
              </li>
            ))}
      </ul>
    </div>
  );
});

PortalNotification.propTypes = {
  training: PropTypes.shape({
    REFERENCE_NO: PropTypes.string,
    START_DATE: PropTypes.string,
    TRAINING_TYPE: PropTypes.string,
    PERIOD_IN_DAYS: PropTypes.number,
    ORGANIZER: PropTypes.string,
    TRAINING_TITLE: PropTypes.string,
    VENUE: PropTypes.string,
    END_DATE: PropTypes.string,
  }),
  // data: PropTypes.shape({
  //   refNo: PropTypes.string,
  //   date: PropTypes.string,
  //   to: PropTypes.string,
  //   from: PropTypes.string,
  //   subject: PropTypes.string,
  //   intro: PropTypes.string,
  //   courseTitle: PropTypes.string,
  //   venue: PropTypes.string,
  //   courseDate: PropTypes.string,
  //   note: PropTypes.string,
  //   additionalNote: PropTypes.string,
  //   closing: PropTypes.string,
  //   signatory: PropTypes.string,
  //   signatoryTitle: PropTypes.string,
  //   signatoryFor: PropTypes.string,
  // }),
  logoSrc: PropTypes.string,
  showDownloadButton: PropTypes.bool,
  downloadFileName: PropTypes.string,
  isCoordinator: PropTypes.bool,
  staffList: PropTypes.arrayOf(
    PropTypes.shape({
      STAFF_ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      TRAINING_MEMBER_ID: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      LAST_NAME: PropTypes.string,
      FIRST_NAME: PropTypes.string,
      OTHER_NAMES: PropTypes.string,
      STAFF_NUMBER: PropTypes.string,
      GRADE: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      REGION_NAME: PropTypes.string,
      START_FROM: PropTypes.string,
    }),
  ),
};

export default PortalNotification;
