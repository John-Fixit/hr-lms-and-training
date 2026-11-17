import { useCallback } from "react";
import { Modal } from "antd";
import {
  useDeleteCatalogueCourse,
  useDuplicateCourse,
  useSetCourseStatus,
} from "../../../../API/trainingCatalogue";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";

const report = async (promise) => {
  try {
    const res = await promise;
    successToast(res?.message);
    return res;
  } catch (err) {
    errorToast(err?.response?.data?.message ?? err?.message);
    return null;
  }
};

/**
 * Lifecycle actions for a catalogue course, shared by cards, the table and the detail drawer.
 * Render `contextHolder` once in the calling component.
 */
export default function useCourseActions({ onEdit, onDuplicated } = {}) {
  const [modal, contextHolder] = Modal.useModal();
  const { mutateAsync: setStatus } = useSetCourseStatus();
  const { mutateAsync: duplicate } = useDuplicateCourse();
  const { mutateAsync: remove } = useDeleteCatalogueCourse();

  const menuItems = useCallback((course) => {
    const items = [];
    if (course.STATUS !== "ARCHIVED") items.push({ key: "edit", label: "Edit" });
    if (course.STATUS === "DRAFT") items.push({ key: "publish", label: "Publish" });
    if (course.STATUS === "ARCHIVED") items.push({ key: "restore", label: "Restore" });
    items.push({ key: "duplicate", label: "Duplicate" });
    if (course.STATUS === "ACTIVE") items.push({ key: "archive", label: "Archive" });
    if (course.STATUS !== "ACTIVE") items.push({ type: "divider" }, { key: "delete", label: "Delete", danger: true });
    return items;
  }, []);

  const runAction = useCallback(
    (key, course) => {
      switch (key) {
        case "edit":
          onEdit?.(course);
          break;
        case "publish":
          if (course.SKILLS_INCLUDED && !course.SKILLS?.length) {
            modal.confirm({
              title: "Publish without skills?",
              content:
                "This course isn't linked to any skills yet, so it won't show up when HR looks for courses that close a skill gap.",
              okText: "Publish anyway",
              cancelText: "Add skills first",
              onOk: () => report(setStatus({ course_id: course.COURSE_ID, status: "ACTIVE" })),
              onCancel: () => onEdit?.(course),
            });
          } else {
            report(setStatus({ course_id: course.COURSE_ID, status: "ACTIVE" }));
          }
          break;
        case "restore":
          report(setStatus({ course_id: course.COURSE_ID, status: "ACTIVE" }));
          break;
        case "archive":
          modal.confirm({
            title: `Archive ${course.COURSE_TITLE}?`,
            content:
              "Archived courses can't be picked for new trainings. Past training records are kept, and you can restore it later.",
            okText: "Archive",
            onOk: () => report(setStatus({ course_id: course.COURSE_ID, status: "ARCHIVED" })),
          });
          break;
        case "duplicate":
          report(duplicate({ course_id: course.COURSE_ID })).then((res) => {
            if (res?.data?.COURSE_ID) onDuplicated?.(res.data.COURSE_ID);
          });
          break;
        case "delete":
          modal.confirm({
            title: `Delete ${course.COURSE_TITLE}?`,
            content: "This permanently removes the course from the catalogue.",
            okText: "Delete",
            okButtonProps: { danger: true },
            onOk: () => report(remove({ course_id: course.COURSE_ID })),
          });
          break;
        default:
          break;
      }
    },
    [modal, onEdit, onDuplicated, setStatus, duplicate, remove],
  );

  return { menuItems, runAction, contextHolder };
}
