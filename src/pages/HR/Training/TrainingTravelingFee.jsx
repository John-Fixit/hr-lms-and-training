import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PropTypes from "prop-types";
import { Button, Drawer, Input, Select } from "antd";
import {
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import PageHeader from "../../../components/payroll_components/PageHeader";
import Separator from "../../../components/payroll_components/Separator";
import {
  useAddTravelingFee,
  useGetTrainingTraveling,
  useUpdateTravelingFee,
} from "../../../API/training";
import ActionIcons from "../../../components/core/shared/ActionIcons";
import useCurrentUser from "../../../hooks/useCurrentUser";
import { errorToast, successToast } from "../../../utils/toastMsgPop";

const defaultFormValues = {
  training_fees_id: "",
  start: "",
  destination_names: [],
  training_type: "Nigeria",
  has_flight: "Yes",
  local: "",
  amount: "",
};

const initialDtaRecords = [];

const formatCurrency = (value, currency = "NGN") => {
  const amount = Number(value || 0);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
  }).format(amount);

  if (String(currency).toUpperCase() === "NGN") {
    return formatted.replace(/^NGN\s?/, "₦");
  }

  return formatted;
};

const getUniqueDestinations = (destinations) => {
  if (!Array.isArray(destinations) || destinations.length === 0) return [];
  const cleaned = destinations
    .map((item) =>
      String(item || "")
        .replace(/\n/g, "")
        .trim(),
    )
    .filter(Boolean);

  const seen = new Set();
  return cleaned.filter((destination) => {
    const key = destination.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizeDestinationsInput = (value) => {
  if (Array.isArray(value)) return getUniqueDestinations(value);
  if (value && typeof value === "object") {
    return getUniqueDestinations(Object.values(value));
  }
  if (typeof value === "string") return getUniqueDestinations(value.split(","));
  return [];
};

const normalizeTrainingType = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "foreign") return "Foreign";
  return "Nigeria";
};

const FieldLabel = ({ children, required = false }) => (
  <p className="text-[#344054] text-xs mb-1 font-semibold font-helvetica">
    {children} {required && <span className="text-red-500">*</span>}
  </p>
);
FieldLabel.propTypes = {
  children: PropTypes.node,
  required: PropTypes.bool,
};

const TrainingTravelingFee = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [dtaRecords, setDtaRecords] = useState(initialDtaRecords);
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;

  const { userData } = useCurrentUser();

  const { mutateAsync: addTravelingFee, isPending: isAddingTravelingFee } =
    useAddTravelingFee();
  const { mutateAsync: updateTravelingFee, isPending: isUpdatingTravelingFee } =
    useUpdateTravelingFee();

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      training_fees_id: editingRecord?.ID ?? "",
      start: editingRecord?.START ?? "",
      destination_names: normalizeDestinationsInput(
        editingRecord?.DESTINATION_NAME,
      ),
      training_type: editingRecord?.TRAINING_TYPE ?? "",
      has_flight: editingRecord?.HAS_FLIGHT ?? "",
      local: Number(editingRecord?.LOCAL) ?? "",
      amount: Number(editingRecord?.AMOUNT) ?? "",
    },
  });
  const { data: trainingFees } = useGetTrainingTraveling();

  useEffect(() => {
    if (Array.isArray(trainingFees)) {
      setDtaRecords(trainingFees);
    }
  }, [trainingFees]);

  useEffect(() => {
    setPage(1);
  }, [dtaRecords.length]);

  const openEditDrawer = (record) => {
    const normalizedType = normalizeTrainingType(
      record?.TRAINING_TYPE || record?.LOCATION,
    );
    setEditingRecord(record);
    const formPayload = {
      training_fees_id: record?.ID ?? "",
      start: record?.START ?? "",
      destination_names: normalizeDestinationsInput(record?.DESTINATION_NAME),
      training_type: normalizedType,
      has_flight: record?.HAS_FLIGHT || "Yes",
      local: record?.LOCAL ?? record?.LOCAL_RUNNINGS ?? "",
      amount: record?.AMOUNT ?? record?.NIG_DTA ?? record?.WITHIN ?? "",
    };

    reset(formPayload);
    Object.entries(formPayload).forEach(([field, value]) => {
      setValue(field, value, { shouldDirty: false, shouldValidate: false });
    });
    setIsDrawerOpen(true);
  };

  const openCreateTravelingFeeDrawer = () => {
    setEditingRecord(null);
    reset(defaultFormValues);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingRecord(null);
    reset(defaultFormValues);
  };

  const onSubmit = async (formValues) => {
    const destinations = normalizeDestinationsInput(
      formValues.destination_names,
    );

    const requestMethod = editingRecord?.ID
      ? updateTravelingFee
      : addTravelingFee;

    const payload = {
      pickup: formValues.start,
      destinations,
      local_transport: Number(formValues.local || 0),
      flight_amount: Number(formValues.amount || 0),
      travelling_type: normalizeTrainingType(formValues.training_type),
      staff_id: userData?.data?.STAFF_ID,
    };

    if (editingRecord?.ID) {
      payload["transport_id"] = editingRecord?.ID;
    }
    try {
      const res = await requestMethod(payload);
      successToast(res?.data?.message);
      closeDrawer();
    } catch (error) {
      errorToast(error?.response?.data?.message ?? error?.message);
    }
  };

  const pages = Math.max(1, Math.ceil(dtaRecords.length / rowsPerPage));
  const pagedRows = dtaRecords.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  return (
    <main className="py-6 font-helvetica">
      <PageHeader
        header_text="Training Traveling Fee"
        breadCrumb_data={[
          { name: "HR" },
          { name: "Training" },
          { name: "Traveling Fee" },
        ]}
        buttonProp={[
          {
            button_text: "Create Traveling Fee",
            fn: openCreateTravelingFeeDrawer,
            button_type: "button",
          },
        ]}
      />

      <Separator separator_text="TRAVELING FEE LIST" />

      <section className="mt-6 bg-white rounded-xl border border-[#EAECF0] p-4 font-helvetica">
        <Table
          aria-label="Training Traveling Fee table"
          radius="sm"
          shadow="none"
          classNames={{
            table: "min-w-full font-helvetica",
            th: "bg-[#F9FAFB] text-[#667085] text-xs uppercase font-semibold font-helvetica",
            td: "py-2 text-sm text-[#101828] !font-helvetica",
          }}
          isStriped={true}
        >
          <TableHeader>
            <TableColumn>S/N</TableColumn>
            <TableColumn>
              <div className="flex flex-col">
                <p className="font-helvetica text-[#101828] font-semibold">
                  START
                </p>
              </div>
            </TableColumn>
            <TableColumn>
              <div className="flex flex-col">
                <p className="font-helvetica text-[#101828] font-semibold">
                  DESTINATION
                </p>
              </div>
            </TableColumn>
            <TableColumn>TYPE</TableColumn>
            <TableColumn>FLIGHT</TableColumn>
            <TableColumn>LOCAL</TableColumn>
            <TableColumn>AMOUNT</TableColumn>
            <TableColumn>ACTION</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent="No Traveling Fee records found."
            items={pagedRows}
          >
            {(record) => (
              <TableRow
                key={record.ID}
                className="cursor-pointer"
                // onClick={() => openEditDrawer(record)}
              >
                <TableCell>
                  <p className="font-helvetica opacity-70">
                    {(page - 1) * rowsPerPage + pagedRows.indexOf(record) + 1}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <p className="font-helvetica text-[#101828] font-semibold opacity-70">
                      {record?.START || "N/A"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="">
                    {(() => {
                      const uniqueDestinations = getUniqueDestinations(
                        record?.DESTINATION_NAME,
                      );
                      if (!uniqueDestinations.length) {
                        return (
                          <p className="font-helvetica text-[#101828] opacity-70">
                            N/A
                          </p>
                        );
                      }

                      const visibleDestinations = uniqueDestinations.slice(
                        0,
                        3,
                      );
                      const hiddenDestinations = uniqueDestinations.slice(3);

                      return (
                        <p className="font-helvetica text-[#101828] opacity-70">
                          {visibleDestinations.join(", ")}
                          {!!hiddenDestinations.length && (
                            <>
                              {" "}
                              <Popover placement="bottom-start" showArrow>
                                <PopoverTrigger>
                                  <button
                                    type="button"
                                    className="text-[#00BCC2] underline underline-offset-2"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    +{hiddenDestinations.length} more
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent>
                                  <div
                                    className="py-2 px-1 max-w-[260px]"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <p className="text-xs text-[#344054] mb-1">
                                      Other destination(s)
                                    </p>
                                    <ul className="list-disc pl-4 space-y-1">
                                      {hiddenDestinations.map((destination) => (
                                        <li
                                          key={destination}
                                          className="text-xs text-[#475467]"
                                        >
                                          {destination}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </>
                          )}
                        </p>
                      );
                    })()}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-helvetica opacity-70 capitalize">
                    {record?.TRAINING_TYPE || record?.LOCATION || "N/A"}
                  </p>
                </TableCell>
                <TableCell>
                  <p
                    className={`font-helvetica text-xs font-semibold inline-flex items-center px-2 py-1 rounded-full opacity-70 ${
                      String(record?.HAS_FLIGHT || "")
                        .toLowerCase()
                        .includes("yes")
                        ? "bg-[#ECFDF3] text-[#027A48]"
                        : "bg-[#FEF3F2] text-[#B42318]"
                    }`}
                  >
                    {record?.HAS_FLIGHT || "N/A"}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="font-helvetica opacity-70">
                    {formatCurrency(record?.LOCAL ?? 0, "NGN")}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="font-helvetica text-[#101828] font-semibold opacity-70">
                    {formatCurrency(record?.AMOUNT, "NGN")}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ActionIcons
                      variant="EDIT"
                      action={() => openEditDrawer(record)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="mt-4 flex justify-end">
          <Pagination
            showControls
            page={page}
            total={pages}
            onChange={setPage}
            classNames={{
              cursor: "bg-[#00BCC2] text-white",
            }}
          />
        </div>
      </section>

      <Drawer
        title={<span className="font-helvetica">Edit Traveling Fee</span>}
        width={600}
        open={isDrawerOpen}
        onClose={closeDrawer}
        destroyOnClose
      >
        <form
          className="bg-white p-5 rounded-xl border flex flex-col gap-4 font-helvetica"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <FieldLabel required>START</FieldLabel>
            <Input
              placeholder="Enter take-off location (e.g. Lagos)"
              size="large"
              value={watch("start")}
              {...register("start", { required: true })}
              onChange={(e) => setValue("start", e.target.value)}
            />
          </div>

          <div>
            <FieldLabel required>DESTINATION(S)</FieldLabel>
            <Select
              mode="tags"
              size="large"
              value={watch("destination_names") || []}
              {...register("destination_names", { required: true })}
              onChange={(values) =>
                setValue(
                  "destination_names",
                  normalizeDestinationsInput(values),
                  {
                    shouldDirty: true,
                  },
                )
              }
              tokenSeparators={[" ", ",", "\n"]}
              open={false}
              placeholder="Type destination then press Space or Enter"
              className="w-full mt-1"
            />
          </div>

          <div>
            <FieldLabel required>TRAINING TYPE</FieldLabel>
            <Select
              size="large"
              options={[
                { label: "Nigeria", value: "Nigeria" },
                { label: "Foreign", value: "Foreign" },
              ]}
              placeholder="Select training type"
              virtual={false}
              className="w-full mt-1"
              value={watch("training_type")}
              {...register("training_type", { required: true })}
              onChange={(value) => setValue("training_type", value)}
            />
          </div>

          <div>
            <FieldLabel required>HAS FLIGHT</FieldLabel>
            <Select
              size="large"
              value={watch("has_flight")}
              {...register("has_flight", { required: true })}
              onChange={(value) => setValue("has_flight", value)}
              options={[
                { label: "Yes", value: "Yes" },
                { label: "No", value: "No" },
              ]}
              placeholder="Select flight option"
              virtual={false}
              className="w-full mt-1"
            />
          </div>

          <div>
            <FieldLabel required>LOCAL RUNNING</FieldLabel>
            <Input
              size="large"
              type="number"
              min={0}
              placeholder="Enter local running amount"
              value={watch("local")}
              {...register("local", { required: true })}
              onChange={(e) => setValue("local", e.target.value)}
            />
          </div>

          <div>
            <FieldLabel required>AMOUNT</FieldLabel>
            <Input
              size="large"
              type="number"
              min={0}
              placeholder="Enter total traveling amount"
              value={watch("amount")}
              {...register("amount", { required: true })}
              onChange={(e) => setValue("amount", e.target.value)}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button onClick={closeDrawer} size="large">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              className="bg-[#00BCC2]"
              size="large"
              loading={
                editingRecord?.ID
                  ? isUpdatingTravelingFee
                  : isAddingTravelingFee
              }
            >
              Update Traveling Fee
            </Button>
          </div>
        </form>
      </Drawer>
    </main>
  );
};

export default TrainingTravelingFee;
