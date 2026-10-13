import { useState } from "react";
import { Modal } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons";
import dayjs from "dayjs";
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
import ActionIcons from "../../../components/core/shared/ActionIcons";
import TemplateFormDrawer from "../../../components/core/training/templates/TemplateFormDrawer";
import TemplateViewDrawer from "../../../components/core/training/templates/TemplateViewDrawer";
import {
  useGetTrainingTemplates,
  useGetSingleTrainingTemplate,
  useDeleteTrainingTemplate,
} from "../../../API/trainingTemplates";
import { successToast, errorToast } from "../../../utils/toastMsgPop";

const TrainingTemplates = () => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);

  const { data: templates } = useGetTrainingTemplates();
  const { mutateAsync: getSingleTemplate } = useGetSingleTrainingTemplate();
  const { mutateAsync: deleteTemplate } = useDeleteTrainingTemplate();

  const templateRecords = Array.isArray(templates) ? templates : [];

  const fetchTemplateDetail = async (record) => {
    const template = await getSingleTemplate(record?.TEMPLATE_ID);
    return {
      TEMPLATE_ID: record?.TEMPLATE_ID,
      NAME: template?.TEMPLATE_NAME ?? record?.NAME,
      CONTENT: template?.TEMPLATE_CONTENT,
      UPDATED_AT: template?.DATE_CREATED ?? record?.CREATED_AT,
    };
  };

  const openCreateDrawer = () => {
    setEditingRecord(null);
    setFormDrawerOpen(true);
  };

  const openEditDrawer = async (record) => {
    try {
      setEditingRecord(await fetchTemplateDetail(record));
      setFormDrawerOpen(true);
    } catch (error) {
      errorToast(error?.response?.data?.message ?? error?.message);
    }
  };

  const openViewDrawer = async (record) => {
    try {
      setViewingRecord(await fetchTemplateDetail(record));
      setViewDrawerOpen(true);
    } catch (error) {
      errorToast(error?.response?.data?.message ?? error?.message);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Are you sure you want to delete this template?",
      icon: <ExclamationCircleFilled />,
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      async onOk() {
        try {
          const res = await deleteTemplate({ id: record?.TEMPLATE_ID });
          successToast(res?.message);
        } catch (error) {
          errorToast(error?.response?.data?.message ?? error?.message);
        }
      },
    });
  };

  const pages = Math.max(1, Math.ceil(templateRecords.length / rowsPerPage));
  const pagedRows = templateRecords.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  return (
    <main className="py-6 font-helvetica">
      <PageHeader
        header_text="Training Templates"
        breadCrumb_data={[
          { name: "HR" },
          { name: "Training" },
          { name: "Templates" },
        ]}
        buttonProp={[{ button_text: "Create Template", fn: openCreateDrawer }]}
      />

      <Separator separator_text="TEMPLATE LIST" />

      <section className="mt-6 bg-white rounded-xl border border-[#EAECF0] p-4 font-helvetica">
        <Table
          aria-label="Training templates table"
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
            <TableColumn>TEMPLATE NAME</TableColumn>
            <TableColumn>DATE CREATED</TableColumn>
            <TableColumn>ACTION</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent="No templates found."
            items={pagedRows}
          >
            {(record) => (
              <TableRow key={record.TEMPLATE_ID}>
                <TableCell>
                  <p className="font-helvetica opacity-70">
                    {(page - 1) * rowsPerPage + pagedRows.indexOf(record) + 1}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="font-helvetica opacity-70">
                    {record?.NAME || "N/A"}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="font-helvetica opacity-70">
                    {record?.CREATED_AT
                      ? dayjs(record.CREATED_AT).format("DD MMM YYYY, h:mm A")
                      : "N/A"}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ActionIcons
                      variant="VIEW"
                      action={() => openViewDrawer(record)}
                    />
                    <ActionIcons
                      variant="EDIT"
                      action={() => openEditDrawer(record)}
                    />
                    <ActionIcons
                      variant="DELETE"
                      action={() => handleDelete(record)}
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

      <TemplateFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingRecord(null);
        }}
        editingRecord={editingRecord}
      />

      <TemplateViewDrawer
        isOpen={viewDrawerOpen}
        onClose={() => {
          setViewDrawerOpen(false);
          setViewingRecord(null);
        }}
        record={viewingRecord}
      />
    </main>
  );
};

export default TrainingTemplates;
