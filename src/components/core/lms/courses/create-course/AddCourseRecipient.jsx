import { ConfigProvider, Radio, Select } from "antd";
import { Controller } from "react-hook-form";
import { useGetTemplateRecipient } from "../../../../../API/performance";
import useCurrentUser from "../../../../../hooks/useCurrentUser";
import { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Button } from "@nextui-org/react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useGetDesignation, useGetRegions } from "../../../../../API/officials";

const AddCourseRecipient = (props) => {
  const { control, watch, setValue, handlePrev, handleNext, isCreatingCourse } =
    props;

  const recipientTypes = [
    // { label: "Staffs", value: "staff" },
    { label: "Directorate", value: "directorate" },
    { label: "Department", value: "department" },
    // { label: "Region", value: "region" },
    { label: "Designation", value: "designation" },
  ];

  const { userData } = useCurrentUser();

  const recipientType = watch("recipientType");

  useEffect(() => {
    if (!recipientType) {
      setValue("recipientType", "directorate");
    }
  }, [recipientType, setValue]);

  const { data: get_recipients, isPending: isLoadingRecipient } =
    useGetTemplateRecipient({
      company_id: userData?.data?.COMPANY_ID,
      recipient_type: recipientType,
    });

  const { data: getRegion } = useGetRegions(userData?.data?.COMPANY_ID);

  const { data: getOrgDesignation } = useGetDesignation();
  const orgDesignation = useMemo(
    () =>
      getOrgDesignation?.data?.data?.map((item) => ({
        ...item,
        label: item?.DESIGNATION_NAME,
        value: item?.DESIGNATION_ID,
      })),
    [getOrgDesignation?.data?.data]
  );

  const regions = useMemo(
    () =>
      getRegion?.data?.data?.map((item) => ({
        ...item,
        value: item?.REGION_ID,
        label: item?.REGION_NAME,
      })),
    [getRegion]
  );

  const recipientOptions = useMemo(() => {
    return recipientType === "region"
      ? regions
      : recipientType === "designation"
      ? orgDesignation
      : get_recipients?.map((recipient) => ({
          label: recipient?.NAME,
          value: recipient?.ID,
        }));
  }, [get_recipients, orgDesignation, recipientType, regions]);

  const handlePublish = () => {
    //submit course here
    handleNext();
  };
  return (
    <>
      <main>
        <h2 className="font-outfit text-xl font-semibold text-blue-900">
          Recipient
        </h2>
        <p className="font-outfit text-gray-500">
          Add recipients below. You can add as many as needed.
        </p>
        <div className="mt-4 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send To <span className="text-red-500">*</span>
            </label>
            <Controller
              name="recipientType"
              control={control}
              rules={{ required: "Please select recipient type" }}
              render={({ field, fieldState }) => (
                <ConfigProvider
                  theme={{
                    token: {
                      colorPrimary: "#1e3a8a",
                    },
                  }}
                >
                  <Radio.Group {...field} className="w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {recipientTypes.map((type) => (
                        <div
                          key={type.value}
                          className={`border rounded-lg p-3 cursor-pointer transition-all ${
                            field.value === type.value
                              ? "border-blue-900 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <Radio value={type.value}>{type.label}</Radio>
                        </div>
                      ))}
                    </div>
                  </Radio.Group>
                  {fieldState.error && (
                    <span className="text-red-500 text-sm mt-1">
                      {fieldState.error.message}
                    </span>
                  )}
                </ConfigProvider>
              )}
            />
          </div>

          <div className="space-y-6">
            <div className="animate-fadeIn">
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                Select {recipientType} <span className="text-red-500">*</span>
              </label>
              <Controller
                name={"recipients"}
                control={control}
                rules={{
                  required: `Please select a ${recipientType}`,
                }}
                render={({ field, fieldState }) => (
                  <>
                    <Select
                      {...field}
                      options={recipientOptions}
                      loading={isLoadingRecipient}
                      placeholder="Choose directorate"
                      size="large"
                      className="w-full"
                      mode="multiple"
                      status={fieldState.error && "error"}
                    />
                    {fieldState.error && (
                      <span className="text-red-500 text-sm mt-1">
                        {fieldState.error.message}
                      </span>
                    )}
                  </>
                )}
              />
            </div>
          </div>
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
              onPress={handlePublish}
              isLoading={isCreatingCourse}
            >
              Publish <IoChevronForward />
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

AddCourseRecipient.propTypes = {
  control: PropTypes.any,
  watch: PropTypes.any,
  setValue: PropTypes.func,
  curriculumDefaultRows: PropTypes.any,
  handlePrev: PropTypes.func,
  handleNext: PropTypes.func,
  isCreatingCourse: PropTypes.bool,
};

export default AddCourseRecipient;
