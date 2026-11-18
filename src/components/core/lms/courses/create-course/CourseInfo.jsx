import { DatePicker, Input, Select } from "antd";
import { Controller } from "react-hook-form";
import PropTypes from "prop-types";
import { Button } from "@nextui-org/react";
import { IoChevronForward } from "react-icons/io5";
import { MdChecklistRtl, MdOutlineLibraryBooks } from "react-icons/md";
import { PiSelectionPlusBold } from "react-icons/pi";
import useCurrentUser from "../../../../../hooks/useCurrentUser";
import { uploadFileData } from "../../../../../utils/uploadfile";
import dayjs from "dayjs";
import CourseSkillPicker from "../../../training/shared/CourseSkillPicker";

const CourseInfo = (props) => {
  const { control, watch, setValue, handleNext } = props;

  const { userData } = useCurrentUser();

  const handlePickThumbnail = async (file) => {
    const res = await uploadFileData(file, userData?.token);
    return {
      ...res,
    };
  };

  return (
    <>
      <main>
        <h2 className="font-outfit  text-xl font-semibold text-blue-900">
          Basic Information
        </h2>
        <p className="font-outfit text-gray-500">
          Fill basic information regarding your course.
        </p>
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="" className="font-outfit">
              Quiz Strategy
            </label>
            <Controller
              control={control}
              name="quiz_strategy"
              rules={{
                required: "Please choose quiz strategy",
              }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                    {[
                      {
                        value: "lesson",
                        label: "Quiz Per Lesson",
                        icon: <MdOutlineLibraryBooks className="w-5 h-5" />,
                      },
                      {
                        value: "general",
                        label: "General Quiz Only",
                        icon: <MdChecklistRtl className="w-5 h-5" />,
                      },
                      {
                        value: "both",
                        label: "Both Lesson + General",
                        icon: <PiSelectionPlusBold className="w-5 h-5" />,
                      },
                    ].map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        className={`border rounded-lg p-3 text-left transition-colors ${
                          field.value === option.value
                            ? "border-blue-900 bg-blue-50 text-blue-900"
                            : "border-gray-200 bg-white text-slate-700"
                        }`}
                        onClick={() => field.onChange(option.value)}
                      >
                        <span className="flex items-center gap-2 font-outfit text-sm font-medium">
                          {option.icon}
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  {!!error?.message && (
                    <span className="text-red-400 font-outfit text-sm px-1">
                      {error?.message}
                    </span>
                  )}
                </>
              )}
            />
          </div>
          <div>
            <label htmlFor="" className="font-outfit">
              Course Category
            </label>
            <Controller
              control={control}
              name="course_category"
              rules={{
                required: "Course Category is required",
              }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Select
                    options={[
                      { label: "Technical", value: "techinal" },
                      { label: "Soft skill", value: "soft skill" },
                      { label: "Other", value: "other" },
                    ]}
                    {...field}
                    size="large"
                    className="w-full"
                    placeholder="Select a category"
                  />
                  {!!error?.message && (
                    <span className="text-red-400 font-outfit text-sm px-1">
                      {error?.message}
                    </span>
                  )}
                </>
              )}
            />
          </div>
          {watch("course_category") === "other" && (
            <div>
              <Controller
                control={control}
                name="custom_category"
                rules={{
                  required: "Course category is required",
                }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Input
                      placeholder="Enter your category"
                      size="large"
                      {...field}
                    />
                    {!!error?.message && (
                      <span className="text-red-400 font-outfit text-sm px-1">
                        {error?.message}
                      </span>
                    )}
                  </>
                )}
              />
            </div>
          )}
          <div>
            <label htmlFor="" className="font-outfit">
              Course Title
            </label>
            <Controller
              control={control}
              name="course_title"
              rules={{
                required: "Course title is required",
              }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    placeholder="Enter course title"
                    size="large"
                    {...field}
                  />
                  {!!error?.message && (
                    <span className="text-red-400 font-outfit text-sm px-1">
                      {error?.message}
                    </span>
                  )}
                </>
              )}
            />
          </div>
          <div>
            <label htmlFor="" className="font-outfit">
              Course Description
            </label>
            <Controller
              control={control}
              name="course_description"
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input.TextArea
                    placeholder="Enter description"
                    size="large"
                    {...field}
                    // autoSize
                    // minRows={3}
                    rows={3}
                  />
                  {!!error?.message && (
                    <span className="text-red-400 font-outfit text-sm px-1">
                      {error?.message}
                    </span>
                  )}
                </>
              )}
            />
          </div>
          <div>
            <label htmlFor="" className="font-outfit">
              Course Objective
            </label>
            <Controller
              control={control}
              name="course_objective"
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input.TextArea
                    placeholder="Enter Objective"
                    size="large"
                    {...field}
                    // autoSize
                    rows={3}
                  />
                  {!!error?.message && (
                    <span className="text-red-400 font-outfit text-sm px-1">
                      {error?.message}
                    </span>
                  )}
                </>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="" className="font-outfit">
                Start Date
              </label>
              <Controller
                control={control}
                name="start_date"
                rules={{
                  required: "Start date is required",
                }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    {/* <DatePicker.RangePicker
                      className="w-full"
                      size="large"
                      {...field}
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(dateString) =>
                        // field.onChange(dateString)
                        console.log(dateString)
                      }
                      disabledDate={(current) =>
                        current < dayjs().startOf("day")
                      }
                    /> */}
                    <DatePicker
                      className="w-full"
                      size="large"
                      {...field}
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date, dateString) =>
                        field.onChange(dateString)
                      }
                      disabledDate={(current) =>
                        current < dayjs().startOf("day")
                      }
                    />
                    {!!error?.message && (
                      <span className="text-red-400 font-outfit text-sm px-1">
                        {error?.message}
                      </span>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label htmlFor="" className="font-outfit">
                End Date
              </label>
              <Controller
                control={control}
                name="end_date"
                rules={{
                  required: "End date is required",
                }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <DatePicker
                      className="w-full"
                      size="large"
                      {...field}
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date, dateString) =>
                        field.onChange(dateString)
                      }
                      disabledDate={(current) =>
                        watch("start_date")
                          ? current &&
                            current < dayjs(watch("start_date")).startOf("day")
                          : false
                      }
                    />
                    {!!error?.message && (
                      <span className="text-red-400 font-outfit text-sm px-1">
                        {error?.message}
                      </span>
                    )}
                  </>
                )}
              />
            </div>
          </div>
          <div>
            <label htmlFor="" className="font-outfit">
              Skills awarded
            </label>
            <p className="font-outfit text-gray-400 text-xs mb-1">
              Learners receive these skills when they complete the course.
            </p>
            <Controller
              control={control}
              name="skills"
              render={({ field }) => (
                <CourseSkillPicker
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div>
            <label htmlFor="" className="font-outfit">
              Course thumbnail
            </label>
            <label htmlFor="course_thumbnail_file" className="mt-1 block">
              <div className="flex min-w-0 overflow-hidden rounded-lg border border-gray-200">
                <p className="flex shrink-0 items-center bg-gray-100 px-3 py-3 font-outfit font-medium">
                  Choose File
                </p>
                <div className="flex min-w-0 flex-1 items-center px-3 py-2">
                  <span
                    className="block w-full truncate font-outfit text-sm text-slate-700"
                    title={
                      watch("course_thumbnail_file")?.name ||
                      watch("course_thumbnail_url") ||
                      "No file chosen"
                    }
                  >
                    {watch("course_thumbnail_file")?.name ||
                      (watch("course_thumbnail_url")
                        ? "Thumbnail uploaded"
                        : "No file chosen")}
                  </span>
                </div>
              </div>
              <input
                type="file"
                accept=".png,.jpg,.jpeg"
                className="hidden"
                id="course_thumbnail_file"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setValue(`course_thumbnail_file`, file);
                  const fileRes = await handlePickThumbnail(file);
                  setValue(`course_thumbnail_url`, fileRes.file_url);
                }}
              />
            </label>
          </div>
          <div className="flex justify-between flex-row-reverse gap-2 items-center border-gray-200 py-4 mt-6">
            <Button
              color="primary"
              className="mt-6 font-outfit"
              radius="sm"
              onPress={handleNext}
            >
              Next <IoChevronForward />
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

CourseInfo.propTypes = {
  control: PropTypes.any,
  watch: PropTypes.any,
  setValue: PropTypes.any,
  handleNext: PropTypes.func,
};

export default CourseInfo;
