import { Accordion, AccordionItem, Button } from "@nextui-org/react";
import { BsDashCircleDotted, BsPlusCircleDotted } from "react-icons/bs";
import { CiImageOn, CiVideoOn } from "react-icons/ci";
import { FaEye, FaRegFilePdf } from "react-icons/fa";
import { FiDownloadCloud, FiUploadCloud } from "react-icons/fi";
import PropTypes from "prop-types";
import { useCourseStore } from "../../../../../hooks/useCourseStore";
import { mediaKindFromPath } from "../../../../../utils/fileExtension";
import LessonDocModal from "../../lms-modals/lesson-doc-modal";
import QuizConfirmModal from "../../lms-modals/QuizConfirmModal";
import { uploadFileData } from "../../../../../utils/uploadfile";
import useCurrentUser from "../../../../../hooks/useCurrentUser";

const findFileType = (file) => {
  const kind = mediaKindFromPath(file);
  if (kind === "office") return "pdf";
  if (kind === "unknown") return "image";
  return kind;
};

const documentType = {
  video: CiVideoOn,
  pdf: FaRegFilePdf,
  image: CiImageOn,
};

const CourseCurriculum = ({ course }) => {
  const { updateData } = useCourseStore();
  const { userData } = useCurrentUser();

  const openConfirmStartQuizModal = (
    lesson,
    quizScope = "lesson",
    generalQuizData = null,
  ) => {
    updateData({
      is_open_confirm_start_quiz: true,
      lesson: lesson,
      quizScope,
      generalQuizData,
      course,
    });
  };

  const viewLessonDoc = (lesson) => {
    updateData({
      filePath: lesson?.MEDIA_ATTACHMENT,
      is_open_lesson_doc: true,
      lesson: lesson,
      fileKind: findFileType(lesson?.MEDIA_ATTACHMENT || lesson?.FILE_NAME),
    });
  };

  const handleUploadQuizAnswer = async (lesson, file) => {
    if (!file) return;
    const uploaded = await uploadFileData(file, userData?.token);
    const key = lesson?.LESSON_ID || `general_${course?.COURSE_ID}`;
    updateData({
      [`quiz_answer_upload_${key}`]: uploaded?.file_url,
    });
  };

  const generalQuiz = course?.general_quiz || course?.GENERAL_QUIZ;
  const hasGeneralQuiz =
    course?.HAS_GENERAL_QUIZ ||
    ["general", "both"].includes(course?.QUIZ_STRATEGY);

  return (
    <>
      <div className="border rounded-lg p-6">
        <h2 className="text-blue-900 text-[18px] lg:text-[20px] font-outfit font-bold">
          Course Curriculum
        </h2>

        <Accordion
          variant="splitted"
          itemClasses={{
            base: "m-0 p-0 shadow-none rounded-lg border",
          }}
          isCompact
        >
          {course?.course_lessons?.map((curriculum, index) => {
            const docType = findFileType(curriculum?.MEDIA_ATTACHMENT);
            const Icon = documentType[docType || "video"];

            return (
              <AccordionItem
                key={index}
                aria-label={curriculum?.TITLE}
                title={curriculum?.TITLE}
                subtitle={null}
                indicator={({ isOpen }) =>
                  isOpen ? (
                    <BsDashCircleDotted className="w-5 h-5 text-gray-600 rotate-90" />
                  ) : (
                    <BsPlusCircleDotted className="w-5 h-5 text-gray-600 " />
                  )
                }
                classNames={{
                  title: "font-outfit font-medium text-[16px] text-gray-600",
                  heading: "py-0 my-0 data-[open=true]:border-b px-4 ",
                  content: "px-4 pb-6",
                }}
              >
                <div className="mt-3">
                  <div>
                    <h3 className="text-blue-900 text-sm font-outfit font-medium mb-">
                      Description
                    </h3>
                    <p className="font-outfit">{curriculum.DESCRIPTION}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg transition-colors mt-3">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-400" />

                        <span className="font-outfit text-slate-800">
                          {/* Web Designing Beginner */}
                          {curriculum?.QUIZ_DESCRIPTION}
                        </span>
                      </div>
                      <Button
                        isIconOnly
                        radius="full"
                        size="sm"
                        className="w-8 h-8 rounded-full bg-green-100  flex items-center justify-center"
                        onPress={() => viewLessonDoc(curriculum)}
                      >
                        <FaEye className="w-4 h-4 text-green-600" />
                      </Button>
                    </div>
                    {curriculum?.HAS_QUIZ ? (
                      <div className="mt-2">
                        {(curriculum?.QUIZ_TYPE || "manual") === "manual" ? (
                          <Button
                            onClick={() =>
                              openConfirmStartQuizModal(curriculum)
                            }
                            radius="sm"
                            size="sm"
                            color="primary"
                            className="font-helvetica"
                            isDisabled={curriculum?.IS_COMPLETED}
                          >
                            Attempt Quiz
                          </Button>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={curriculum?.QUIZ_UPLOAD_FILE_URL}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Button
                                size="sm"
                                variant="bordered"
                                className="font-outfit"
                              >
                                <FiDownloadCloud />
                                Download Quiz
                              </Button>
                            </a>
                            <label
                              htmlFor={`quiz_answer_${curriculum?.LESSON_ID}`}
                            >
                              <Button
                                as="span"
                                size="sm"
                                color="primary"
                                className="font-outfit"
                              >
                                <FiUploadCloud />
                                Upload Answer
                              </Button>
                            </label>
                            <input
                              id={`quiz_answer_${curriculum?.LESSON_ID}`}
                              type="file"
                              className="hidden"
                              onChange={(e) =>
                                handleUploadQuizAnswer(
                                  curriculum,
                                  e.target.files?.[0],
                                )
                              }
                            />
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </AccordionItem>
            );
          })}
        </Accordion>
        {hasGeneralQuiz ? (
          <div className="mt-4 border rounded-lg p-4 bg-slate-50">
            <h3 className="font-outfit text-blue-900 font-semibold">
              General Quiz
            </h3>
            <p className="font-outfit text-sm text-slate-600 mt-1">
              {generalQuiz?.QUIZ_DESCRIPTION || "Course-level assessment"}
            </p>
            <div className="mt-3">
              {(generalQuiz?.QUIZ_TYPE || "manual") === "manual" ? (
                <Button
                  color="primary"
                  size="sm"
                  onClick={() =>
                    openConfirmStartQuizModal(
                      {
                        ...generalQuiz,
                        LESSON_ID: `general-${course?.COURSE_ID}`,
                        COURSE_ID: course?.COURSE_ID,
                        QUIZ_DESCRIPTION:
                          generalQuiz?.QUIZ_DESCRIPTION || "General Quiz",
                        DURATION: generalQuiz?.DURATION || 0,
                        ATTEMPTS_ALLOWED: generalQuiz?.ATTEMPTS_ALLOWED || 1,
                        TOTAL_QUIZZES: generalQuiz?.questions?.length || 0,
                        TOTAL_QUIZ_SCORE: generalQuiz?.TOTAL_QUIZ_SCORE || 0,
                      },
                      "general",
                      generalQuiz?.questions || [],
                    )
                  }
                >
                  Attempt General Quiz
                </Button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <a
                    href={generalQuiz?.QUIZ_UPLOAD_FILE_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button
                      size="sm"
                      variant="bordered"
                      className="font-outfit"
                    >
                      <FiDownloadCloud />
                      Download Quiz
                    </Button>
                  </a>
                  <label htmlFor={`general_quiz_answer_${course?.COURSE_ID}`}>
                    <Button
                      as="span"
                      size="sm"
                      color="primary"
                      className="font-outfit"
                    >
                      <FiUploadCloud />
                      Upload Answer
                    </Button>
                  </label>
                  <input
                    id={`general_quiz_answer_${course?.COURSE_ID}`}
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      handleUploadQuizAnswer(generalQuiz, e.target.files?.[0])
                    }
                  />
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <LessonDocModal />

      <QuizConfirmModal
        isOpen={true}
        // onClose={() => setOpen(false)}
        // onConfirm={() => {
        //   setOpen(false);
        //   alert("Quiz started! 🚀");
        // }}
        // quizTitle="Chapter 4 Assessment"
        // questionCount={20}
        // timeLimit="30 min"
        // attempts="1 attempt"
      />
    </>
  );
};

CourseCurriculum.propTypes = {
  course: PropTypes.any,
};

export default CourseCurriculum;
