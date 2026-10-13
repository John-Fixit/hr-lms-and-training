import PropTypes from "prop-types";
import { Drawer } from "antd";
import dayjs from "dayjs";
import "react-quill/dist/quill.snow.css";
import { stripEmbedGuards } from "../../../../utils/trainingTemplateTokens";

const TemplateViewDrawer = ({ isOpen, onClose, record }) => {
  return (
    <Drawer
      title={<span className="font-helvetica">{record?.NAME}</span>}
      width={700}
      open={isOpen}
      onClose={onClose}
      destroyOnClose
      className="font-helvetica"
    >
      <p className="text-xs text-[#667085] mb-4 font-helvetica">
        Last updated:{" "}
        {record?.UPDATED_AT
          ? dayjs(record.UPDATED_AT).format("DD MMMM YYYY, h:mm A")
          : "N/A"}
      </p>
      <div
        className="bg-white border border-[#EAECF0] rounded-lg ql-editor !overflow-visible !h-auto text-[#111]"
        dangerouslySetInnerHTML={{
          __html: stripEmbedGuards(record?.CONTENT) || "",
        }}
      />
    </Drawer>
  );
};

TemplateViewDrawer.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  record: PropTypes.object,
};

export default TemplateViewDrawer;
