import { Input } from "antd";
import PropTypes from "prop-types";
import { Button } from "@nextui-org/react";
import { useState } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { IoChevronBack, IoChevronForward, IoCreateOutline } from "react-icons/io5";
import useCurrentUser from "../../../../../hooks/useCurrentUser";
import { uploadFileData } from "../../../../../utils/uploadfile";
import QuizBuilderModal from "./QuizBuiderModal";
import { errorToast } from "../../../../../utils/toastMsgPop";

const GeneralQuizConfig = ({ watch, setValue, handlePrev, handleNext }) => {
  const [isOpenQuizModal, setIsOpenQuizModal] = useState(false);
  const { userData } = useCurrentUser();
  const quizType = watch("general_quiz.quiz_type") || "manual";

  const handleUpload = async (file) => {
    const res = await uploadLmsCourseFile(file, userData?.token);
    return res?.file_url;
  };

  const validateBeforeContinue = () => {
    if (quizType === "manual") {
      if (!watch("general_quiz.questions")?.length) {
        return "Please set questions for the general quiz.";
      }
      return null;
    }
    if (!watch("general_quiz.quiz_upload_file_url")) {
      return "Please upload a general quiz file.";
    }
    return null;
  };

  const onContinue = () => {
    const err = validateBeforeContinue();
    if (err) {
      errorToast(err);
      return;
    }
    handleNext();
  };

  return (
    <>
      <main>
        <h2 className="font-outfit text-xl font-semibold text-blue-900">
          General Quiz
        </h2>
        <p className="font-outfit text-gray-500">
          Configure an optional course-level quiz.
        </p>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { value: "manual", label: "Manual Questions" },
              { value: "upload", label: "Upload Quiz File" },
            ].map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setValue("general_quiz.quiz_type", opt.value)}
                className={`text-sm border rounded-lg p-3 text-left ${
                  quizType === opt.value
                    ? "border-blue-900 bg-blue-50 text-blue-900"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {quizType === "manual" ? (
            <div className="border rounded-lg p-3">
              <Button
                className="font-outfit px-2 flex gap-1"
                size="sm"
                onPress={() => setIsOpenQuizModal(true)}
              >
                <IoCreateOutline size={16} />
                Set General Quiz
              </Button>
              <p className="text-xs text-slate-500 mt-2">
                Add questions, options and timing in the builder.
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-3 space-y-3">
              <label htmlFor="general_quiz_upload_file" className="block">
                <div className="border rounded flex items-center">
                  <p className="bg-gray-100 px-3 py-2 font-medium font-outfit flex items-center gap-2 text-sm">
                    <FiUploadCloud /> Upload General Quiz File
                  </p>
                  <div className="py-2 px-3 font-outfit text-sm">
                    {watch("general_quiz.quiz_upload_file")?.name || "No file chosen"}
                  </div>
                </div>
                <input
                  id="general_quiz_upload_file"
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setValue("general_quiz.quiz_upload_file", file);
                    const fileUrl = await handleUpload(file);
                    setValue("general_quiz.quiz_upload_file_url", fileUrl);
                  }}
                />
              </label>
              <Input.TextArea
                value={watch("general_quiz.quiz_upload_instruction") || ""}
                onChange={(e) =>
                  setValue("general_quiz.quiz_upload_instruction", e.target.value)
                }
                autoSize={{ minRows: 2 }}
                placeholder="Instruction for learners (download, complete, upload answer)."
              />
            </div>
          )}
          <div className="flex justify-between gap-2 items-center border-t border-gray-200 py-4 mt-6">
            <Button
              color="primary"
              variant="bordered"
              className="mt-6 font-outfit"
              radius="sm"
              onPress={handlePrev}
            >
              <IoChevronBack /> Prev
            </Button>
            <Button
              color="primary"
              className="mt-6 font-outfit"
              radius="sm"
              onPress={onContinue}
            >
              Next <IoChevronForward />
            </Button>
          </div>
        </div>
      </main>
      <QuizBuilderModal
        isOpen={isOpenQuizModal}
        handleClose={() => setIsOpenQuizModal(false)}
        setValue={setValue}
        targetPath="general_quiz"
        initialQuizData={watch("general_quiz")}
        title="General Quiz Builder"
      />
    </>
  );
};

GeneralQuizConfig.propTypes = {
  watch: PropTypes.func,
  setValue: PropTypes.func,
  handlePrev: PropTypes.func,
  handleNext: PropTypes.func,
};

export default GeneralQuizConfig;
