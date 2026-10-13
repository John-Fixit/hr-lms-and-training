import { Fragment, forwardRef, useImperativeHandle, useRef } from "react";
import PropTypes from "prop-types";
import { Button, ConfigProvider } from "antd";
import { useReactToPrint } from "react-to-print";
import dayjs from "dayjs";

const boxClass = "inline-block w-4 h-4 border border-black align-middle";

const toCleanString = (value) =>
  (value == null ? "" : String(value).trim())?.toLowerCase();
const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const TickBox = ({ checked }) => (
  <span
    className={`${boxClass} inline-flex items-center justify-center text-[10px] font-semibold leading-none ${checked ? "bg-black text-white" : ""}`}
  >
    {checked ? "✓" : ""}
  </span>
);

TickBox.propTypes = {
  checked: PropTypes.bool,
};

TickBox.defaultProps = {
  checked: false,
};

const Rating5Scale = ({ selected }) => (
  <div className="grid grid-cols-[auto_24px_auto_24px_auto_24px_auto_24px_auto_24px] items-center gap-x-2 text-[11px] whitespace-nowrap">
    <span>Poor</span>
    <TickBox checked={selected === 1} />

    <span>Satisfactory</span>
    <TickBox checked={selected === 2} />

    <span>Good</span>
    <TickBox checked={selected === 3} />

    <span>Very Good</span>
    <TickBox checked={selected === 4} />

    <span>Excellent</span>
    <TickBox checked={selected === 5} />
  </div>
);

Rating5Scale.propTypes = {
  selected: PropTypes.number,
};

Rating5Scale.defaultProps = {
  selected: null,
};

const ExtentScale = ({ selected }) => (
  <div className="grid grid-cols-[auto_16px_auto_16px_auto_16px_auto_16px] items-center gap-x-2 text-[11px]">
    <span>Not at all</span>
    <TickBox checked={selected === 1} />
    <span>Some Extent</span>
    <TickBox checked={selected === 2} />
    <span>Great Extent</span>
    <TickBox checked={selected === 3} />
    <span>Fully</span>
    <TickBox checked={selected === 4} />
  </div>
);

ExtentScale.propTypes = {
  selected: PropTypes.number,
};

ExtentScale.defaultProps = {
  selected: null,
};

const TRAINING_FEEDBACK_PRINT_CSS = `
  @page { size: A4 portrait; margin: 14mm 12mm; }
  @media print {
    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .training-feedback-print-root {
      max-width: 100% !important;
      width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
    }
    /* Joined on screen; only when printing/saving as PDF start segment 2 on a new page */
    .training-feedback-print-segment-2 {
      break-before: page;
      page-break-before: always;
      margin-top: 0 !important;
      padding-top: 0 !important;
    }
    .training-feedback-print-avoid-row {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }
`;

const OneToTenScale = ({ label, selected }) => (
  <div>
    <p className="text-[11px] font-semibold mb-0.5">{label}</p>
    <div className="grid grid-cols-10 border border-black text-center text-[11px] leading-5">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={`border-r border-black last:border-r-0 ${
            selected === i + 1 ? "bg-black text-white font-semibold" : ""
          }`}
        >
          {selected === i + 1 ? `${i + 1}` : i + 1}
        </span>
      ))}
    </div>
    <div className="flex justify-between px-8 text-[11px] mt-0.5">
      <span>Low</span>
      <span>High</span>
    </div>
  </div>
);

OneToTenScale.propTypes = {
  label: PropTypes.string.isRequired,
  selected: PropTypes.number,
};

OneToTenScale.defaultProps = {
  selected: null,
};

