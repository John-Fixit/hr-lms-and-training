export const fileExtension = (filePath) => {
  if (!filePath || typeof filePath !== "string") return "";
  const withoutQuery = filePath.split("?")[0].split("#")[0];
  const name = withoutQuery.substring(withoutQuery.lastIndexOf("/") + 1);
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase();
};

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif"];
const VIDEO_EXTS = ["mp4", "webm", "m4v", "mov", "ogg", "ogv"];
const OFFICE_EXTS = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"];

export const mediaKindFromPath = (filePath, hint) => {
  if (["image", "video", "pdf", "office"].includes(hint)) return hint;
  const ext = fileExtension(filePath);
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (ext === "pdf") return "pdf";
  if (OFFICE_EXTS.includes(ext)) return "office";
  return "unknown";
};
