import { useRef, useState } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Button, Drawer, Select, Spin } from "antd";
import { useReactToPrint } from "react-to-print";
import "react-quill/dist/quill.snow.css";
import {
  useGetTrainingTemplates,
  useGetSingleTrainingTemplate,
} from "../../../../API/trainingTemplates";
import {
  buildFinanceTableHtml,
  computeFinanceGrandTotal,
  financeAmountToWords,
  formatFinanceAmount,
  mergeTemplateContent,
} from "../../../../utils/trainingTemplateTokens";
import { errorToast } from "../../../../utils/toastMsgPop";

function safeText(value, fallback = "") {
  if (value == null || value === "") return fallback;
  return String(value);
}

const GenerateLetterDrawer = ({ open, onClose, training, staffList }) => {
  const printRef = useRef(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data: templates } = useGetTrainingTemplates();
  const templateOptions = Array.isArray(templates) ? templates : [];

  const { mutateAsync: getSingleTemplate, isPending: isLoadingTemplate } =
    useGetSingleTrainingTemplate();

  const handleSelectTemplate = async (templateId) => {
    setSelectedTemplateId(templateId ?? null);
    setSelectedTemplate(null);
    if (!templateId) return;

    try {
      const template = await getSingleTemplate(templateId);
      setSelectedTemplate({
        TEMPLATE_ID: templateId,
        NAME: template?.TEMPLATE_NAME,
        CONTENT: template?.TEMPLATE_CONTENT,
      });
    } catch (error) {
      errorToast(error?.response?.data?.message ?? error?.message);
    }
  };

  const handlePrintToPdf = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "NCAA Training Letter",
    removeAfterPrint: true,
  });

  const dateRange =
    training?.START_DATE && training?.END_DATE
      ? `${dayjs(training.START_DATE).format("DD MMM YYYY")} - ${dayjs(
          training.END_DATE,
        ).format("DD MMM YYYY")}`
      : training?.START_DATE
        ? dayjs(training.START_DATE).format("DD MMM YYYY")
        : "";

  const financeGrandTotal = computeFinanceGrandTotal(staffList);

  const mergeData = {
    LOCATION: safeText(training?.REGION_NAME),
    ORGANISER: safeText(training?.ORGANIZER),
    TRAINING_TITLE: safeText(training?.TRAINING_TITLE),
    VENUE: safeText(training?.VENUE),
    DATE: safeText(dateRange),
    DURATION: training?.PERIOD_IN_DAYS
      ? `${training.PERIOD_IN_DAYS} day(s)`
      : "",
    TIME: safeText(training?.TIME || training?.TRAINING_TIME, "09:00AM"),
    FINANCE_TABLE: buildFinanceTableHtml(staffList),
    TOTAL_COST: formatFinanceAmount(financeGrandTotal),
    TOTAL_COST_IN_WORDS: financeAmountToWords(financeGrandTotal),
  };

  const mergedHtml = selectedTemplate?.CONTENT
    ? mergeTemplateContent(selectedTemplate.CONTENT, mergeData)
    : ""

  const handleClose = () => {
    setSelectedTemplateId(null);
    setSelectedTemplate(null);
    onClose?.();
  };

  return (
    <Drawer
      title={<span className="font-helvetica">Generate Letter</span>}
      open={open}
      onClose={handleClose}
      width={800}
      className="font-helvetica"
      destroyOnClose
    >
      <div className="mb-5 flex items-end gap-3">
        <div className="flex-1">
          <p className="text-[#344054] text-xs mb-1 font-semibold font-helvetica">
            LETTER TEMPLATE
          </p>
          <Select
            size="large"
            className="w-full"
            placeholder="Select a template"
            value={selectedTemplateId ?? undefined}
            onChange={handleSelectTemplate}
            loading={isLoadingTemplate}
            options={templateOptions.map((item) => ({
              label: item.NAME,
              value: item.TEMPLATE_ID,
            }))}
          />
        </div>
        <Button
          type="primary"
          className="bg-[#00BCC2]"
          size="large"
          disabled={!selectedTemplate || isLoadingTemplate}
          onClick={() => handlePrintToPdf?.()}
        >
          Download
        </Button>
      </div>

      {isLoadingTemplate ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 flex flex-col items-center justify-center gap-3 text-slate-500 font-helvetica">
          <Spin />
          <p className="mb-0">Loading template content…</p>
        </div>
      ) : selectedTemplate ? (
        <article
          ref={printRef}
          className="bg-white rounded-lg p-8 text-[#111] mt-10"
        >
          <header className="pb-5 mb-6">
            <div className="flex text-center items-center gap-4 relative">
              <img
                src="/assets/images/NCAA.png"
                alt="NCAA Logo"
                className="w-[100px] h-[100px] object-contain ml-10"
              />
              <div className="text-cente flex flex-col ml20">
                <span className="text-[28px] font-bold mb-0 leading-0 p-0 font-open-sans">
                  NIGERIA CIVIL AVIATION AUTHORITY
                </span>
                <span className="text-[18px] font-bold mb-0 font-open-sans">
                  Corporate Headquarters, Abuja
                </span>
                <span className="text-[16px] font-light uppercase mb-0 font-open-sans">
                  Directorate of Human Resources and Administration
                </span>
                <span className="text-[16px] font-semibold uppercase mb-0 font-open-sans">
                  Internal Memo
                </span>
              </div>
            </div>
          </header>
          <div className="flex justify-center w-full max-w-xl mx-auto">
          <div className="ql-editor !overflow-visible !h-auto !p-0" dangerouslySetInnerHTML={{ __html: mergedHtml }} />

          </div>
        </article>
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-lg p-10 text-center text-slate-500 font-helvetica">
          Select a template above to preview the letter.
        </div>
      )}
    </Drawer>
  );
};

GenerateLetterDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  training: PropTypes.object,
  staffList: PropTypes.array,
};

export default GenerateLetterDrawer;
