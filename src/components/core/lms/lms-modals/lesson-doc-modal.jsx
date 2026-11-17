import { ConfigProvider, Modal } from "antd";
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useCourseStore } from "../../../../hooks/useCourseStore";
import { filePrefix } from "../../../../utils/filePrefix";
import { mediaKindFromPath } from "../../../../utils/fileExtension";
import { useUpdateCourseLesson } from "../../../../API/lms-apis/course";
import useCurrentUser from "../../../../hooks/useCurrentUser";

/** Public demo clip used when a lesson has no uploaded material. */
export const DEMO_LESSON_VIDEO = encodeURI(
  "/assets/images/Computer Basics_ What Is a Computer and How Does It Work_.mp4",
);

function hasLessonMaterial(path) {
  if (path == null) return false;
  const value = String(path).trim();
  return Boolean(value) && value.toLowerCase() !== "null" && value.toLowerCase() !== "undefined";
}

function prependBaseURL(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }
  return `${filePrefix}${path}`;
}

function videoType(src) {
  const lower = src.toLowerCase();
  if (lower.includes(".webm")) return "video/webm";
  if (lower.includes(".ogg") || lower.includes(".ogv")) return "video/ogg";
  if (lower.includes(".mov")) return "video/quicktime";
  return "video/mp4";
}

function PdfPreview({ src }) {
  return (
    <iframe
      src={src}
      className="h-[80vh] w-full rounded-md bg-slate-100"
      title="PDF preview"
    />
  );
}

PdfPreview.propTypes = { src: PropTypes.string };

function ImagePreview({ src, onError }) {
  return (
    <div className="flex max-h-[80vh] items-center justify-center bg-slate-950/90 p-2">
      <img
        src={src}
        alt="Lesson material"
        className="max-h-[78vh] max-w-full object-contain"
        onError={onError}
      />
    </div>
  );
}

ImagePreview.propTypes = { src: PropTypes.string, onError: PropTypes.func };

function VideoPreview({ src, onError }) {
  return (
    <video
      key={src}
      controls
      playsInline
      preload="metadata"
      className="max-h-[80vh] w-full rounded-md bg-black"
      onError={onError}
    >
      <source src={src} type={videoType(src)} />
      Your browser cannot play this video.{" "}
      <a href={src} target="_blank" rel="noreferrer">
        Open file
      </a>
    </video>
  );
}

VideoPreview.propTypes = { src: PropTypes.string, onError: PropTypes.func };

function OfficePreview({ src }) {
  return (
    <iframe
      src={`https://docs.google.com/gview?url=${encodeURIComponent(src)}&embedded=true`}
      className="h-[80vh] w-full rounded-md bg-slate-100"
      title="Document preview"
    />
  );
}

OfficePreview.propTypes = { src: PropTypes.string };

/** When the URL has no extension, try image then video, then offer a download. */
function UnknownPreview({ src }) {
  const [mode, setMode] = useState("image");

  if (mode === "image") {
    return (
      <img
        src={src}
        alt="Lesson material"
        className="mx-auto max-h-[78vh] max-w-full object-contain"
        onError={() => setMode("video")}
      />
    );
  }

  if (mode === "video") {
    return (
      <video
        key={src}
        controls
        playsInline
        preload="metadata"
        className="max-h-[80vh] w-full rounded-md bg-black"
        onError={() => setMode("pdf")}
      >
        <source src={src} />
      </video>
    );
  }

  if (mode === "pdf") {
    return (
      <iframe
        src={src}
        className="h-[80vh] w-full rounded-md bg-slate-100"
        title="Material preview"
        onError={() => setMode("file")}
      />
    );
  }

  return <VideoPreview src={DEMO_LESSON_VIDEO} />;
}

UnknownPreview.propTypes = { src: PropTypes.string };

const LessonDocModal = () => {
  const { data, updateData } = useCourseStore();
  const { userData } = useCurrentUser();
  const { mutateAsync: updateCourseLesson } = useUpdateCourseLesson();

  const { is_open_lesson_doc, filePath, lesson, fileKind } = data;
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [filePath, is_open_lesson_doc]);

  useEffect(() => {
    const updateLessonView = async () => {
      const payload = {
        update_type: "isviewed",
        json: {
          IS_VIEWED: true,
          DATE_VIEWED: new Date().toISOString(),
          LESSON_RECIPIENT_ID: lesson?.LESSON_RECIPIENT_ID,
          STAFF_ID: userData?.data?.STAFF_ID,
        },
      };
      try {
        await updateCourseLesson(payload);
      } catch {
        // viewing still works if the viewed flag fails
      }
    };
    if (is_open_lesson_doc && !lesson?.IS_VIEWED) {
      updateLessonView();
    }
  }, [is_open_lesson_doc, lesson, updateCourseLesson, userData?.data?.STAFF_ID]);

  const handleCloseModal = () => {
    updateData({
      is_open_lesson_doc: false,
    });
  };

  const usingFallback = !hasLessonMaterial(filePath) || loadFailed;
  const fullPath = usingFallback ? DEMO_LESSON_VIDEO : prependBaseURL(filePath);
  const uniqueUrl = useMemo(
    () => (fullPath ? `${fullPath}${fullPath.includes("?") ? "&" : "?"}t=${Date.now()}` : ""),
    [fullPath, is_open_lesson_doc],
  );

  const kind = usingFallback
    ? "video"
    : mediaKindFromPath(
        lesson?.FILE_NAME || lesson?.DOCUMENT_TYPE || filePath,
        fileKind,
      );

  const renderContent = () => {
    if (kind === "pdf") return <PdfPreview src={uniqueUrl} />;
    if (kind === "image") {
      return <ImagePreview src={fullPath} onError={() => setLoadFailed(true)} />;
    }
    if (kind === "video") {
      return (
        <VideoPreview
          src={fullPath}
          onError={usingFallback ? undefined : () => setLoadFailed(true)}
        />
      );
    }
    if (kind === "office") return <OfficePreview src={uniqueUrl} />;
    return <UnknownPreview src={fullPath} />;
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {},
        },
      }}
    >
      <Modal
        open={Boolean(is_open_lesson_doc)}
        onCancel={handleCloseModal}
        footer={null}
        width={kind === "pdf" || kind === "office" ? "90%" : 880}
        title={
          <span className="font-outfit text-base font-semibold text-slate-800">
            {lesson?.TITLE || "Lesson material"}
          </span>
        }
        destroyOnClose
        className="!top-[20px] !z-[1002]"
      >
        <div className="mt-2">{renderContent()}</div>
      </Modal>
    </ConfigProvider>
  );
};

export default LessonDocModal;
