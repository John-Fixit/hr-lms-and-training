import {
  Download,
  Search,
  SlidersHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState } from "react";
import { FaEdit } from "react-icons/fa";
import useCurrentUser from "../../../../../hooks/useCurrentUser";
import {
  useDeleteCourse,
  useGetCreatorCourses,
  useMutateCourseDetail,
} from "../../../../../API/lms-apis/course";
import dayjs from "dayjs";
import {
  getCompoundPeriod,
  toStringDate,
} from "../../../../../utils/utitlities";
import clsx from "clsx";
import StarLoader from "../../../loaders/StarLoader";
import { useCourseStore } from "../../../../../hooks/useCourseStore";
import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { errorToast } from "../../../../../utils/toastMsgPop";
import { exportExcel } from "../../../../../utils/exportReportAsExcel";

const getAvailabilityStatus = (course) => {
  const today = dayjs().startOf("day");
  if (course?.START_DATE && dayjs(course.START_DATE).isAfter(today)) {
    return "upcoming";
  }
  if (course?.END_DATE && dayjs(course.END_DATE).isBefore(today)) {
    return "ended";
  }
  return "active";
};

const StaffCoursesTable = () => {
  const [selectedCourse, setSelectedCourse] = useState(null);

  const { userData } = useCurrentUser();
  const { data: get_courses, isPending: isLoadingCourses } =
    useGetCreatorCourses(userData?.data?.STAFF_ID);

  const { mutateAsync: mutateCourseDetail, isPending: isLoadingCourseDetail } =
    useMutateCourseDetail(userData?.data?.STAFF_ID);

    console.log(get_courses, "get_courses");

  const allCourses = useMemo(() => get_courses || [], [get_courses]);
  const [currentPage, setCurrentPage] = useState(1);

  const { mutateAsync: mutateDeleteCourse } = useDeleteCourse();

  const { openCourseDrawer } = useCourseStore();

  const rowsPerPage = 10;
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const categories = useMemo(
    () => [
      ...new Set(
        allCourses.map((course) => course?.COURSE_CATEGORY).filter(Boolean),
      ),
    ],
    [allCourses],
  );

  const filteredCourses = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return allCourses.filter((course) => {
      const matchesSearch =
        !query ||
        [
          course?.COURSE_TITLE,
          course?.COURSE_CATEGORY,
          course?.COURSE_DESCRIPTION,
        ].some((value) => String(value || "").toLowerCase().includes(query));
      const matchesCategory =
        categoryFilter === "all" || course?.COURSE_CATEGORY === categoryFilter;
      const matchesAvailability =
        availabilityFilter === "all" ||
        getAvailabilityStatus(course) === availabilityFilter;
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [allCourses, searchValue, categoryFilter, availabilityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedCourses = useMemo(() => {
    const startIndex = (safePage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredCourses?.slice(startIndex, endIndex);
  }, [filteredCourses, safePage, rowsPerPage]);

  console.log(paginatedCourses, "paginatedCourses");

  const handleExport = () => {
    exportExcel({
      fileName: "my-lms-courses",
      excelData: filteredCourses.map((course) => ({
        "Course title": course?.COURSE_TITLE || "",
        Category: course?.COURSE_CATEGORY || "",
        Description: course?.COURSE_DESCRIPTION || "",
        Availability: getAvailabilityStatus(course),
        "Start date": course?.START_DATE || "",
        "End date": course?.END_DATE || "",
        Enrollments:
          course?.TOTAL_RECIPIENTS ??
          course?.selling ??
          course?.course_recipients?.length ??
          "",
        Completions: course?.TOTAL_RECIPIENTS_COMPLETED ?? "",
      })),
    });
  };

  const handleDeleteCourse = (course) => {
    Modal.confirm({
      title: "Confirm",
      icon: <ExclamationCircleOutlined />,
      content: "Are you sure to delete this course?",
      okText: "Confirm",
      cancelText: "Cancel",
      onOk: async () => {
        const json = {
          courseID: course?.COURSE_ID,
          staffID: userData?.data?.STAFF_ID,
        };
        try {
          await mutateDeleteCourse(json);
        } catch (err) {
          const msg = err?.response?.data?.message;
          errorToast(msg);
        }
      },
    });
  };

  const handleEditCourse = async (course) => {
    //fetch course details before proceesing
    setSelectedCourse(course?.COURSE_ID);
    try {
      const detail_res = await mutateCourseDetail(course.COURSE_ID);
      openCourseDrawer({
        drawerName: "create-course",
        editCourse: true,
        courseDetail: { ...course, ...detail_res },
      });
    } catch (error) {
      errorToast(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load course details.",
      );
    }
  };

  const handleViewCourse = (course) => {
    openCourseDrawer({
      drawerName: "creator-course-detail",
      courseDetail: { ...course },
    });
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_-20px_rgba(15,23,42,0.4)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[#17263c] font-outfit">
              My courses
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredCourses.length} of {allCourses.length} courses
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={isLoadingCourses || !filteredCourses.length}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3.5 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-[#5146d8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export report
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:grid-cols-2 sm:px-6 xl:grid-cols-[minmax(220px,1fr)_220px_200px]">
          <label className="relative block">
            <span className="sr-only">Search your courses</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search title, category, or description"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by category</span>
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by course availability</span>
            <select
              value={availabilityFilter}
              onChange={(event) => {
                setAvailabilityFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            >
              <option value="all">All availability</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto px-5 py-5 sm:px-6">
          <table className="w-full">
            <thead>
              <tr className="bg-[#212529] text-white">
                <th className="text-left py-4 px-2 md:px-6 font-semibold tracking-wide rounded-l-lg text-nowrap font-outfit">
                  Course Name
                </th>
                <th className="text-center py-2 px-4 font-semibold tracking-wide font-outfit">
                  Category
                </th>
                <th className="text-center py-2 px-4 font-semibold tracking-wide font-outfit">
                  Period
                </th>

                {/* <th className="text-center py-2 px-4 font-semibold tracking-wide font-outfit">
                  Lessons
                </th> */}
                <th className="text-center py-2 px-4 font-semibold tracking-wide font-outfit">
                  Ends At
                </th>
                <th className="text-center py-2 px-6 font-semibold tracking-wide font-outfit rounded-r-lg">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoadingCourses ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex h-32 items-center justify-center">
                      <StarLoader />
                    </div>
                  </td>
                </tr>
              ) : paginatedCourses.length ? (
                paginatedCourses.map((course, idx) => (
                  <tr
                    key={course.COURSE_ID ?? idx}
                    className="border-b border-gray-200"
                  >
                    <td className="py-4 px-2 md:px-6">
                      <button
                        type="button"
                        className="flex w-56 items-center gap-4 text-left md:w-full"
                        onClick={() => handleViewCourse(course)}
                      >
                        <img
                          src={course.COURSE_PREVIEW_IMAGE}
                          alt={course.COURSE_TITLE}
                          className="w-16 h-12 rounded-lg object-cover"
                        />
                        <span className="cursor-pointer font-semibold tracking-wide text-[#212529] transition-all hover:text-[#6258e8] font-outfit">
                          {course.COURSE_TITLE}
                        </span>
                      </button>
                    </td>
                    
                    <td className="text-center py-4 px-4 text-[#6c829e] font-medium text-[14px] font-outfit">
                      {course.COURSE_CATEGORY}
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="inline-block bg-[#eef7f3] text-[#4bae83]  px-4 py-1.5 rounded-lg text-nowrap text-sm font-medium font-outfit">
                        {getCompoundPeriod(course.START_DATE, course.END_DATE)}
                      </span>
                    </td>
                    {/* <td className="text-center py-4 px-4 text-[#6c829e] font-medium text-[14px] font-outfit">
                      {course?.TOTAL_LESSONS ?
                        `${course?.TOTAL_LESSONS} lessons` :
                        "No lesson" ??
                        "—"}
                    </td> */}
                    <td className="text-center py-4 px-4">
                      <span
                        className={clsx(
                          "inline-block  px-4 py-1.5 rounded-lg text-nowrap text-sm font-medium font-outfit",
                          getAvailabilityStatus(course) === "ended"
                            ? "text-red-400"
                            : "",
                        )}
                      >
                        {toStringDate(course.END_DATE)}
                      </span>
                    </td>
                    <td className="text-center py-4 px-2 md:px-6">
                      <div className="flex items-center justify-center gap-2">
                        {
                        getAvailabilityStatus(course) === "upcoming" && 
                        (
                          <button
                            onClick={() => handleEditCourse(course)}
                            disabled={
                              selectedCourse === course?.COURSE_ID &&
                              isLoadingCourseDetail
                            }
                            className="w-9 h-9 bg-[#edf1fb] rounded-lg flex items-center justify-center hover:bg-[#122a3e] hover:text-white transition-colors"
                          >
                            {selectedCourse === course?.COURSE_ID &&
                            isLoadingCourseDetail ? (
                              <StarLoader size={20} />
                            ) : (
                              <FaEdit className="w-4 h-4 " />
                            )}
                          </button>
                        )}

                        <button
                          className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-400 text-red-400 hover:text-white transition-colors border border-red-100"
                          onClick={() => handleDeleteCourse(course)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-sm text-slate-500"
                  >
                    No courses match your search and filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-6 pt-4">
          <p className="text-gray-400 text-sm font-outfit">
            Showing{" "}
            {filteredCourses.length ? (safePage - 1) * rowsPerPage + 1 : 0} to{" "}
            {Math.min(safePage * rowsPerPage, filteredCourses.length)} of{" "}
            {filteredCourses.length} courses
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#6c829e] font-medium text-[14px]"
                disabled={safePage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-colors font-outfit ${
                      safePage === page
                        ? "bg-[#003384] text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                className="w-8 h-8 flex items-center justify-center text-black hover:text-[#6c829e] font-medium text-[14px]"
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StaffCoursesTable;
