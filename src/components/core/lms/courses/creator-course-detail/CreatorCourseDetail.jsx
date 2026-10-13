import { useCallback, useMemo } from "react";
import { useGetCreatorCourseDetail } from "../../../../../API/lms-apis/course";
import { useCourseStore } from "../../../../../hooks/useCourseStore";
import RecipientTable from "./RecipientTable";
import CourseFeatures from "../course-detail/CourseFeatures";
import { getCompoundPeriod } from "../../../../../utils/utitlities";
import StarLoader from "../../../loaders/StarLoader";
import {
  FiBell,
  FiBookOpen,
  FiDownload,
  FiFileText,
  FiClipboard,
} from "react-icons/fi";

const avatarColors = [
  "#f47c20",
  "#1abc9c",
  "#8b5cf6",
  "#ef4444",
  "#0ea5e9",
  "#f59e0b",
  "#10b981",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#a855f7",
  "#334155",
  "#16a34a",
  "#dc2626",
  "#7c3aed",
  "#0369a1",
  "#b45309",
  "#047857",
  "#9f1239",
  "#1d4ed8",
  "#0891b2",
  "#92400e",
  "#6d28d9",
  "#065f46",
];

const getStatus = (s) =>
  s.lessons === 0
    ? "none"
    : s.lessons >= s?.total_lessons
      ? "completed"
      : "progress";
const getProgress = (s) => Math.round((s.lessons / s?.total_lessons) * 100);

function calcStats(students = []) {
  const w = students.filter((s) => s.score !== null);
  return {
    enrolled: students.length,
    completed: students.filter((s) => getStatus(s) === "completed").length,
    avgScore: w.length
      ? isNaN(w.reduce((a, s) => a + s.score, 0) / w.length)
        ? 0
        : Math.round(w.reduce((a, s) => a + s.score, 0) / w.length) || 0
      : null,
    avgProgress: isNaN(
      students.reduce((a, s) => a + getProgress(s), 0) / students.length,
    )
      ? 0
      : Math.round(
          students.reduce((a, s) => a + getProgress(s), 0) / students.length,
        ) || 0,
  };
}

