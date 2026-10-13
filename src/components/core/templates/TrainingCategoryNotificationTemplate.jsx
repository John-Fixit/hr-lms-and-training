import { useCallback, useRef, useState } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Button } from "antd";
import { TbPlaneDeparture } from "react-icons/tb";
import { useReactToPrint } from "react-to-print";
import useCurrentUser from "../../../hooks/useCurrentUser";
import { mergeTemplateContent } from "../../../utils/trainingTemplateTokens";
import BookFlightDrawer from "./BookFlightDrawer";

const DOT_LINE = "";

function formatName(...parts) {
  const value = parts.filter(Boolean).join(" ").trim();
  return value || "";
}

function safeText(value, fallback = DOT_LINE) {
  if (value == null || value === "") return fallback;
  return String(value);
}

function toTitleCase(value) {
  return safeText(value).toLowerCase();
}

function TrainingCategoryNotificationTemplate({ training, selectedTemplate }) {
  const templateRef = useRef(null);
  const [bookFlightOpen, setBookFlightOpen] = useState(false);
  const handlePrintToPdf = useReactToPrint({
    content: () => templateRef.current,
    documentTitle: "NCAA Training Notification",
    removeAfterPrint: true,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 12mm;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
        }
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  const { userData } = useCurrentUser();

  const handleDownload = useCallback(() => {
    if (!templateRef.current || typeof handlePrintToPdf !== "function") return;
    handlePrintToPdf();
  }, [handlePrintToPdf]);

  const participantName = toTitleCase(
    formatName(
      userData?.data?.LAST_NAME,
      userData?.data?.FIRST_NAME,
      userData?.data?.OTHER_NAMES,
    ),
  );
  const staffNo = safeText(userData?.data?.STAFF_NUMBER, "NCAA/P.0001");
  const rank = toTitleCase(userData?.data?.GRADE);

  const department = toTitleCase(
    training?.DEPARTMENT_NAME || training?.DIRECTORATE_NAME,
  );
  const location = toTitleCase(training?.REGION_NAME);
  const organiser = training?.ORGANIZER;
  const title = toTitleCase(training?.TRAINING_TITLE);
  const venue = toTitleCase(training?.VENUE);

  const dateRange =
    training?.START_DATE && training?.END_DATE
      ? `${dayjs(training.START_DATE).format("DD MMM YYYY")} - ${dayjs(
          training.END_DATE,
        ).format("DD MMM YYYY")}`
      : training?.START_DATE
        ? dayjs(training.START_DATE).format("DD MMM YYYY")
        : "";
  const date = toTitleCase(dateRange);

  const duration = toTitleCase(
    training?.PERIOD_IN_DAYS ? `${training.PERIOD_IN_DAYS} day(s)` : "",
  );
  const time = toTitleCase(
    training?.TIME || training?.TRAINING_TIME || "09:00AM",
  );

  const trainingSignatory = toTitleCase(
    formatName(
      training?.SIGNATORY_LAST_NAME,
      training?.SIGNATORY_FIRST_NAME,
      training?.SIGNATORY_OTHER_NAMES,
    ),
  );

  const isMadamGbem = trainingSignatory
    ?.toLowerCase()
    .includes("anastasia gbem");

  const signatoryTitle = isMadamGbem
    ? "Director, Human Resources and Administration"
    : formatName(
        training?.SIGNATORY_DESIGNATION,
        training?.SIGNATORY_DEPARTMENT,
      );

  const resolvedSignatoryName = isMadamGbem
    ? "Dr. (Mrs.) Anastasia Gbem"
    : trainingSignatory || "Dr. (Mrs.) Anastasia Gbem";
  const resolvedSignatoryTitle = isMadamGbem
    ? "Director, Human Resources and Administration"
    : signatoryTitle || "Director, Human Resources and Administration";

  const mergeData = {
    PARTICIPANT_NAME: participantName,
    STAFF_NO: staffNo,
    RANK: rank,
    DEPARTMENT: department,
    LOCATION: location,
    ORGANISER: organiser,
    TRAINING_TITLE: title,
    VENUE: venue,
    DATE: date,
    DURATION: duration,
    TIME: time,
    SIGNATORY_NAME: resolvedSignatoryName,
    SIGNATORY_TITLE: resolvedSignatoryTitle,
  };

  return (
    <div className="w-full">
      <div className="flex justify-end gap-2 mb-3">
        <Button
          type="primary"
          size="small"
          icon={<TbPlaneDeparture size={18} />}
          onClick={() => setBookFlightOpen(true)}
        >
          Check ticket price
        </Button>
        <Button
          type="primary"
          size="small"
          className="bg-[#00BCC2]"
          onClick={handleDownload}
        >
          Download
        </Button>
      </div>

      <BookFlightDrawer
        open={bookFlightOpen}
        onClose={() => setBookFlightOpen(false)}
        training={training}
      />

      <div className="relative overflow-hidden bg-white borde border-slate-300 rounded-md p-8 md:p-10 text-[16px] text-[#111] font-serif">
        <article
          ref={templateRef}
          className="relative overflow-hidden text-[16px] text[#111] font-serif bg-white py-16"
        >
          <img
            src="/assets/images/NCAA.png"
            alt="NCAA watermark"
            className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1020px] max-w-[50%] opacity-[0.1]"
          />

          <div className="relative z-10">
            <header className="text-center">
              <div className="flex justify-center items-center gap-2 mb-1">
                {/* <img
                  src="/assets/images/NCAA.png"
                  alt="NCAA Logo"
                  className="w-14 h-14 object-contain"
                /> */}
                <div className="">
                  <div className="flex items-start gap-2">
                    <img
                      src="/assets/images/NCAA.png"
                      alt="NCAA Logo"
                      className="w-[112px] h-[112px] object-contain -mt-8"
                    />
                    <div>
                      <p className="m-0 uppercase font-bold text-[#1a237e] text-[28px] font-serif leading-8">
                        Nigeria Civil Aviation Authority
                      </p>

                      <p className="m-0 capitalize font-bold text-[#1a237e] text-[16px] font-serif">
                        CORPORATE HEADQUATERS, ABUJA
                      </p>
                      <p className="m-0 font-semibold text-[15px] font-serif">
                        {"Directorate of Human Resources and Administration"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="inline-block my-5 py-1 text-center">
                <p className="m-0 uppercase font-bold text-[17px] font-serif border-b border-[#111] text-center">
                  NOTIFICATION OF TRAINING PROGRAMME
                </p>
              </div>
            </header>
            {selectedTemplate?.CONTENT ? (
              <main
                className="px-10 text-[14px] font-helvetica"
                dangerouslySetInnerHTML={{
                  __html: mergeTemplateContent(
                    selectedTemplate.CONTENT,
                    mergeData,
                  ),
                }}
              />
            ) : (
              <main className="px-10">
                <section className="mb-6 text-[15px] font-extrabold text-black">
                  <p className="m-0 text-black tracking-wide font-bold text-[14px]">
                    You are hereby scheduled to attend a training programme as
                    detailed below. Kindly note that attendance is mandatory, as
                    failure to attend will attract necessary sanctions, including
                    the refund of all allowances paid for the programme.
                  </p>
                  <p className="mt-3 mb-0 font-normal text-[14px] font-helvetica">
                    In the event that you are unable to attend the programme for
                    any justifiable reason, you are to notify the Director of
                    Human Resources and Administration (DHR&A) for possible
                    replacement prior to the commencement of the programme.
                  </p>
                </section>

                <section className="space-y-3 text-[14px] font-semibold">
                  <p className="m-0 flex items-end gap-2 font-helvetica">
                    <span className="font-helvetica pr-2">
                      Name of Participant: {"  "}
                    </span>
                    <span className="flex-1 border-b border-[#111] font-normal font-helvetica capitalize">
                      {participantName}
                    </span>
                    <span className="font-helvetica pr-2">Staff No.</span>
                    <span className="w-[180px] border-b border-[#111] font-normal font-helvetica capitalize">
                      {staffNo}
                    </span>
                  </p>
                  <p className="m-0 flex items-end gap-2 font-helvetica">
                    <span className="font-helvetica pr-2">Rank/Grade Level:</span>
                    <span className="flex-1 border-b border-[#111] font-normal font-helvetica capitalize">
                      {rank}
                    </span>
                  </p>
                  <p className="m-0 flex items-end gap-2 font-helvetica">
                    <span className="font-helvetica pr-2">
                      Directorate/Dept.:
                    </span>
                    <span className="flex-1 border-b border-[#111] font-normal font-helvetica capitalize">
                      {department}
                    </span>
                  </p>
                  <p className="m-0 flex items-end gap-2 font-helvetica">
                    <span className="font-helvetica pr-2">Location:</span>
                    <span className="flex-1 border-b border-[#111] font-normal font-helvetica capitalize">
                      {location}
                    </span>
                  </p>
                  <p className="m-0 flex items-end gap-2 font-helvetica">
                    <span className="font-helvetica pr-2">Organiser:</span>
                    <span className="flex-1 border-b border-[#111] font-normal font-helvetica">
                      {organiser}
                    </span>
                  </p>
                  <p className="m-0 flex items-end gap-2 font-helvetica">
                    <span className="font-helvetica pr-2">Title:</span>
                    <span className="flex-1 border-b border-[#111] font-normal font-helvetica capitalize">
                      {title}
                    </span>
                  </p>
                  <p className="m-0 flex items-end gap-2 font-helvetica">
                    <span className="font-helvetica pr-2">Venue:</span>
                    <span className="flex-1 border-b border-[#111] font-normal font-helvetica capitalize text-[15px]">
                      {venue}
                    </span>
                  </p>
                  <p className="m-0 flex items-end gap-2 font-helvetica">
                    <span className="font-helvetica pr-2">Date:</span>
                    <span className="flex-1 border-b border-[#111] font-normal font-helvetica capitalize">
                      {date}
                    </span>
                  </p>
                  <p className="m-0 flex items-end gap-2 font-helvetica">
                    <span className="font-helvetica pr-2">Duration:</span>
                    <span className="flex-1 border-b border-[#111] font-normal font-helvetica">
                      {duration}
                    </span>
                  </p>
                  <p className="m-0 flex items-end gap-2 font-helvetica">
                    <span className="font-helvetica pr-2">Time:</span>
                    <span className="flex-1 border-b border-[#111] font-normal font-helvetica capitalize">
                      {time}
                    </span>
                  </p>
                  <p className="mt-8 pt-2 flex items-end gap-2 font-helvetica">
                    <div className="flex flex-col">
                      <span className="w-[280px] mt-8 borde border-[#111] font-helvetica text-[17px]">
                        {resolvedSignatoryName}
                      </span>
                      <span className="border-[#111] font-helvetica text-[16px]">
                        {resolvedSignatoryTitle}
                      </span>
                    </div>
                  </p>
                </section>
              </main>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

TrainingCategoryNotificationTemplate.propTypes = {
  training: PropTypes.object,
  selectedTemplate: PropTypes.shape({
    NAME: PropTypes.string,
    CONTENT: PropTypes.string,
  }),
};

export default TrainingCategoryNotificationTemplate;
