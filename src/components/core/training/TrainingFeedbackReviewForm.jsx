import { Card, Form, Radio, Input } from "antd";
import PropTypes from "prop-types";

const { TextArea } = Input;

const RATING_5_OPTIONS = [
  { label: "Poor", value: 1 },
  { label: "Satisfactory", value: 2 },
  { label: "Good", value: 3 },
  { label: "Very Good", value: 4 },
  { label: "Excellent", value: 5 },
];

const EXTENT_OPTIONS = [
  { label: "Not at all", value: 1 },
  { label: "Some Extent", value: 2 },
  { label: "Great Extent", value: 3 },
  { label: "Fully", value: 4 },
];

const DURATION_OPTIONS = [
  { label: "Short", value: "short" },
  { label: "Long", value: "long" },
  { label: "Adequate", value: "adequate" },
];

const SCORE_FIELDS_5 = [
  "overallRating",
  "instructorPresentation",
  "instructorKnowledge",
  "instructorTrainingAids",
  "instructorInteraction",
];

const SCORE_FIELDS_4 = [
  "evalJobRelevance",
  "evalPracticalCoverage",
  "evalApplyLearning",
  "evalConformityNeed",
  "evalEnvironment",
];

export function calculateTrainingFeedbackScore(values = {}) {
  const total5 = SCORE_FIELDS_5.reduce(
    (acc, key) => acc + Number(values?.[key] || 0),
    0,
  );
  const total4 = SCORE_FIELDS_4.reduce(
    (acc, key) => acc + Number(values?.[key] || 0),
    0,
  );
  const totalScore = total5 + total4;
  const maxScore = SCORE_FIELDS_5.length * 5 + SCORE_FIELDS_4.length * 4;
  const percentage = maxScore
    ? Number(((totalScore / maxScore) * 100).toFixed(2))
    : 0;

  return {
    totalScore,
    maxScore,
    percentage,
  };
}

export function mapTrainingFeedbackAnswers(values = {}) {
  return {
    overall_rating: values?.overallRating ?? null,
    skill_before_course: values?.skillBefore ?? null,
    skill_after_course: values?.skillAfter ?? null,
    presentation: values?.instructorPresentation ?? null,
    knowledge_and_command: values?.instructorKnowledge ?? null,
    use_of_aids: values?.instructorTrainingAids ?? null,
    interaction: values?.instructorInteraction ?? null,
    job_relevance: values?.evalJobRelevance ?? null,
    practical_coverage: values?.evalPracticalCoverage ?? null,
    apply_learning: values?.evalApplyLearning ?? null,
    conformity_need: values?.evalConformityNeed ?? null,
    environment: values?.evalEnvironment ?? null,
    duration: values?.durationRating ?? null,
    duration_suggestion: values?.durationSuggestion?.trim() || "",
    comments: values?.feedbackComments?.trim() || "",
  };
}

function RadioQuestion({ name, label, options, requiredMessage }) {
  return (
    <Form.Item
      name={name}
      label={
        <span className="font-medium text-slate-800 text-[13px]">{label}</span>
      }
      rules={[{ required: true, message: requiredMessage }]}
      className="mb-3"
    >
      <Radio.Group
        optionType="button"
        buttonStyle="solid"
        className="flex flex-wrap gap-2"
      >
        {options.map((option) => (
          <Radio.Button
            key={`${name}_${option.value}`}
            value={option.value}
            className="!rounded-md !border !border-slate-300 !h-8 !leading-7 !text-[12px] !px-3"
          >
            {option.label}
          </Radio.Button>
        ))}
      </Radio.Group>
    </Form.Item>
  );
}

RadioQuestion.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  requiredMessage: PropTypes.string.isRequired,
};