// ── Full Page ──────────────────────────────────────────────────────────────
export default function CreatorCourseDetail() {
  const { data } = useCourseStore();
  const courseDetail = data?.courseDetail;

  const { data: courseDetailData, isPending } = useGetCreatorCourseDetail(
    courseDetail?.COURSE_ID,
  );

  const getLessonDetail = useCallback(
    (lessonID) => {
      const courseLesson = courseDetailData?.course_lessons;
      const singleLesson = courseLesson?.find(
        (lsn) => lsn?.LESSON_ID === lessonID,
      );
      return singleLesson;
    },
    [courseDetailData?.course_lessons],
  );

  const refactorLessonData = useCallback(
    (recipient) => {
      const lessonArray = recipient?.LESSON_RECIPIENTS;
      const totalLessons = lessonArray?.length;
      const completedLessons = lessonArray?.filter(
        (lesson) => lesson?.IS_COMPLETED,
      )?.length;
      const score = lessonArray
        ?.filter((lesson) => lesson?.IS_COMPLETED)
        ?.reduce((a, s) => a + (s?.SCORE || 0), 0);

      const calcQuizScore = lessonArray
        ?.filter((lsn) => getLessonDetail(lsn?.LESSON_ID)?.HAS_QUIZ)
        ?.reduce((a, s) => a + (s?.TOTAL_QUIZ_SCORE || 0), 0);

      const totalQuizScore = isNaN(calcQuizScore) ? 0 : calcQuizScore;

      const totalScorePercentage = isNaN(score / totalQuizScore)
        ? 0
        : (score / totalQuizScore) * 100;

      return { totalLessons, completedLessons, totalScorePercentage };
    },
    [getLessonDetail],
  );

  const STUDENTS = useMemo(() => {
    return courseDetailData?.course_recipients?.map((recipient) => {
      const name =
        recipient?.FULLNAME ||
        recipient?.EMAIL?.split(".")[0] +
          " " +
          recipient?.EMAIL?.split("@")[0]?.split(".")[1];

      const { totalLessons, completedLessons, totalScorePercentage } =
        refactorLessonData(recipient);
      const color =
        avatarColors[Math.floor(Math.random() * avatarColors.length)];
      return {
        staffId: recipient?.STAFF_ID ?? recipient?.ID,
        name,
        email: recipient?.EMAIL,
        lessons: completedLessons,
        score: totalScorePercentage,
        completedAt: recipient?.DATE_COMPLETED || null,
        color,
        total_lessons: totalLessons,
        lessonBreakdown:
          recipient?.LESSON_RECIPIENTS?.map((lessonRecipient) => {
            const lessonInfo = getLessonDetail(lessonRecipient?.LESSON_ID);
            return {
              lessonId: lessonRecipient?.LESSON_ID,
              lessonTitle: lessonInfo?.TITLE,
              hasQuiz: lessonInfo?.HAS_QUIZ,
              quizType: lessonInfo?.QUIZ_TYPE || "manual",
              score: lessonRecipient?.SCORE,
              totalQuizScore: lessonInfo?.TOTAL_QUIZ_SCORE || 0,
              isCompleted: lessonRecipient?.IS_COMPLETED,
              uploadedAnswerUrl:
                lessonRecipient?.UPLOADED_ANSWER_FILE_URL ||
                lessonRecipient?.QUIZ_UPLOAD_ANSWER_URL ||
                lessonRecipient?.ANSWER_FILE_URL ||
                "",
            };
          }) || [],
        generalQuiz: {
          quizType: courseDetailData?.general_quiz?.QUIZ_TYPE || "manual",
          score:
            recipient?.GENERAL_QUIZ_SCORE ??
            recipient?.COURSE_QUIZ_SCORE ??
            recipient?.TOTAL_GENERAL_SCORE ??
            null,
          total: courseDetailData?.general_quiz?.TOTAL_QUIZ_SCORE || 0,
          uploadedAnswerUrl:
            recipient?.GENERAL_QUIZ_UPLOAD_ANSWER_URL ||
            recipient?.GENERAL_ANSWER_FILE_URL ||
            "",
        },
      };
    });
  }, [
    courseDetailData?.course_recipients,
    courseDetailData?.general_quiz,
    getLessonDetail,
    refactorLessonData,
  ]);

  const stats = useMemo(() => calcStats(STUDENTS), [STUDENTS]);

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-screen">
        <StarLoader size={40} />
      </div>
    );
  }

  return (
    <div
      className="bg-[#f4f6fb] min-h-screen"
      style={{ fontFamily: "DM Sans,sans-serif" }}
    >
      {/* ── HERO ── */}
      <div className="bg-[#0f1b35] relative overflow-hidden rounded-t-xl">
        {/* dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.1] bg-no-repeat h-56"
          style={{
            backgroundImage: `radial-gradient(#fff 1px,transparent 1px),`,
            backgroundSize: "22px 22px",
            backgroundPosition: "center",
          }}
        />

        <div className="relative z-10 px-10 pt-8 flex justify-between items-start gap-4 flex-wrap">
          <div>
            <div className="flex gap-2 mb-3 flex-wrap">
              <span
                className="bg-[#1abc9c] text-white text-[11px] font-bold px-3 py-1 rounded-full"
                style={{ fontFamily: "Sora,sans-serif" }}
              >
                Department
              </span>
              <span
                className="bg-[#f47c20] text-white text-[11px] font-bold px-3 py-1 rounded-full"
                style={{ fontFamily: "Sora,sans-serif" }}
              >
                INFORMATION, COMMUNICATION &amp; TECHNOLOGY (ICT)
              </span>
            </div>
            <h1
              className="font-bold text-white text-[26px] mb-2.5"
              style={{ fontFamily: "Sora,sans-serif" }}
            >
              {courseDetailData?.COURSE_TITLE}
            </h1>
            <div className="flex gap-5 text-white/60 text-xs mb-2.5 flex-wrap">
              <span>
                📅{" "}
                {getCompoundPeriod(
                  courseDetailData?.START_DATE,
                  courseDetailData?.END_DATE,
                )}
              </span>
              <span>🎬 {courseDetailData?.course_lessons?.length} Lessons</span>
              <span>🏷 Department (ICT)</span>
            </div>
          </div>
          {/* <div className="flex flex-col gap-2">
            <button
              className="bg-[#f47c20] text-white border-none rounded-lg px-5 py-2.5 text-xs font-semibold cursor-pointer"
              style={{ fontFamily: "Sora,sans-serif" }}
            >
              ✏️ Edit Course
            </button>
          </div> */}
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-4 mt-6 border-t border-white/10 relative z-10">
          {[
            {
              label: "Enrolled",
              value: stats.enrolled,
              color: "text-[#1abc9c]",
              sub: null,
            },
            {
              label: "Completed",
              value: stats.completed,
              color: "text-green-400",
              sub: null,
            },
            {
              label: "Avg Score",
              value: stats.avgScore !== null ? stats.avgScore + "%" : "—",
              color: "text-[#f47c20]",
              sub: "quiz takers",
            },
            {
              label: "Avg Progress",
              value: stats.avgProgress + "%",
              color: "text-white",
              sub: "all students",
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`px-8 py-4 ${i < 3 ? "border-r border-white/10" : ""}`}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1"
                style={{ fontFamily: "Sora,sans-serif" }}
              >
                {item.label}{" "}
                {item.sub && (
                  <span className="normal-case font-normal text-white/30">
                    ({item.sub})
                  </span>
                )}
              </div>
              <div
                className={`font-bold text-[26px] ${item.color}`}
                style={{ fontFamily: "Sora,sans-serif" }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div
        className="max-w[1300px] mx-auto px-10 py-7 grid gap-6"
        style={{ gridTemplateColumns: "1fr 300px" }}
      >
        {/* LEFT */}
        <div className="flex flex-col gap-5">
          <RecipientTable
            students={STUDENTS}
            courseId={courseDetail?.COURSE_ID}
          />

          {/* Course Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div>
              <div>
                <div
                  className="font-bold text-blue-800 text-sm mb-3"
                  style={{ fontFamily: "Sora,sans-serif" }}
                >
                  Course Overview
                </div>
                <p className="text-slate-500 text-[13px] leading-relaxed">
                  {courseDetailData?.COURSE_DESCRIPTION}
                </p>
              </div>
              {courseDetailData?.COURSE_OBJECTIVE && (
                <div className="mt-4">
                  <div
                    className="font-bold text-blue-800 text-sm mb-3"
                    style={{ fontFamily: "Sora,sans-serif" }}
                  >
                    Course Objective
                  </div>
                  <p className="text-slate-500 text-[13px] leading-relaxed">
                    {courseDetailData?.COURSE_OBJECTIVE}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="flex flex-col gap-5">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div
              className="font-bold text-blue-800 text-sm mb-4"
              style={{ fontFamily: "Sora,sans-serif" }}
            >
              Quick Actions
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: <FiClipboard />, label: "Add Quiz" },
                { icon: <FiBookOpen />, label: "Add Lesson" },
                { icon: <FiBell />, label: "Announce" },
                { icon: <FiDownload />, label: "Export" },
              ].map((a) => (
                <button
                  key={a.label}
                  className="border border-slate-200 rounded-xl py-3 px-2 flex flex-col items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-white cursor-pointer hover:border-[#1abc9c] hover:text-[#1abc9c] transition-all duration-200"
                  style={{ fontFamily: "Sora,sans-serif" }}
                >
                  <span className="text-xl">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div
              className="font-bold text-blue-800 text-sm mb-4 flex items-center gap-2"
              style={{ fontFamily: "Sora,sans-serif" }}
            >
              <FiFileText />
              Manual Grading Queue
            </div>
            <p className="text-xs text-slate-500">
              Uploaded quiz answers appear here when API fields are available.
            </p>
          </div>

          {/* Course Features */}

          <CourseFeatures course={courseDetailData} />

          {/* Curriculum */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div
              className="font-bold text-blue-800 text-sm mb-4"
              style={{ fontFamily: "Sora,sans-serif" }}
            >
              Course Curriculum
            </div>
            <div className="flex flex-col gap-2">
              {courseDetailData?.course_lessons?.map((c, idx) => (
                <div
                  key={c?.LESSON_ID + idx}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 flex justify-between items-center cursor-pointer hover:border-[#1abc9c] hover:bg-[#f0fdfb] transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-[22px] h-[22px] rounded-md bg-[#0f1b35] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ fontFamily: "Sora,sans-serif" }}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium">{c?.TITLE}</span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      c.status === "done"
                        ? "bg-green-100 text-green-700"
                        : c.status === "partial"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c.status === "done"
                      ? "✔"
                      : c.status === "partial"
                        ? "½"
                        : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
