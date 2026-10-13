import { useCallback, useRef } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Button } from "antd";
import { useReactToPrint } from "react-to-print";
import useCurrentUser from "../../../hooks/useCurrentUser";

function safeValue(value, fallback) {
  if (value == null || value === "") return fallback;
  return value;
}

function TrainingNominationTemplate({ training }) {
  const templateRef = useRef(null);
  const handlePrintToPdf = useReactToPrint({
    content: () => templateRef.current,
    documentTitle: "NCAA Training Nomination",
    removeAfterPrint: true,
  });

  const { userData } = useCurrentUser();

  const handleDownload = useCallback(async () => {
    if (!templateRef.current || typeof handlePrintToPdf !== "function") return;
    handlePrintToPdf();
  }, [handlePrintToPdf]);

  const staffFullName =
    [
      [
        userData?.data?.LAST_NAME,
        userData?.data?.FIRST_NAME,
        userData?.data?.OTHER_NAMES,
      ]
        .filter(Boolean)
        .join(" ")
        ?.toLowerCase(),
    ].find(Boolean) || "[Staff Full Name]";

  const staffPosition =
    training?.STAFF_POSITION || training?.POSITION || "[Staff Position]";
  const department =
    training?.DEPARTMENT_NAME ||
    training?.DIRECTORATE_NAME ||
    "[Department/Unit]";

  const directorName =
    training?.DIRECTOR_NAME ||
    training?.HEAD_OF_DEPARTMENT ||
    "[Director / Head of Department Name]";
  const directorTitle = training?.DIRECTOR_TITLE || "[Title/Position]";

  const titleOfTraining = safeValue(
    training?.TRAINING_TITLE,
    "________________________________________",
  );
  const organizer = safeValue(
    training?.ORGANIZER,
    "___________________________________",
  );
  const venue = safeValue(
    training?.VENUE,
    "__________________________________________________",
  );
  const startDate = training?.START_DATE
    ? dayjs(training.START_DATE).format("DD MMMM YYYY")
    : "";
  const endDate = training?.END_DATE
    ? dayjs(training.END_DATE).format("DD MMMM YYYY")
    : "";
  const dates = startDate && endDate ? `${startDate} - ${endDate}` : "";
  const duration = safeValue(
    training?.PERIOD_IN_DAYS ? `${training.PERIOD_IN_DAYS} day(s)` : "",
    "_______________________________________________",
  );

  return (
    <div className="w-full">
      <div className="flex justify-end mb-3">
        <Button
          type="primary"
          className="bg-[#00BCC2]"
          onClick={handleDownload}
        >
          Download
        </Button>
      </div>

      <article
        ref={templateRef}
        className="bg-white border border-slate-200 rounded-lg p-8 text-[15px] leading-7 font-helvetica text-[#111]"
      >
        <header className="border-b border-slate-200 pb-5 mb-6">
          <div className="flex items-center justify-center gap-4">
            <img
              src="/assets/images/NCAA.png"
              alt="NCAA Logo"
              className="w-20 h-20 object-contain"
            />
            <div className="text-center">
              <p className="text-[20px] font-bold mb-0">
                NIGERIA CIVIL AVIATION AUTHORITY
              </p>
              <p className="text-[14px] uppercase tracking-wide mb-0">
                Training Nomination
              </p>
            </div>
          </div>
        </header>

        {/* <section className="space-y-2 mb-6">
          <p className="mb-0 font-semibold">TO:</p>
          <p className="mb-0 capitalize">{staffFullName}</p>
          <p className="mb-0 capitalize">{staffPosition}</p>
          <p className="mb-0 capitalize">{department}</p>
        </section>

        <section className="space-y-2 mb-6">
          <p className="mb-0 font-semibold">FROM:</p>
          <p className="mb-0">{directorName}</p>
          <p className="mb-0">{directorTitle}</p>
        </section> */}

        <p className="mb-4 font-bold uppercase underline">
          Subject: Nomination/Request to Attend Training Programme
        </p>

        <p className="mb-4">
          You are hereby nominated and directed to attend the following training
          programme as part of the Agency&apos;s capacity development
          initiative:
        </p>

        <section className="space-y-2 mb-6">
          <p className="mb-0">
            <span className="font-semibold">Title of Training:</span>{" "}
            {titleOfTraining}
          </p>
          <p className="mb-0">
            <span className="font-semibold">Organizing Institution:</span>{" "}
            {organizer}
          </p>
          <p className="mb-0">
            <span className="font-semibold">Venue:</span> {venue}
          </p>
          <p className="mb-0">
            <span className="font-semibold">Date(s):</span>{" "}
            {safeValue(
              dates,
              "_______________________________________________",
            )}
          </p>
          <p className="mb-0">
            <span className="font-semibold">Duration:</span> {duration}
          </p>
        </section>

        <p className="mb-4">
          The objective of this training is to enhance your professional
          competence and improve service delivery within the Agency.
        </p>

        <div className="mb-4">
          <p className="mb-1">You are expected to:</p>
          <ol className="list-decimal ps-6 m-0 space-y-1">
            <li>Attend all sessions and actively participate.</li>
            <li>
              Conduct yourself in a manner that upholds the image of the Agency.
            </li>
            <li>
              Submit a comprehensive training report to your Department within
              five (5) working days after completion.
            </li>
          </ol>
        </div>

        <p className="mb-10">
          Please liaise with the Admin/HR Department for further logistics and
          necessary arrangements.
        </p>

        <footer>
          <p className="mb-0">____________________________</p>
          <p className="mb-0">{directorName}</p>
          <p className="mb-0">{directorTitle}</p>
        </footer>
      </article>
    </div>
  );
}

TrainingNominationTemplate.propTypes = {
  training: PropTypes.object,
};

export default TrainingNominationTemplate;
