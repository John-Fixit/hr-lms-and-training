import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import PropTypes from "prop-types";
import { Button, Drawer, Input, Select } from "antd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  useCreateTrainingTemplate,
  useUpdateTrainingTemplate,
} from "../../../../API/trainingTemplates";
import {
  TRAINING_TEMPLATE_TOKENS,
  insertMergeToken,
  stripEmbedGuards,
} from "../../../../utils/trainingTemplateTokens";
import { successToast, errorToast } from "../../../../utils/toastMsgPop";

// Quill's default Tab handler inserts a literal "\t" character, which HTML
// collapses to a single space on render (both in the editor and in the
// merged letter). Non-breaking spaces don't collapse, so Tab is rebound to
// insert a run of them instead — giving a visible gap. List/blockquote
// indent-on-tab is untouched since that's handled by Quill's separate
// "indent"/"outdent" bindings, not this "tab" one.
const TAB_SPACER = "    ";

const quillModules = {
  toolbar: [
    ["bold", "italic", "underline", "strike"],
    [{ header: [1, 2, 3, false] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["clean"],
  ],
  keyboard: {
    bindings: {
      tab: {
        key: 9,
        handler(range) {
          this.quill.deleteText(range.index, range.length, "user");
          this.quill.insertText(range.index, TAB_SPACER, "user");
          this.quill.setSelection(range.index + TAB_SPACER.length, 0, "user");
          return false;
        },
      },
    },
  },
};

const defaultFormValues = { name: "", content: "" };

const FieldLabel = ({ children, required = false }) => (
  <p className="text-[#344054] text-xs mb-1 font-semibold font-helvetica">
    {children} {required && <span className="text-red-500">*</span>}
  </p>
);
FieldLabel.propTypes = {
  children: PropTypes.node,
  required: PropTypes.bool,
};

const TemplateFormDrawer = ({ isOpen, onClose, editingRecord }) => {
  const quillRef = useRef(null);
  const isEditing = Boolean(editingRecord);

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: editingRecord?.NAME ?? "",
        content: stripEmbedGuards(editingRecord?.CONTENT) ?? "",
      });
    }
  }, [isOpen, editingRecord, reset]);

  const { mutateAsync: createTemplate, isPending: isCreating } =
    useCreateTrainingTemplate();
  const { mutateAsync: updateTemplate, isPending: isUpdating } =
    useUpdateTrainingTemplate();

  const handleClose = () => {
    reset(defaultFormValues);
    onClose();
  };

  const onSubmit = async (formValues) => {
    if (!formValues?.name || !formValues?.content) return;

    try {
      const cleanContent = stripEmbedGuards(formValues.content);

      if (isEditing) {
        const bodyPayload = {
          template_id: editingRecord?.TEMPLATE_ID,
          template_name: formValues.name,
          template_content: cleanContent,
        };
        const res = await updateTemplate(bodyPayload);
        successToast(res?.message);
      } else {
        const bodyPayload = {
          template_name: formValues.name,
          template_content: cleanContent,
        };
        const res = await createTemplate(bodyPayload);
        successToast(res?.message);
      }
      handleClose();
    } catch (error) {
      errorToast(error?.response?.data?.message ?? error?.message);
    }
  };

  const handleInsertToken = (token) => {
    const tokenDef = TRAINING_TEMPLATE_TOKENS.find(
      (item) => item.token === token,
    );
    if (tokenDef) insertMergeToken(quillRef, tokenDef.token, tokenDef.label);
  };

  return (
    <Drawer
      title={
        <span className="font-helvetica">
          {isEditing ? "Edit Template" : "Create Template"}
        </span>
      }
      width={700}
      open={isOpen}
      onClose={handleClose}
      destroyOnClose
    >
      <form
        className="bg-white p-5 rounded border flex flex-col gap-4 font-helvetica"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div>
          <FieldLabel required>TEMPLATE NAME</FieldLabel>
          <Input
            placeholder="e.g. Standard Training Notification"
            size="large"
            value={watch("name")}
            {...register("name", { required: true })}
            onChange={(e) => setValue("name", e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <FieldLabel required>CONTENT</FieldLabel>
            <Select
              size="small"
              placeholder="Insert field"
              value={undefined}
              className="w-[190px]"
              options={TRAINING_TEMPLATE_TOKENS.map((item) => ({
                label: item.label,
                value: item.token,
              }))}
              onChange={handleInsertToken}
            />
          </div>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={watch("content")}
            onChange={(value) => setValue("content", value)}
            modules={quillModules}
            className="bg-white [&_.ql-editor]:min-h-[220px]"
          />
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button onClick={handleClose} size="large">
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            className="bg-[#00BCC2]"
            size="large"
            loading={isCreating || isUpdating}
          >
            {isEditing ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};

TemplateFormDrawer.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  editingRecord: PropTypes.object,
};

export default TemplateFormDrawer;
