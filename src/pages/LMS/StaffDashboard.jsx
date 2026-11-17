import { useLocation } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Plus,
  UsersRound,
} from "lucide-react";
import StaffCoursesTable from "../../components/core/lms/staff-dashboard/courses/StaffCoursesTable";
import EmployeeCourse from "../../components/core/lms/employee-courses/EmployeeCourses";
import { useCourseStore } from "../../hooks/useCourseStore";
import {
  useGetCreatorCourses,
  useGetStaffCourses,
} from "../../API/lms-apis/course";
import { useMemo } from "react";
import useCurrentUser from "../../hooks/useCurrentUser";

const formatCount = (value) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);

export default function StaffDashboard() {
  const { openCourseDrawer } = useCourseStore();
  const location = useLocation().pathname;

  const isLearningRoute = location === "/lms/learning";
  const isStaffRoute = location === "/lms/staff";
  const showCreatorFeatures = isStaffRoute;

  const { userData } = useCurrentUser();

  const { data: get_courses, isPending: isLoadingCourses } = useGetStaffCourses(
    userData?.data?.STAFF_ID,
  );
  const allCourses = useMemo(() => get_courses?.data || [], [get_courses]);
  const {
    data: creatorCourses = [],
    isPending: isLoadingCreatorCourses,
  } = useGetCreatorCourses(userData?.data?.STAFF_ID, isStaffRoute);

  const statsData = useMemo(() => {
    const totalCourses = allCourses?.length || 0;
    const completedCourses = allCourses.filter((course) => {
      const totalLessons = Number(course?.TOTAL_LESSONS) || 0;
      return totalLessons > 0 &&
        (Number(course?.COMPLETED_LESSONS) || 0) >= totalLessons;
    }).length;
    const courseInProgress = allCourses.filter((course) => {
      const completedLessons = Number(course?.COMPLETED_LESSONS) || 0;
      const totalLessons = Number(course?.TOTAL_LESSONS) || 0;
      return completedLessons > 0 && completedLessons < totalLessons;
    }).length;
    const pendingCourses = Math.max(
      totalCourses - completedCourses - courseInProgress,
      0,
    );

    return {
      totalCourses,
      pendingCourses,
      courseInProgress,
      completedCourses,
    };
  }, [allCourses]);

  const creatorStats = useMemo(() => {
    const courses = Array.isArray(creatorCourses) ? creatorCourses : [];
    const hasEnrollmentCounts = courses.some(
      (course) =>
        course?.TOTAL_RECIPIENTS != null ||
        course?.selling != null ||
        course?.course_recipients?.length != null,
    );
    const hasCompletionCounts = courses.some(
      (course) => course?.TOTAL_RECIPIENTS_COMPLETED != null,
    );
    const totalEnrollments = courses.reduce(
      (sum, course) =>
        sum +
        (Number(
          course?.TOTAL_RECIPIENTS ??
            course?.selling ??
            course?.course_recipients?.length,
        ) || 0),
      0,
    );
    const completedEnrollments = courses.reduce(
      (sum, course) =>
        sum + (Number(course?.TOTAL_RECIPIENTS_COMPLETED) || 0),
      0,
    );

    return {
      coursesCreated: courses.length,
      totalEnrollments:
        !courses.length || hasEnrollmentCounts ? totalEnrollments : null,
      completedEnrollments:
        !courses.length || hasCompletionCounts ? completedEnrollments : null,
    };
  }, [creatorCourses]);

  const activeStats = showCreatorFeatures
    ? [
        {
          label: "Courses created",
          value: creatorStats.coursesCreated,
          detail: "In your course library",
          icon: BookOpenCheck,
          color: "purple",
        },
        {
          label: "Learner enrollments",
          value: creatorStats.totalEnrollments,
          detail: "Across courses you created",
          icon: UsersRound,
          color: "blue",
        },
        {
          label: "Course completions",
          value: creatorStats.completedEnrollments,
          detail: "Learners who completed",
          icon: CheckCircle2,
          color: "green",
        },
      ]
    : [
        {
          label: "Assigned courses",
          value: statsData.totalCourses,
          detail: "Available in your learning",
          icon: BookOpen,
          color: "purple",
        },
        {
          label: "Pending",
          value: statsData.pendingCourses,
          detail: "Not started yet",
          icon: Clock3,
          color: "blue",
        },
        {
          label: "Completed",
          value: statsData.completedCourses,
          detail: "Courses finished",
          icon: CheckCircle2,
          color: "green",
        },
      ];

  const pageTitle = isLearningRoute
    ? "My Learning"
    : isStaffRoute
      ? "LMS Course"
      : "Employee Dashboard";
  const pageDescription = isLearningRoute
    ? "Continue the courses assigned to you and keep track of your learning progress."
    : isStaffRoute
      ? "Create and manage your learning content, review enrollments, and follow learner completions."
      : "Browse and complete courses assigned to you. Track your progress here.";

  const isLoadingStats = showCreatorFeatures
    ? isLoadingCreatorCourses
    : isLoadingCourses;

  return (
    <div className="min-h-full bg-[#f4f7fb] font-outfit text-[#17263c]">
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e293b] via-[#273451] to-[#3730a3] px-5 py-6 text-white shadow-[0_18px_45px_-28px_rgba(30,41,59,0.65)] sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-2 -top-10 h-52 w-52 rounded-full border border-white/10" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-violet-100">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
                Learning management
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                {pageTitle}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
                {pageDescription}
              </p>
            </div>
            {showCreatorFeatures && (
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#5146d8] shadow-sm transition hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                onClick={() => openCourseDrawer({ drawerName: "create-course" })}
              >
                <Plus className="h-4 w-4" />
                Create course
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            )}
          </div>
          <div className="relative mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {activeStats.map((stat) => {
              const Icon = stat.icon;
              const colorClasses = {
                purple: "border-violet-200/15 bg-violet-100/10 text-violet-100",
                blue: "border-blue-200/15 bg-blue-100/10 text-blue-100",
                green: "border-emerald-200/15 bg-emerald-100/10 text-emerald-100",
              };
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3.5 backdrop-blur-sm"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${colorClasses[stat.color]}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-300">
                      {stat.label}
                    </p>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums">
                      {isLoadingStats || stat.value === null
                        ? "—"
                        : formatCount(stat.value)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-7">
          {/* <div className="mb-4">
            <p             className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6258e8]">
              {showCreatorFeatures ? "Course management" : "Course catalog"}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#17263c]">
              {showCreatorFeatures ? "Courses you created" : "Courses assigned to you"}
            </h2>
          </div> */}
          {showCreatorFeatures ? (
            <StaffCoursesTable />
          ) : (
            <EmployeeCourse courses={allCourses} isLoading={isLoadingCourses} />
          )}
        </section>
      </main>
    </div>
  );
}
