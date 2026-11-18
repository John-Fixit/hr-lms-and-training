import { useState } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { Button, Dropdown, Modal, Segmented } from "antd";
import { ArrowRight, FolderPlus, MoreHorizontal, Plus, UserRound } from "lucide-react";
import {
  useDeleteProgramme,
  useGetProgrammes,
  useUpdateProgramme,
} from "../../../../API/trainingCatalogue";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { CARD_CLASS, accentFor } from "../shared/trainingTheme";
import { CourseStatusBadge } from "./CatalogueBadges";
import ProgrammeFormDrawer from "./ProgrammeFormDrawer";

export default function ProgrammesTab({ onViewCourses, onAddCourse }) {
  const { data: programmes = [], isPending } = useGetProgrammes();
  const { mutateAsync: updateProgramme } = useUpdateProgramme();
  const { mutateAsync: deleteProgramme } = useDeleteProgramme();
  const [modal, contextHolder] = Modal.useModal();
  const [status, setStatus] = useState("ACTIVE");
  const [drawer, setDrawer] = useState({ open: false, programme: null });

  const visible = programmes.filter((p) => status === "all" || p.STATUS === status);

  const runAction = (key, programme) => {
    const report = (promise, message) =>
      promise
        .then((res) => successToast(message ?? res?.message))
        .catch((err) => errorToast(err?.response?.data?.message ?? err?.message));

    if (key === "edit") setDrawer({ open: true, programme });
    if (key === "add") onAddCourse(programme.PROGRAMME_ID);
    if (key === "restore") {
      report(updateProgramme({ programme_id: programme.PROGRAMME_ID, status: "ACTIVE" }), "Programme restored.");
    }
    if (key === "archive") {
      modal.confirm({
        title: `Archive ${programme.PROGRAMME_NAME}?`,
        content:
          "New courses can't be added to an archived programme. Its existing courses stay as they are.",
        okText: "Archive",
        onOk: () =>
          report(updateProgramme({ programme_id: programme.PROGRAMME_ID, status: "ARCHIVED" }), "Programme archived."),
      });
    }
    if (key === "delete") {
      modal.confirm({
        title: `Delete ${programme.PROGRAMME_NAME}?`,
        content: "This permanently removes the programme.",
        okText: "Delete",
        okButtonProps: { danger: true },
        onOk: () => report(deleteProgramme({ programme_id: programme.PROGRAMME_ID })),
      });
    }
  };

  const menuFor = (programme) =>
    [
      { key: "edit", label: "Edit" },
      programme.STATUS === "ACTIVE" && { key: "add", label: "Add course" },
      programme.STATUS === "ACTIVE"
        ? { key: "archive", label: "Archive" }
        : { key: "restore", label: "Restore" },
      !programme.COURSE_COUNT && { type: "divider" },
      !programme.COURSE_COUNT && { key: "delete", label: "Delete", danger: true },
    ].filter(Boolean);

  return (
    <div className="space-y-4">
      {contextHolder}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "ARCHIVED", label: "Archived" },
            { value: "all", label: "All" },
          ]}
        />
        <Button type="primary" icon={<Plus size={15} />} onClick={() => setDrawer({ open: true, programme: null })}>
          New programme
        </Button>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-[220px] animate-pulse rounded-xl border border-[#e2e8f0] bg-white" />
          ))}
        </div>
      ) : !visible.length ? (
        <div className={`${CARD_CLASS} flex flex-col items-center gap-2 px-6 py-14 text-center`}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]">
            <FolderPlus size={22} />
          </span>
          <p className="text-sm font-semibold text-[#0f172a]">No {status === "ARCHIVED" ? "archived " : ""}programmes</p>
          <p className="max-w-sm text-xs text-[#64748b]">Programmes group related courses, like a leadership track.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((programme) => {
            const accent = accentFor(programme.PROGRAMME_ID);
            const archived = programme.STATUS === "ARCHIVED";
            return (
              <article
                key={programme.PROGRAMME_ID}
                className={clsx(
                  CARD_CLASS,
                  "relative flex flex-col overflow-hidden p-5 transition-all hover:shadow-md",
                  archived && "opacity-75",
                )}
              >
                <span
                  aria-hidden="true"
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.08]"
                  style={{ backgroundColor: accent }}
                />
                <div className="relative flex items-start justify-between gap-3">
                  <span className="h-2.5 w-10 rounded-full" style={{ backgroundColor: accent }} />
                  <div className="flex items-center gap-1">
                    {archived && <CourseStatusBadge status="ARCHIVED" />}
                    <Dropdown
                      trigger={["click"]}
                      menu={{ items: menuFor(programme), onClick: ({ key }) => runAction(key, programme) }}
                    >
                      <Button
                        type="text"
                        size="small"
                        aria-label={`Actions for ${programme.PROGRAMME_NAME}`}
                        icon={<MoreHorizontal size={16} />}
                      />
                    </Dropdown>
                  </div>
                </div>
                <h3 className="relative mt-3 text-base font-semibold leading-snug text-[#0f172a]">
                  {programme.PROGRAMME_NAME}
                </h3>
                <p className="relative mt-1 line-clamp-2 text-xs leading-relaxed text-[#64748b]">
                  {programme.DESCRIPTION || "No description yet."}
                </p>
                {programme.OWNER && (
                  <p className="relative mt-3 flex items-center gap-1.5 text-xs text-[#475569]">
                    <UserRound size={13} className="text-[#94a3b8]" /> {programme.OWNER}
                  </p>
                )}

                <dl className="relative mt-4 rounded-lg bg-[#F9FAFB] p-3 text-center">
                  <div className="flex flex-col-reverse">
                    <dt className="text-[10px] uppercase tracking-[0.08em] text-[#64748b]">Courses</dt>
                    <dd className="text-base font-bold tabular-nums text-[#0f172a]">{programme.COURSE_COUNT}</dd>
                  </div>
                </dl>

                <div className="relative mt-4 flex items-center justify-between gap-2 pt-1">
                  <Button
                    type="link"
                    className="!px-0"
                    onClick={() => onViewCourses(programme.PROGRAMME_ID)}
                    disabled={!programme.COURSE_COUNT}
                  >
                    View courses <ArrowRight size={14} className="inline" />
                  </Button>
                  {!archived && (
                    <Button size="small" icon={<Plus size={13} />} onClick={() => onAddCourse(programme.PROGRAMME_ID)}>
                      Add course
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ProgrammeFormDrawer
        open={drawer.open}
        programme={drawer.programme}
        onClose={() => setDrawer({ open: false, programme: null })}
      />
    </div>
  );
}

ProgrammesTab.propTypes = {
  onViewCourses: PropTypes.func.isRequired,
  onAddCourse: PropTypes.func.isRequired,
};