export default function TrainingFeedbackReviewForm() {
  return (
    <Card
      title={
        <div>
          <p className="m-0 text-base font-semibold text-slate-900 tracking-tight">
            Training feedback questions
          </p>
          <p className="m-0 text-xs text-slate-500">
            Kindly answer all required fields before submission.
          </p>
        </div>
      }
      className="border border-slate-200 shadow-md rounded-2xl overflow-hidden"
      headStyle={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}
      bodyStyle={{ paddingTop: 12, background: "#fff" }}
    >
      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <RadioQuestion
            name="overallRating"
            label="1. Overall, how would you rate this course?"
            options={RATING_5_OPTIONS}
            requiredMessage="Please rate the course."
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-medium text-slate-800 mb-2 text-[13px]">
            2. Rate your knowledge and skill level
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item
              name="skillBefore"
              label="Before the course (1 - 10)"
              rules={[
                { required: true, message: "Please rate before-course skill." },
              ]}
              className="mb-1"
            >
              <Radio.Group className="grid grid-cols-5 md:grid-cols-10 gap-1.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <Radio.Button
                    key={`skillBefore_${i + 1}`}
                    value={i + 1}
                    className="!rounded-md !border-slate-300 !text-center !h-8 !leading-7 !px-0 !text-[12px]"
                  >
                    {i + 1}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Form.Item>
            <Form.Item
              name="skillAfter"
              label="After the course (1 - 10)"
              rules={[
                { required: true, message: "Please rate after-course skill." },
              ]}
              className="mb-1"
            >
              <Radio.Group className="grid grid-cols-5 md:grid-cols-10 gap-1.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <Radio.Button
                    key={`skillAfter_${i + 1}`}
                    value={i + 1}
                    className="!rounded-md !border !border-slate-300 !text-center !h-8 !leading-7 !px-0 !text-[12px]"
                  >
                    {i + 1}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Form.Item>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="font-medium text-slate-800 mb-2 text-[13px]">
            3. Rating of the instructor(s)
          </p>
          <RadioQuestion
            name="instructorPresentation"
            label="a) Presentation"
            options={RATING_5_OPTIONS}
            requiredMessage="Please rate presentation."
          />
          <RadioQuestion
            name="instructorKnowledge"
            label="b) Knowledge & command of subject"
            options={RATING_5_OPTIONS}
            requiredMessage="Please rate knowledge & command."
          />
          <RadioQuestion
            name="instructorTrainingAids"
            label="c) Use of training aids"
            options={RATING_5_OPTIONS}
            requiredMessage="Please rate use of training aids."
          />
          <RadioQuestion
            name="instructorInteraction"
            label="d) Open exchange of ideas, participation & group interaction"
            options={RATING_5_OPTIONS}
            requiredMessage="Please rate interaction."
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-medium text-slate-800 mb-2 text-[13px]">
            4. Evaluation of the Training/Workshop/Seminar
          </p>
          <RadioQuestion
            name="evalJobRelevance"
            label="a) Was the training relevant to your job profile?"
            options={EXTENT_OPTIONS}
            requiredMessage="Please answer job relevance."
          />
          <RadioQuestion
            name="evalPracticalCoverage"
            label="b) Practical coverage of the subject?"
            options={EXTENT_OPTIONS}
            requiredMessage="Please answer practical coverage."
          />
          <RadioQuestion
            name="evalApplyLearning"
            label="c) Will you be able to put what you learnt into practice?"
            options={EXTENT_OPTIONS}
            requiredMessage="Please answer apply learning."
          />
          <RadioQuestion
            name="evalConformityNeed"
            label="d) Training was in conformity with the training need identified?"
            options={EXTENT_OPTIONS}
            requiredMessage="Please answer conformity need."
          />
          <RadioQuestion
            name="evalEnvironment"
            label="e) Was the learning environment suitable?"
            options={EXTENT_OPTIONS}
            requiredMessage="Please answer environment suitability."
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <RadioQuestion
            name="durationRating"
            label="5(a). The duration of training programme?"
            options={DURATION_OPTIONS}
            requiredMessage="Please rate training duration."
          />

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) =>
              prev.durationRating !== cur.durationRating
            }
          >
            {({ getFieldValue }) => {
              const duration = getFieldValue("durationRating");
              return (
                <Form.Item
                  name="durationSuggestion"
                  label="5(b). If not adequate, please suggest"
                  rules={[
                    {
                      validator: async (_, value) => {
                        if (
                          duration &&
                          duration !== "adequate" &&
                          !value?.trim()
                        ) {
                          throw new Error("Please provide a suggestion.");
                        }
                      },
                    },
                  ]}
                  className="mb-0"
                >
                  <TextArea
                    rows={3}
                    placeholder="Type your suggestion here..."
                    className="!rounded-lg"
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <Form.Item
            name="feedbackComments"
            label="Comments (optional)"
            className="mb-0"
          >
            <TextArea
              rows={4}
              placeholder="Additional comments..."
              className="!rounded-lg"
            />
          </Form.Item>
        </section>
      </div>
    </Card>
  );
}
