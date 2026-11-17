import { Drawer } from "antd";
import { useEffect, useState } from "react";
import CourseInfo from "../courses/create-course/CourseInfo";
import { useCourseStore } from "../../../../hooks/useCourseStore";
import { useForm } from "react-hook-form";
import AddCurriculum from "../courses/create-course/AddCurriculum";
import AddCourseRecipient from "../courses/create-course/AddCourseRecipient";
import GeneralQuizConfig from "../courses/create-course/GeneralQuizConfig";
import useCurrentUser from "../../../../hooks/useCurrentUser";
import { useCreateCourse } from "../../../../API/lms-apis/course";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { normalizeSkillIds } from "../../training/shared/awardCompletionSkills";

const curriculumDefaultRows = {
  lesson_title: "",
  lesson_description: "",
  document_type: "",
  document_url: "",
  document_file: null,
  has_quiz: false,
  quiz_type: "manual",
  quiz_upload_file: null,
  quiz_upload_file_url: "",
  quiz_upload_instruction: "",
};

const CreateCourseDrawer = () => {
  const { isOpen, closeCourseDrawer, data } = useCourseStore();
  const [selectedTab, setSelectedTab] = useState(0);

  const { userData } = useCurrentUser();

  const editCourse = data?.editCourse || false;
  const courseDetail = data?.courseDetail;

  const { mutateAsync: mutateCreateCourse, isPending: isCreatingCourse } =
    useCreateCourse();

  const handleNext = () => {
    setSelectedTab(selectedTab + 1);
  };
  const handlePrev = () => {
    setSelectedTab(selectedTab - 1);
  };

  const hook_form_props = useForm({
    defaultValues: {
      curriculum: [curriculumDefaultRows],
      recipientType: "staff",
      quiz_strategy: "lesson",
      general_quiz: null,
      skills: [],
    },
  });

  const quizStrategy = hook_form_props.watch("quiz_strategy");
  const hasGeneralQuiz = ["general", "both"].includes(quizStrategy);

  useEffect(() => {
    if (editCourse) {
      hook_form_props.reset({
        course_title: courseDetail?.COURSE_TITLE,
        course_objective: courseDetail?.COURSE_OBJECTIVE,
        course_description: courseDetail?.COURSE_DESCRIPTION,
        start_date: courseDetail?.START_DATE,
        end_date: courseDetail?.END_DATE,
        course_category: courseDetail?.COURSE_CATEGORY,
        course_thumbnail_url: courseDetail?.COURSE_PREVIEW_IMAGE,
        curriculum: courseDetail?.course_lessons?.map((lesson) => ({
          lesson_title: lesson?.TITLE,
          lesson_description: lesson?.DESCRIPTION,
          document_url: lesson?.MEDIA_ATTACHMENT,
          has_quiz: lesson?.HAS_QUIZ,
        })),
        recipients: courseDetail?.course_recipients?.STAFF_IDS,
        recipientType:
          courseDetail?.course_recipients?.recipient_type || "staff",
        quiz_strategy: courseDetail?.QUIZ_STRATEGY || "lesson",
        general_quiz: courseDetail?.general_quiz || null,
        skills: normalizeSkillIds(
          courseDetail?.SKILLS ??
            courseDetail?.skills ??
            courseDetail?.SKILL_IDS ??
            courseDetail?.skill_ids,
        ),
      });
    }
  }, [courseDetail, editCourse, hook_form_props]);

  const handleSubmit = async () => {
    // eslint-disable-next-line no-unused-vars
    const { course_thumbnail_file, curriculum, ...rest } =
      hook_form_props.getValues();
    const formattedCurriculum = curriculum.map((crcl) => {
      const {
        lesson_title,
        lesson_description,
        document_url,
        has_quiz,
        quiz,
        quiz_type,
        quiz_upload_file_url,
        quiz_upload_instruction,
        // quizString,
      } = crcl;

      const quiz_config = quiz?.config;

      const formattedQuizQuestions = quiz?.questions?.map((q) => {
        return {
          QUIZ_QUESTION: q?.question,
          QUIZ_ANSWER: q?.options?.find((opt) => opt.key === q?.correct_answer)
            ?.value,
          QUIZ_OPTIONS: q?.options?.map((opt) => opt.value),
        };
      });

      return {
        TITLE: lesson_title || "",
        DESCRIPTION: lesson_description || "",
        MEDIA_ATTACHMENT: document_url || "",
        HAS_QUIZ: has_quiz || null,
        QUIZ_TYPE: has_quiz ? quiz_type || "manual" : null,
        QUIZ_UPLOAD_FILE_URL: quiz_upload_file_url || "",
        QUIZ_UPLOAD_INSTRUCTION: quiz_upload_instruction || "",
        QUIZ_DESCRIPTION: quiz_config?.quiz_description || "",
        ATTEMPTS_ALLOWED: quiz_config?.allowed_attempt || "",
        DURATION: quiz_config?.time_limit || "",
        TOTAL_QUIZ_SCORE: quiz_config?.total_grade || "",
        lesson_quiz: {
          questions: formattedQuizQuestions,
        },
      };
    });

    const generalQuiz = hook_form_props.getValues("general_quiz");
    const formattedGeneralQuestions = generalQuiz?.questions?.map((q) => ({
      QUIZ_QUESTION: q?.question,
      QUIZ_ANSWER: q?.options?.find((opt) => opt.key === q?.correct_answer)
        ?.value,
      QUIZ_OPTIONS: q?.options?.map((opt) => opt.value),
    }));

    console.log(hook_form_props.getValues());

    const json = {
      COURSE_CATEGORY: rest?.course_category,
      COMPANY_ID: userData?.data?.COMPANY_ID,
      COURSE_TITLE: rest?.course_title,
      COURSE_OBJECTIVE: rest?.course_objective,
      COURSE_DESCRIPTION: rest?.course_description,
      USE_AS_APPRAISAL: true,
      START_DATE: rest?.start_date,
      END_DATE: rest?.end_date,
      CREATOR: userData?.data?.STAFF_ID,
      PERFORMANCE_CYCLE_ID: 12,
      HAS_LINE_MANAGER: false,
      QUIZ_STRATEGY: rest?.quiz_strategy || "lesson",
      HAS_GENERAL_QUIZ: hasGeneralQuiz,
      general_quiz:
        hasGeneralQuiz && generalQuiz
          ? {
              QUIZ_TYPE: generalQuiz?.quiz_type || "manual",
              QUIZ_UPLOAD_FILE_URL: generalQuiz?.quiz_upload_file_url || "",
              QUIZ_UPLOAD_INSTRUCTION:
                generalQuiz?.quiz_upload_instruction || "",
              QUIZ_DESCRIPTION: generalQuiz?.config?.quiz_description || "",
              ATTEMPTS_ALLOWED: generalQuiz?.config?.allowed_attempt || "",
              DURATION: generalQuiz?.config?.time_limit || "",
              TOTAL_QUIZ_SCORE: generalQuiz?.config?.total_grade || "",
              questions: formattedGeneralQuestions,
            }
          : null,
      COURSE_PREVIEW_IMAGE: rest?.course_thumbnail_url,
      skills: rest?.skills || [],
      course_lessons: formattedCurriculum,
      course_recipients: {
        recipient_type: rest?.recipientType,
        STAFF_IDS: rest?.recipients,
      },
    };
    try {
      const response = await mutateCreateCourse(json);
      successToast(response?.data?.message || "Course created successfully");
      closeCourseDrawer();
    } catch (err) {
      errorToast(
        err?.response?.data?.message || err?.message || "Error creating course",
      );
    }
  };

  const sideTabs = [
    {
      title: "Course Info",
      content: <CourseInfo {...hook_form_props} handleNext={handleNext} />,
    },
    {
      title: "Curriculum",
      content: (
        <AddCurriculum
          {...hook_form_props}
          curriculumDefaultRows={curriculumDefaultRows}
          handlePrev={handlePrev}
          handleNext={handleNext}
        />
      ),
    },
    ...(hasGeneralQuiz
      ? [
          {
            title: "General Quiz",
            content: (
              <GeneralQuizConfig
                {...hook_form_props}
                handlePrev={handlePrev}
                handleNext={handleNext}
              />
            ),
          },
        ]
      : []),
    {
      title: "Recipient",
      content: (
        <AddCourseRecipient
          {...hook_form_props}
          curriculumDefaultRows={curriculumDefaultRows}
          handlePrev={handlePrev}
          handleNext={handleSubmit}
          isCreatingCourse={isCreatingCourse}
        />
      ),
    },
  ];

  useEffect(() => {
    if (selectedTab > sideTabs.length - 1) {
      setSelectedTab(sideTabs.length - 1);
    }
  }, [selectedTab, sideTabs.length]);

  return (
    <Drawer
      width={900}
      onClose={closeCourseDrawer}
      open={isOpen}
      className="bg-[#F5F7FA] z-[10]"
      classNames={{
        body: "bg-[#F7F7F7] p-0",
        header: "bg-[#F7F7F7]",
      }}
    >
      <div className="flex md:flex-nowrap flex-col md:flex-row hfull gap-4 md:p-5">
        {/* Main Content Area - Takes up most space */}
        <div className="flex-1 min-w-0 p-5 overflow-y-auto border border-gray-200 bg-white rounded-lg order-2 md:order-1">
          {sideTabs?.map((tab, index) => (
            <div
              key={index}
              style={{
                display: selectedTab === index ? "block" : "none",
              }}
            >
              {tab?.content}
            </div>
          ))}
        </div>

        {/* Side Tabs - Fixed width */}
        <div className="flex-shrink-0 w-32 flex flex-col gap-3 pt-10 pb-5 pl-8 border-l border-gray-300 order-1 md:order-2">
          {sideTabs?.map((tab, index) => (
            <div
              key={index}
              onClick={() => setSelectedTab(index)}
              className={`relative cursor-pointer text-base leading-[19.5px] transition-all font-outfit ${
                selectedTab === index
                  ? "font-medium text-[rgba(39, 44, 51, 1)]"
                  : "font-normal text-[rgba(39, 44, 51, 0.7)]"
              }`}
            >
              {tab?.title}
              <span
                className={`absolute -left-[22px] top-1 w-[0.7rem] h-[0.7rem] rounded-full border border-white transition-all duration-200 ${
                  selectedTab === index ? "bg-blue-900" : "bg-gray-300"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
};

export default CreateCourseDrawer;
