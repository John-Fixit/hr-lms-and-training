/**
 * Drawer for submitting training review/feedback (completed trainings).
 * Certificate is uploaded separately; review is sent as JSON with file_url_id and file_url.
 */
import { useState, useCallback } from "react";
import { Drawer, Form, Button, Upload } from "antd";
import PropTypes from "prop-types";
import {
  useSubmitTrainingReview,
  useUploadCertificate,
} from "../../../API/training";
import { errorToast, successToast } from "../../../utils/toastMsgPop";
import useCurrentUser from "../../../hooks/useCurrentUser";
import TrainingFeedbackReviewForm, {
  calculateTrainingFeedbackScore,
  mapTrainingFeedbackAnswers,
} from "./TrainingFeedbackReviewForm";
import FormHeader from "../shared/FormHeader";
import { InboxOutlined } from "@ant-design/icons";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ACCEPTED_MIME = ["application/pdf", "image/jpeg", "image/png"];

function TrainingReviewDrawer({ open, onClose, training = null, onSuccess }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [uploadedCertificate, setUploadedCertificate] = useState(null);
  const { userData } = useCurrentUser();
  const { mutateAsync: submitReview } = useSubmitTrainingReview();
  const { mutateAsync: uploadCertificate, isPending: uploading } =
    useUploadCertificate();

  const trainingId = training?.TRAINING_ID ?? training?.id;
  const trainingTitle =
    training?.TRAINING_TITLE ?? training?.title ?? "Training";

  const handleCertificateRequest = useCallback(
    async ({ file, onSuccess: onReqSuccess, onError }) => {
      const okType = ACCEPTED_MIME.includes(file.type);
      if (!okType) {
        errorToast("Only PDF, JPG and PNG files are allowed.");
        onError(new Error("Invalid file type"));
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errorToast("Max file size is 2MB.");
        onError(new Error("File too large"));
        return;
      }
      try {
        const res = await uploadCertificate(file);
        if (res?.file_url_id != null && res?.file_url != null) {
          setUploadedCertificate({
            file_url_id: res.file_url_id,
            file_url: res.file_url,
            fileName: file.name,
          });
          onReqSuccess();
        } else {
          errorToast("Upload failed. Please try again.");
          onError(new Error("Upload failed"));
        }
      } catch (err) {
        errorToast(
          err?.response?.data?.message || err?.message || "Upload failed",
        );
        onError(err);
      }
    },
    [uploadCertificate],
  );

  console.log(uploadedCertificate?.file_url);

  const handleSubmit = useCallback(async () => {
    if (!trainingId) return;
    // if (!uploadedCertificate?.file_url_id) {
    //   errorToast("Please upload your certificate of participation.");
    //   return;
    // }
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const feedbackScore = calculateTrainingFeedbackScore(values);
      const json = {
        training_id: trainingId,
        staff_id: userData?.data?.STAFF_ID,
        ...mapTrainingFeedbackAnswers(values),
        total_score: feedbackScore?.percentage,
        file_url: uploadedCertificate?.file_url,
        note: values.feedbackComments?.trim() || "",
      };
      await submitReview(json);
      successToast("Thank you! Your review has been submitted.");
      form.resetFields();
      setUploadedCertificate(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err?.errorFields) return;
      errorToast(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to submit review",
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    trainingId,
    form,
    submitReview,
    onSuccess,
    onClose,
    userData?.data?.STAFF_ID,
  ]);

  const handleClose = useCallback(() => {
    form.resetFields();
    setUploadedCertificate(null);
    onClose();
  }, [form, onClose]);

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      width={920}
      className="training-review-drawer font-helvetica"
      classNames={{
        body: "bg-slate-100",
        header: "bg-white border-b border-gray-200",
      }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleClose}
            disabled={
              submitting
              // || uploading
            }
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            // disabled={uploading || !uploadedCertificate?.file_url_id}
            onClick={handleSubmit}
            className="bg-[#00BCC2] hover:!bg-[#00a0a5] border-none"
          >
            Submit review
          </Button>
        </div>
      }
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="mb-4">
          <FormHeader
            title="Course Completion Feedback"
            subtitle={trainingTitle}
          />
        </div>

        <Form form={form} layout="vertical" requiredMark={false}>
          <TrainingFeedbackReviewForm />
          <div className="mt-6">
            <Form.Item
              label="Upload Certificate of Participation"
              required
              help={
                uploadedCertificate ? null : (
                  <span className="text-slate-500">
                    Accepted formats: PDF, JPG, PNG • Max size: 2MB
                  </span>
                )
              }
            >
              <Upload.Dragger
                multiple={false}
                maxCount={1}
                accept=".pdf,.jpg,.jpeg,.png"
                fileList={
                  uploadedCertificate
                    ? [
                        {
                          uid: "-1",
                          name: uploadedCertificate.fileName,
                          status: "done",
                        },
                      ]
                    : []
                }
                customRequest={handleCertificateRequest}
                onRemove={() => setUploadedCertificate(null)}
                showUploadList={{ showRemoveIcon: true }}
                disabled={uploading}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  {uploading
                    ? "Uploading..."
                    : "Click or drag a file to upload"}
                </p>
                <p className="ant-upload-hint">
                  Accepted formats: PDF, JPG, PNG • Max size: 2MB
                </p>
              </Upload.Dragger>
            </Form.Item>
          </div>

          {uploadedCertificate && (
            <div className="text-xs text-slate-600 -mt-2 mb-3">
              Uploaded:{" "}
              <span className="font-medium">
                {uploadedCertificate.fileName}
              </span>
            </div>
          )}
        </Form>
      </div>
    </Drawer>
  );
}

TrainingReviewDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  training: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default TrainingReviewDrawer;
