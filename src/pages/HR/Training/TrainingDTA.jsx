import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PropTypes from "prop-types";
import { Button, Drawer, Input, Select } from "antd";
import {
  Pagination,
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
  useGetTrainingFees,
  useUpdateTrainingFees,
} from "../../../API/training";
import ActionIcons from "../../../components/core/shared/ActionIcons";
import { successToast, errorToast } from "../../../utils/toastMsgPop";

const defaultFormValues = {
  training_fees_id: "",
  grade_groups: "",
  training_type: "LOCAL",
  local_running_percent: "",
  dta: "",
  training_within_fees: "",
};

const initialDtaRecords = [];

const formatCurrency = (value, currency = "NGN") => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
  }).format(amount);
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

const TrainingDTA = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [dtaRecords, setDtaRecords] = useState(initialDtaRecords);
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      training_fees_id: editingRecord?.ID ?? "",
      grade_groups: editingRecord?.GRADE ?? "",
      training_type: editingRecord?.LOCATION ?? "LOCAL",
      local_running_percent: editingRecord?.LOCAL_RUNNINGS ?? "",
      dta: editingRecord?.NIG_DTA ?? "",
      training_within_fees: editingRecord?.WITHIN ?? "",
    },
  });

  const { data: trainingFees } = useGetTrainingFees();

  useEffect(() => {
    if (Array.isArray(trainingFees)) {
      setDtaRecords(trainingFees);
    }
  }, [trainingFees]);

  useEffect(() => {
    setPage(1);
  }, [dtaRecords.length]);

  // const openCreateDrawer = () => {
  //   setEditingRecord(null);
  //   reset(defaultFormValues);
  //   setIsDrawerOpen(true);
  // };

  const openEditDrawer = (record) => {
    const normalizedLocation = String(
      record?.LOCATION || "LOCAL",
    ).toUpperCase();
    setEditingRecord(record);
    reset({
      training_fees_id: record?.ID ?? "",
      grade_groups: record?.GRADE ?? "",
      training_type: normalizedLocation,
      local_running_percent: record?.LOCAL_RUNNINGS ?? "",
      dta: record?.NIG_DTA ?? "",
      training_within_fees: record?.WITHIN ?? "",
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingRecord(null);
    reset(defaultFormValues);
  };

  const { mutateAsync: updateTrainingFee, isPending: isUpdatingTrainingFee } =
    useUpdateTrainingFees();

  const onSubmit = async (formValues) => {
    const payload = {
      training_fees_id: editingRecord?.ID ?? "",
      grade_groups: formValues.grade_groups,
      training_type: formValues.training_type,
      local_running_percent: Number(formValues.local_running_percent || 0),
      dta: Number(formValues.dta || 0),
      training_within_fees: Number(formValues.training_within_fees || 0),
    };

    if (!payload?.training_fees_id) return;

    try {
      const res = await updateTrainingFee(payload);
      successToast(res?.data?.message);
    } catch (error) {
      errorToast(error?.response?.data?.message ?? error?.message);
    }
    // if (editingRecord) {
    //   setDtaRecords((prev) =>
    //     prev.map((item) =>
    //       item.ID === editingRecord.ID
    //         ? {
    //             ...item,
    //             ID: payload.training_fees_id || item.ID,
    //             GRADE: payload.grade_groups,
    //             TRAINING_TYPE: payload.training_type,
    //             LOCATION:
    //               payload.training_type === "FOREIGN" ? "Foreign" : "Local",
    //             LOCAL_RUNNINGS: payload.local_running_percent,
    //             NIG_DTA: payload.dta,
    //             WITHIN: payload.training_within_fees,
    //           }
    //         : item,
    //     ),
    //   );
    // } else {
    //   setDtaRecords((prev) => [
    //     {
    //       ID: Date.now(),
    //       ...payload,
    //     },
    //     ...prev,
    //   ]);
    // }

    // const res = await updateTrainingFee(payload);
    // closeDrawer();
  };

  const pages = Math.max(1, Math.ceil(dtaRecords.length / rowsPerPage));
  const pagedRows = dtaRecords.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  return (
    <main className="py-6 font-helvetica">
      <PageHeader
        header_text="Training DTA"
        breadCrumb_data={[
          { name: "HR" },
          { name: "Training" },
          { name: "DTA" },
        ]}
        // buttonProp={[{ button_text: "Create DTA", fn: openCreateDrawer }]}
      />

      <Separator separator_text="DTA LIST" />

      <section className="mt-6 bg-white rounded-xl border border-[#EAECF0] p-4 font-helvetica">
        <Table
          aria-label="Training DTA table"
          radius="sm"
          shadow="none"
          // removeWrapper
          classNames={{
            table: "min-w-full font-helvetica",
            th: "bg-[#F9FAFB] text-[#667085] text-xs uppercase font-semibold font-helvetica",
            td: "py-2 text-sm text-[#101828] !font-helvetica",
          }}
          isStriped={true}
        >
          <TableHeader>
            <TableColumn>S/N</TableColumn>
            <TableColumn>GRADE</TableColumn>
            <TableColumn>LOCATION</TableColumn>
            <TableColumn>LOCAL RUNNINGS(%)</TableColumn>
            <TableColumn>DTA</TableColumn>
            <TableColumn>FEES WITHIN STATE</TableColumn>
            <TableColumn>ACTION</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No DTA records found." items={pagedRows}>
            {(record) => (
              <TableRow key={record.ID}>
                <TableCell>
                  <p className="font-helvetica opacity-70">
                    {(page - 1) * rowsPerPage + pagedRows.indexOf(record) + 1}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="font-helvetica opacity-70">
                    {record?.GRADE || "N/A"}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="font-helvetica opacity-70">
                    {record?.LOCATION || "N/A"}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="font-helvetica opacity-70">
                    {record?.LOCAL_RUNNINGS ?? 0}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="font-helvetica opacity-70">
                    {formatCurrency(
                      record?.NIG_DTA,
                      record?.LOCATION === "Foreign" ? "USD" : "NGN",
                    )}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="font-helvetica opacity-70">
                    {formatCurrency(
                      record?.WITHIN,
                      record?.LOCATION === "Foreign" ? "USD" : "NGN",
                    )}
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
        title={<span className="font-helvetica">Edit DTA</span>}
        width={600}
        open={isDrawerOpen}
        onClose={closeDrawer}
        destroyOnClose
      >
        <form
          className="bg-white p-5 rounded border flex flex-col gap-4 font-helvetica"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <FieldLabel required>GRADE GROUPS</FieldLabel>
            <Input
              placeholder="Enter grade groups"
              size="large"
              value={watch("grade_groups")}
              {...register("grade_groups", { required: true })}
              onChange={(e) => {
                setValue("grade_groups", e.target.value);
              }}
            />
          </div>

          <div>
            <FieldLabel required>TRAINING TYPE</FieldLabel>
            <Select
              size="large"
              value={watch("training_type")}
              onChange={(value) => {
                setValue("training_type", value);
              }}
              {...register("training_type", { required: true })}
              options={[
                { label: "LOCAL", value: "LOCAL" },
                { label: "FOREIGN", value: "FOREIGN" },
              ]}
              placeholder="Select training type"
              virtual={false}
              className="w-full mt-1"
            />
          </div>

          <div>
            <FieldLabel required>LOCAL RUNNING PERCENT</FieldLabel>
            <Input
              size="large"
              type="number"
              min={0}
              placeholder="Enter local running percent"
              value={watch("local_running_percent")}
              {...register("local_running_percent", { required: true })}
              onChange={(e) => {
                setValue("local_running_percent", e.target.value);
              }}
            />
          </div>

          <div>
            <FieldLabel required>DTA</FieldLabel>
            <Input
              size="large"
              type="number"
              min={0}
              placeholder="Enter DTA amount"
              value={watch("dta")}
              {...register("dta", { required: true })}
              onChange={(e) => {
                setValue("dta", e.target.value);
              }}
            />
          </div>

          <div>
            <FieldLabel required>TRAINING WITHIN FEES</FieldLabel>
            <Input
              size="large"
              type="number"
              min={0}
              placeholder="Enter within-state fees"
              value={watch("training_within_fees")}
              {...register("training_within_fees", { required: true })}
              onChange={(e) => {
                setValue("training_within_fees", e.target.value);
              }}
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
              loading={isUpdatingTrainingFee}
            >
              Update DTA
            </Button>
          </div>
        </form>
      </Drawer>
    </main>
  );
};

export default TrainingDTA;
