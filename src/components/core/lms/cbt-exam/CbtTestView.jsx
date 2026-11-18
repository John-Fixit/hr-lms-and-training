import ExamControls from "./ExamControls";
import ExamHeader from "./ExamHeader";
import QuestionCard from "./QuestionCard";
import QuestionNavigator from "./QuestionNavigator";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCourseStore } from "../../../../hooks/useCourseStore";
import SubmitConfirmOverlay from "./SubmitConfirmOverlay";
import { useUpdateCourseLesson } from "../../../../API/lms-apis/course";
import { useSaveStaffSkill } from "../../../../API/trainingSkills";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import useCurrentUser from "../../../../hooks/useCurrentUser";
import { awardSkillsOnCompletion } from "../../training/shared/awardCompletionSkills";
import useQuizAttemptStore from "../../../../hooks/useQuizAttemptStore";

// Mock quiz data
// const quizData = {
//   config: {
//     allowed_attempt: 1,
//     total_grade: 10,
//     time_limit: 5,
//     grading_method: "highest",
//   },
//   questions: [
//     {
//       id: "e554a6d6-19a3-4f67-ae56-ab6a9e40e271",
//       question: "Have you read the material of this lesson?",
//       correct_answer: "f9e5ba75-3e06-4073-8764-aa81c3a5f6cb",
//       options: [
//         {
//           key: "f9e5ba75-3e06-4073-8764-aa81c3a5f6cb",
//           value: "Yes",
//         },
//         {
//           key: "d89a20a1-9d6a-4b2c-90d7-f885e4237f85",
//           value: "No",
//         },
//       ],
//     },
//     {
//       id: "q2",
//       question: "What is the capital of France?",
//       correct_answer: "paris",
//       options: [
//         { key: "london", value: "London" },
//         { key: "paris", value: "Paris" },
//         { key: "berlin", value: "Berlin" },
//         { key: "madrid", value: "Madrid" },
//       ],
//     },
//     {
//       id: "q3",
//       question: "Which programming language is this exam built with?",
//       correct_answer: "react",
//       options: [
//         { key: "react", value: "React" },
//         { key: "vue", value: "Vue" },
//         { key: "angular", value: "Angular" },
//         { key: "svelte", value: "Svelte" },
//       ],
//     },
//     {
//       id: "q4",
//       question: "What does HTML stand for?",
//       correct_answer: "hypertext",
//       options: [
//         { key: "hypertext", value: "Hypertext Markup Language" },
//         { key: "hightext", value: "High-level Text Markup Language" },
//         { key: "hyperlink", value: "Hyperlink and Text Markup Language" },
//         { key: "homepage", value: "Homepage Markup Language" },
//       ],
//     },
//     {
//       id: "q5",
//       question: "Which company developed React?",
//       correct_answer: "facebook",
//       options: [
//         { key: "google", value: "Google" },
//         { key: "facebook", value: "Facebook" },
//         { key: "microsoft", value: "Microsoft" },
//         { key: "apple", value: "Apple" },
//       ],
//     },
//     {
//       id: "q6",
//       question: "What is CSS used for?",
//       correct_answer: "styling",
//       options: [
//         { key: "styling", value: "Styling web pages" },
//         { key: "database", value: "Managing databases" },
//         { key: "server", value: "Running servers" },
//         { key: "logic", value: "Programming logic" },
//       ],
//     },
//     {
//       id: "q7",
//       question: "What does API stand for?",
//       correct_answer: "interface",
//       options: [
//         { key: "interface", value: "Application Programming Interface" },
//         { key: "internet", value: "Application Platform Internet" },
//         { key: "protocol", value: "Application Protocol Integration" },
//         { key: "program", value: "Application Program Integration" },
//       ],
//     },
//     {
//       id: "q8",
//       question: "Which of these is a JavaScript framework?",
//       correct_answer: "nextjs",
//       options: [
//         { key: "django", value: "Django" },
//         { key: "nextjs", value: "Next.js" },
//         { key: "laravel", value: "Laravel" },
//         { key: "flask", value: "Flask" },
//       ],
//     },
//   ],
// };

const QUESTIONS_PER_VIEW = 2;