const TrainingFeedback = forwardRef(function TrainingFeedback(
  {
    review,
    logoSrc = "/assets/images/NCAA.png",
    showDownloadButton = true,
    downloadFileName = "Training Feedback Form.pdf",
    training = null,
  },
  ref,
) {
  const internalRef = useRef(null);
  const page1Ref = useRef(null);
  const page2Ref = useRef(null);
  useImperativeHandle(ref, () => internalRef.current);
  const handlePrintToPdf = useReactToPrint({
    content: () => internalRef.current,
    documentTitle: downloadFileName.replace(/\.pdf$/i, "") || "Document",
    pageStyle: TRAINING_FEEDBACK_PRINT_CSS,
    removeAfterPrint: true,
  });
  const fullName = [
    toCleanString(review?.FIRST_NAME),
    toCleanString(review?.LAST_NAME),
    toCleanString(review?.OTHER_NAMES),
  ]
    .filter(Boolean)
    .join(" ");
  const directorateDept = [
    toCleanString(review?.DIRECTORATE_NAME),
    toCleanString(review?.DEPARTMENT_NAME),
  ]
    .filter(Boolean)
    .join(" / ");
  const designation = toCleanString(review?.DESIGNATION);
  const duration = toCleanString(review?.DURATION).toLowerCase();
  const durationSuggestion = toCleanString(review?.DURATION_SUGGESTION);
  const comments = [
    toCleanString(review?.COMMENTS),
    toCleanString(review?.REVIEW_NOTE),
  ]
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .join(" ");

  return (
    <div className="w-full p-2 md:p-3 font-helvetica text-[12px]">
      {showDownloadButton && (
        <div className="w-full max-w-[980px] mx-auto flex justify-end flex-wrap gap-2 mb-2">
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: "#00BCC2",
              },
            }}
          >
            <Button
              type="primary"
              className="font-helvetica bg-[#00BCC2]"
              onClick={handlePrintToPdf}
            >
              Print / Save as PDF
            </Button>
          </ConfigProvider>
        </div>
      )}

      <div
        ref={internalRef}
        className="training-feedback-print-root p-2 bg-white max-w-[980px] mx-auto"
      >
        {/* Single outer frame on screen; segment-2 breaks to a new page only when printing */}
        <div className="border border-black p-2">
          <div ref={page1Ref} className="training-feedback-print-segment-1">
            <header className="border-b border-black pb2">
              <div className="flex items-center gap-2">
                <img
                  src={logoSrc}
                  alt="NCAA Logo"
                  className="w-10 h-10 object-contain"
                />
                <div className="flex-1 text-center leading-tight">
                  <h1 className="text-[18px] md:text-[22px] font-bold m-0 uppercase">
                    Nigeria Civil Aviation Authority
                  </h1>
                  <p className="text-[13px] md:text-[15px] font-bold m-0 uppercase">
                    Corporate Headquarters, Abuja
                  </p>
                </div>
              </div>
            </header>

            <div className="py-1 text-center">
              <span className="inline-block border border-black px-5 py-0.5 text-[12px] font-bold uppercase">
                Training Feedback Form
              </span>
            </div>

            {/* <p className="text-[12px] font-semibold mb2">
              Please fill this form in CAPITAL LETTER
            </p> */}

            <section className="border border-black">
              <div className="grid grid-cols-[150px_1fr_110px_1fr] border-b border-black">
                <div className="border-r border-black p-1 font-semibold text-[11px] flex items-center leading-none">
                  <span className="leading-none border border-white">
                    STAFF NAME:
                  </span>
                </div>
                <div className="p-1 text-[11px] capitalize border-r border-black flex items-center">
                  {fullName}
                </div>
                <div className="border-r border-black p-1 font-semibold text-[11px] flex items-center">
                  <span className="leading-none border border-white">
                    STAFF NO:
                  </span>
                </div>
                <div className="p-1 text-[11px] capitalize flex items-center">
                  {review?.STAFF_NUMBER}
                </div>
              </div>
              <div className="grid grid-cols-[150px_1fr_110px_1fr] border-b border-black">
                <div className="border-r border-black p-1 font-semibold text-[11px] flex items-center">
                  DIRECTORATE/DEPT.:
                </div>
                <div className="border-r text-[11px] border-black p-1 capitalize flex items-center">
                  {directorateDept}
                </div>
                <div className="border-r border-black p-1 font-semibold text-[11px] flex items-center">
                  DESIGNATION:
                </div>
                <div className="p-1 text-[11px] capitalize flex items-center">
                  {designation}
                </div>
              </div>
              <div className="grid grid-cols-[150px_1fr_110px_1fr] border-b border-black">
                <div className="border-r border-black p-1 font-semibold text-[11px] flex items-center">
                  EMAIL ADDRESS:
                </div>
                <div className="border-r border-black p-1 break-words text-[11px] flex items-center">
                  {toCleanString(review?.EMAIL)}
                </div>
                <div className="border-r border-black p-1 font-semibold text-[11px] flex items-center">
                  PHONE
                </div>
                <div className="border-r text-[11px] p-1 uppercase flex items-center">
                  {toCleanString(review?.PHONE)}
                </div>
              </div>
              <div className="grid grid-cols-[150px_1fr_110px_1fr] border-b border-black">
                <div className="border-r border-black p-1 font-semibold text-[11px] flex items-center">
                  COURSE TITLE:
                </div>
                <div className="border-r text-[11px] border-black p-1 capitalize flex items-center">
                  {training?.TRAINING_TITLE}
                </div>
                <div className="border-r border-black p-1 font-semibold text-[11px] flex items-center">
                  DATE:
                </div>
                <div className="p-1 text-[11px] capitalize flex items-center">
                  {dayjs(training?.START_DATE).format("DD/MM/YYYY")} -{" "}
                  {dayjs(training?.END_DATE).format("DD/MM/YYYY")}
                </div>
              </div>

              <div className="training-feedback-print-avoid-row grid grid-cols-[260px_1fr] border-b border-black">
                <div className="border-r border-black p-1.5 leading-4 text-[11px]">
                  <span className="font-semibold mr-2">1.</span>
                  Overall, how would you rate this course
                </div>
                <div className="p-1.5">
                  <Rating5Scale selected={toNumber(review?.OVERALL_RATING)} />
                </div>
              </div>

              <div className="training-feedback-print-avoid-row grid grid-cols-[260px_1fr] border-b border-black">
                <div className="border-r border-black p-1.5 leading-4 text-[11px]">
                  <span className="font-semibold mr-2">2.</span>
                  Rate your knowledge and skill level (please tick box)
                </div>
                <div className="p-1.5 space-y-1">
                  <OneToTenScale
                    label="Before the course"
                    selected={toNumber(review?.SKILLS_BEFORE_COURSE)}
                  />
                  <OneToTenScale
                    label="After the course"
                    selected={toNumber(review?.SKILLS_AFTER_COURSE)}
                  />
                </div>
              </div>

              <div className="training-feedback-print-avoid-row grid grid-cols-[260px_1fr] border-b border-black">
                <div className="border-r border-black p-1.5 leading-4">
                  <p className="m-0 text-[11px] font-medium">
                    <span className="font-semibold mr-2">3.</span>
                    Rating of the instructor(s)
                  </p>
                </div>
                <div className="p-1.5" />

                {[
                  {
                    label: "Presentation",
                    value: review?.PRESENTATION,
                  },
                  {
                    label: "Knowledge & command of subject",
                    value: review?.KNOWLEDGE_AND_COMMAND,
                  },
                  {
                    label: "Use of training aids",
                    value: review?.USE_OF_AIDS,
                  },
                  {
                    label:
                      "Open exchange of ideas, participations & group interaction",
                    value: review?.INTERACTION,
                  },
                ].map((q, i) => (
                  <Fragment key={q.label}>
                    <div className="border-r border-black px-1.5 py-1 text-[11px] leading-4 flex gap-1.5">
                      <span className="shrink-0">
                        {String.fromCharCode(97 + i)}.
                      </span>
                      <span>{q.label}</span>
                    </div>
                    <div className="px-1.5 py-1 flex items-center">
                      <Rating5Scale selected={toNumber(q.value)} />
                    </div>
                  </Fragment>
                ))}
              </div>

              <div className="grid grid-cols-[260px_1fr]">
                <div className="border-r border-black p-1.5 leading-4">
                  <p className="m-0 text-[11px] font-medium">
                    <span className="font-semibold mr-2">4.</span>
                    Evaluation of the Training/Workshop/Seminar
                  </p>
                </div>
                <div className="p-1.5" />

                {[
                  {
                    label: "Was the training relevant to your job profile?",
                    value: review?.JOB_RELEVANCE,
                  },
                  {
                    label: "Practical coverage of the subject?",
                    value: review?.PRACTICAL_COVERAGE,
                  },
                  {
                    label:
                      "Will you be able to put what you learnt into practice?",
                    value: review?.APPLY_LEARNING,
                  },
                  {
                    label:
                      "The training was in conformity with the training need identified?",
                    value: review?.CONFORMITY_NEED,
                  },
                  {
                    label:
                      "Was the environment of training suitable for learning? (Training Premises, Size of training hall, Security, ventilation and basic amenities)",
                    value: review?.ENVIRONMENT,
                  },
                ].map((q, i) => (
                  <Fragment key={q.label}>
                    <div className="border-r border-black px-1.5 py-1 leading-4 flex gap-1.5 text-[11px]">
                      <span className="shrink-0">
                        {String.fromCharCode(97 + i)}.
                      </span>
                      <span>{q.label}</span>
                    </div>
                    <div className="px-1.5 py1 flex items-start">
                      <ExtentScale selected={toNumber(q.value)} />
                    </div>
                  </Fragment>
                ))}
              </div>
            </section>
          </div>

          <div ref={page2Ref} className="training-feedback-print-segment2">
            <section className="border border-black">
              <div className="grid grid-cols-[260px_1fr] border-b border-black text-[11px]">
                <div className="border-r border-black p-1.5 leading-4">
                  <span className="font-semibold mr-2">5.</span>a. The duration
                  of Training program?
                </div>
                <div className="p-1.5 flex gap-x-5 items-center text-[11px]">
                  <div className="flex items-center gap-x-2">
                    <span>Short</span>
                    <TickBox checked={duration === "short"} />
                  </div>
                  <div className="flex items-center gap-x-2">
                    <span>Long</span>
                    <TickBox checked={duration === "long"} />
                  </div>
                  <div className="flex items-center gap-x-2">
                    <span>Adequate</span>
                    <TickBox checked={duration === "adequate"} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[260px_1fr] border-b border-black text-[11px]">
                <div className="border-r border-black p-1.5 leading-4">
                  <span className="font-semibold mr-2">b.</span>
                  If not adequate please suggest
                </div>
                <div className="p-1.5">
                  <div className="border-b border-black h-6">
                    {durationSuggestion}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[260px_1fr]">
                <div className="border-r border-black p-1.5 font-semibold text-[11px]">
                  COMMENTS
                </div>
                <div className="p-1.5 space-y-3">
                  <div className="border-b border-black min-h-4 capitalize">
                    {comments}
                  </div>
                  <div className="border-b border-black" />
                  <div className="border-b border-black" />
                  {/* <div className="border-b border-black" /> */}
                </div>
              </div>
            </section>

            <section className="mt-1 flex justify-between items-start gap-5 print:mt3">
              <div className="text-[11px]">
                <p className="font-semibold m-0 mb1">Grading:</p>
                <div className="grid grid-cols-3 gap-x-8 gap-y-0.5">
                  <span>Not at all = 1</span>
                  <span>Poor = 1</span>
                  <span>Some Extent = 2</span>
                  <span>Satisfactory = 2</span>
                  <span>Great Extent = 3</span>
                  <span>Good = 3</span>
                  <span>Fully = 4</span>
                  <span>Very Good = 4</span>
                  <span>Excellent = 5</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-semibold">Overall Score =</span>
                <span className="w-16 h-6 border border-black inline-flex items-center justify-center font-semibold">
                  {toCleanString(review?.TOTAL_SCORE)}
                </span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
});

TrainingFeedback.propTypes = {
  review: PropTypes.object,
  logoSrc: PropTypes.string,
  showDownloadButton: PropTypes.bool,
  downloadFileName: PropTypes.string,
  training: PropTypes.object,
};

export default TrainingFeedback;