const CbtTestView = () => {
  const { data, closeCourseDrawer } = useCourseStore();
  const lesson = data?.lesson;
  const quizScope = data?.quizScope || "lesson";
  const attemptKey =
    data?.restoreAttemptKey ||
    (quizScope === "general"
      ? `general_${lesson?.COURSE_ID || lesson?.LESSON_ID || "quiz"}`
      : `lesson_${lesson?.LESSON_RECIPIENT_ID || lesson?.LESSON_ID}`);
  const attempts = useQuizAttemptStore((state) => state.attempts);
  const upsertAttempt = useQuizAttemptStore((state) => state.upsertAttempt);
  const clearAttempt = useQuizAttemptStore((state) => state.clearAttempt);
  const storedAttempt = attempts?.[attemptKey];

  const [currentViewPage, setCurrentViewPage] = useState(
    storedAttempt?.currentViewPage || 0,
  );
  const [answers, setAnswers] = useState(storedAttempt?.answers || {});
  const [markedForReview, setMarkedForReview] = useState(
    storedAttempt?.markedForReview || [],
  );
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const { mutateAsync: updateCourseLesson, isPending: isSubmitting } =
    useUpdateCourseLesson();
  const { mutateAsync: saveStaffSkill } = useSaveStaffSkill();

  const { userData } = useCurrentUser();
  const quizQuestionsData = data?.quizData;

  const quizData = useMemo(
    () => ({
      config: {
        allowed_attempt: lesson?.ATTEMPTS_ALLOWED,
        total_grade: lesson?.TOTAL_QUIZ_SCORE,
        time_limit: lesson?.DURATION,
        // grading_method: lesson?.grading_method,
      },
      questions:
        quizQuestionsData?.map((quiz) => ({
          id: quiz?.QUIZ_ID,
          question: quiz?.QUIZ_QUESTION,
          correct_answer: quiz?.QUIZ_ANSWER,
          options: quiz?.QUIZ_OPTIONS?.map((option) => ({
            key: option,
            value: option,
          })),
        })) || [],
    }),
    [
      lesson?.ATTEMPTS_ALLOWED,
      lesson?.DURATION,
      lesson?.TOTAL_QUIZ_SCORE,
      quizQuestionsData,
    ],
  );

  const [timeLeft, setTimeLeft] = useState(() => {
    if (storedAttempt?.endAt) {
      return Math.max(0, Math.ceil((storedAttempt.endAt - Date.now()) / 1000));
    }
    return Number(quizData?.config?.time_limit || 0) * 60;
  });

  const topViewRef = useRef(null);
  const confirmSubmitRef = useRef(null);
  const hasAutoSubmittedRef = useRef(false);
  const submissionInProgressRef = useRef(false);
  const submissionCompletedRef = useRef(false);

  const totalViewPages = Math.ceil(
    quizData?.questions?.length / QUESTIONS_PER_VIEW,
  );

  // Calculate which questions to display
  const startIndex = currentViewPage * QUESTIONS_PER_VIEW;
  const endIndex = Math.min(
    startIndex + QUESTIONS_PER_VIEW,
    quizData.questions.length,
  );
  const questionsToDisplay = quizData.questions.slice(startIndex, endIndex);

  useEffect(() => {
    if (submissionCompletedRef.current || showSubmitConfirm) return;
    if (!attemptKey) return;
    const durationMins = Number(quizData?.config?.time_limit || 0);
    const startAt = storedAttempt?.startAt || Date.now();
    const endAt =
      storedAttempt?.endAt || startAt + Math.max(0, durationMins) * 60 * 1000;
    upsertAttempt(attemptKey, {
      attemptKey,
      lesson,
      quizData: quizQuestionsData,
      quizScope,
      startAt,
      endAt,
      answers,
      markedForReview,
      currentViewPage,
      isSubmitted: false,
    });
  }, [
    answers,
    attemptKey,
    currentViewPage,
    lesson,
    markedForReview,
    quizQuestionsData,
    quizScope,
    quizData?.config?.time_limit,
    showSubmitConfirm,
    storedAttempt?.endAt,
    storedAttempt?.startAt,
    upsertAttempt,
  ]);

  useEffect(() => {
    hasAutoSubmittedRef.current = false;
    submissionInProgressRef.current = false;
    submissionCompletedRef.current = false;
  }, [attemptKey]);

  useEffect(() => {
    if (timeLeft > 0 || hasAutoSubmittedRef.current) return;
    hasAutoSubmittedRef.current = true;
    confirmSubmitRef.current?.(0);
  }, [timeLeft]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          hasAutoSubmittedRef.current = true;
          confirmSubmitRef.current?.(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attemptKey]);

  const handleSelectAnswer = (questionId, answerKey) => {
    setAnswers({
      ...answers,
      [questionId]: answerKey,
    });
  };

  const handleNavigate = (index) => {
    const newPage = Math.floor(index / QUESTIONS_PER_VIEW);
    setCurrentViewPage(newPage);
  };

  const handleNextPage = () => {
    if (currentViewPage < totalViewPages - 1) {
      setCurrentViewPage(currentViewPage + 1);
    }
    topViewRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePreviousPage = () => {
    if (currentViewPage > 0) {
      setCurrentViewPage(currentViewPage - 1);
    }
  };

  const handleToggleReview = (questionIndex) => {
    if (markedForReview.includes(questionIndex)) {
      setMarkedForReview(markedForReview.filter((i) => i !== questionIndex));
    } else {
      setMarkedForReview([...markedForReview, questionIndex]);
    }
  };

  const handleSubmit = () => {
    setShowSubmitConfirm(true);
  };

  const updateLessonRequest = async (score) => {
    if (quizScope === "general") {
      return {
        data: {
          message: "General quiz submitted. Backend integration pending.",
        },
      };
    }
    const payload = {
      update_type: "iscompleted",
      json: {
        IS_COMPLETED: true,
        SCORE: score,
        DATE_SCORED: new Date().toISOString(),
        LESSON_RECIPIENT_ID: lesson?.LESSON_RECIPIENT_ID,
        STAFF_ID: userData?.data?.STAFF_ID,
      },
    };
    try {
      const res = await updateCourseLesson(payload);
      return res;
    } catch (err) {
      const errMsg =
        err?.response?.data?.message || "Failed to update lesson view";
      errorToast(errMsg);
    }
  };

  async function confirmSubmit(remainingTime) {
    if (submissionInProgressRef.current || submissionCompletedRef.current) {
      return;
    }
    submissionInProgressRef.current = true;

    const eachQuestionMrk =
      quizData?.config?.total_grade / quizData?.questions?.length;
    const score = quizData.questions.reduce((total, question) => {
      return total + (answers[question.id] === question.correct_answer ? 1 : 0);
    }, 0);
    const calculateTotalScore = score * eachQuestionMrk;

    try {
      const res = await updateLessonRequest(calculateTotalScore);
      successToast(res?.data?.message);
      if (res) {
        const course = data?.course || data?.courseDetail || data?.course_detail;
        await awardSkillsOnCompletion({
          saveStaffSkill,
          staffIds: [userData?.data?.STAFF_ID],
          skillIds:
            course?.SKILLS ??
            course?.skills ??
            course?.SKILL_IDS ??
            course?.skill_ids ??
            lesson?.SKILLS ??
            lesson?.SKILL_IDS,
          source: "HR",
          notes: `Awarded on completing ${course?.COURSE_TITLE || lesson?.TITLE || "course"}`,
        });
        submissionCompletedRef.current = true;
        clearAttempt(attemptKey);
        //=======================
        remainingTime === 0 ? setShowSubmitConfirm(true) : closeCourseDrawer();
        //===================
      }
    } catch (err) {
      submissionInProgressRef.current = false;
      const errMsg =
        err?.response?.data?.message || "Failed to update lesson view";
      errorToast(errMsg);
    }
  }
  confirmSubmitRef.current = confirmSubmit;

  const handleViewPageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalViewPages) {
      setCurrentViewPage(newPage);
    }
  };

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex-col gap-4 w-full flex items-center justify-center">
          <div className="w-28 h-28 border-8 text-blue-400 text-4xl animate-spin border-gray-300 flex items-center justify-center border-t-blue-400 rounded-full" />
        </div>
      </div>
    );
  }

  if (showSubmitConfirm) {
    return (
      <>
        <SubmitConfirmOverlay
          showSubmitConfirm={showSubmitConfirm}
          setShowSubmitConfirm={setShowSubmitConfirm}
          timeLeft={timeLeft}
          answers={answers}
          quizData={quizData}
          confirmSubmit={() => {
            confirmSubmit();
          }}
          closeCourseDrawer={closeCourseDrawer}
        />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <ExamHeader timeLeft={timeLeft} />

        <div ref={topViewRef}></div>
        <div className="flex-1 container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Display multiple questions */}

            {questionsToDisplay.map((question, index) => {
              const actualIndex = startIndex + index;
              return (
                <QuestionCard
                  key={question.id}
                  question={question}
                  currentIndex={actualIndex}
                  totalQuestions={quizData.questions.length}
                  selectedAnswer={answers[question.id]}
                  onSelectAnswer={(answerKey) =>
                    handleSelectAnswer(question.id, answerKey)
                  }
                  isMarked={markedForReview.includes(actualIndex)}
                  onToggleReview={() => handleToggleReview(actualIndex)}
                />
              );
            })}

            {/* Page info */}
            <div className="text-center py-4">
              <p
                className="text-gray-600"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Showing questions {startIndex + 1} - {endIndex} of{" "}
                {quizData.questions.length}
              </p>
            </div>
            <ExamControls
              onPrevious={handlePreviousPage}
              onNext={handleNextPage}
              onMarkReview={() => {}} // Not used in multi-question view
              onSubmit={handleSubmit}
              isFirst={currentViewPage === 0}
              isLast={currentViewPage === totalViewPages - 1}
              isMarked={false}
            />
          </div>

          <div className="lg:col-span-1">
            <QuestionNavigator
              questions={quizData.questions}
              answers={answers}
              markedForReview={markedForReview}
              onNavigate={handleNavigate}
              currentViewPage={currentViewPage}
              totalViewPages={totalViewPages}
              onViewPageChange={handleViewPageChange}
              questionsPerView={QUESTIONS_PER_VIEW}
              startIndex={startIndex}
              endIndex={endIndex}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default CbtTestView;
