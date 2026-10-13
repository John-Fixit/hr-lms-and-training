// Builds LMS course payloads from courses.json (same shape as
// create-course-drawer.jsx) and optionally POSTs them to /course/create.
// Every key is given a value; the script refuses to write/send a payload
// that still has an empty, null or placeholder value.
//
//   node scripts/lms-demo-courses/send-courses.mjs          -> write payloads/ only
//   node scripts/lms-demo-courses/send-courses.mjs --send   -> write + send
//
// Env: LMS_TOKEN, COMPANY_ID, CREATOR_STAFF_ID (required)
//      RECIPIENT_TYPE (staff|department|directorate|region|designation, default staff)
//      RECIPIENT_IDS  ("37,8", "[37,8]" or "37 8"; default CREATOR_STAFF_ID)
//      START_DATE / END_DATE (YYYY-MM-DD) override every course's start_date /
//      end_date; courses without dates default to today / today + 90 days
//      ATTACHMENT_URL (default document for lessons/quizzes without one)
//      LMS_API_URL (default https://lms-community.onrender.com/api)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const send = process.argv.includes("--send");

const env = process.env;
const API_URL = (env.LMS_API_URL || "https://lms-community.onrender.com/api").replace(/\/$/, "");
const COMPANY_ID = env.COMPANY_ID || "<COMPANY_ID>";
const CREATOR = env.CREATOR_STAFF_ID || "<CREATOR_STAFF_ID>";
const RECIPIENT_TYPE = "directorate" //env.RECIPIENT_TYPE || "staff";
const RECIPIENT_IDS = ["14"] //env.RECIPIENT_IDS
  // ? env.RECIPIENT_IDS.replace(/[[\]"']/g, "").split(/[\s,]+/).filter(Boolean)
  // : [CREATOR];
const ATTACHMENT_URL = env.ATTACHMENT_URL || "https://pdfobject.com/pdf/sample.pdf";

const ymd = (d) => d.toISOString().slice(0, 10);
const DEFAULT_START_DATE = ymd(new Date());
const DEFAULT_END_DATE = ymd(new Date(Date.now() + 90 * 864e5));

const QUIZ_CONFIG = {
  lesson: { attempts: 2, durationMins: 10, pointsPerQuestion: 10 },
  general: { attempts: 1, durationMins: 20, pointsPerQuestion: 10 },
};
const QUIZ_INSTRUCTION =
  "Answer all questions. Select one option per question and submit before the timer runs out.";

const thumbnail = (title) =>
  `https://placehold.co/800x450/1E293B/FFFFFF/png?font=montserrat&text=${encodeURIComponent(title)}`;

// courses.json lists the answer first; shuffle deterministically (seeded by
// the question text) so the correct option isn't always "A" and reruns match.
const shuffle = (items, seedText) => {
  let seed = [...seedText].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const formatQuestions = (questions) =>
  questions.map((q) => {
    if (!q.options.includes(q.answer)) {
      throw new Error(`Answer not in options: "${q.question}"`);
    }
    return {
      QUIZ_QUESTION: q.question,
      QUIZ_ANSWER: q.answer,
      QUIZ_OPTIONS: shuffle(q.options, q.question),
    };
  });

const quizFields = (questions, description, config, attachment) => ({
  QUIZ_TYPE: "manual",
  QUIZ_UPLOAD_FILE_URL: attachment || ATTACHMENT_URL,
  QUIZ_UPLOAD_INSTRUCTION: QUIZ_INSTRUCTION,
  QUIZ_DESCRIPTION: description,
  ATTEMPTS_ALLOWED: config.attempts,
  DURATION: config.durationMins,
  TOTAL_QUIZ_SCORE: questions.length * config.pointsPerQuestion,
});

// Courses without an explicit general_quiz get one built from all their
// lesson questions, so every course has a configured final assessment.
const generalQuizFor = (course) =>
  course.general_quiz || {
    description: `Final assessment for ${course.title}.`,
    questions: course.lessons.flatMap((lesson) => lesson.questions),
  };

const buildPayload = (course) => {
  const generalQuiz = generalQuizFor(course);

  return {
    COURSE_CATEGORY: course.category,
    COMPANY_ID,
    COURSE_TITLE: course.title,
    COURSE_OBJECTIVE: course.objective,
    COURSE_DESCRIPTION: course.description,
    USE_AS_APPRAISAL: true,
    START_DATE: env.START_DATE || course.start_date || DEFAULT_START_DATE,
    END_DATE: env.END_DATE || course.end_date || DEFAULT_END_DATE,
    CREATOR,
    PERFORMANCE_CYCLE_ID: 12,
    HAS_LINE_MANAGER: false,
    QUIZ_STRATEGY: "both",
    HAS_GENERAL_QUIZ: true,
    general_quiz: {
      ...quizFields(generalQuiz.questions, generalQuiz.description, QUIZ_CONFIG.general, generalQuiz.attachment),
      questions: formatQuestions(generalQuiz.questions),
    },
    COURSE_PREVIEW_IMAGE: course.thumbnail || thumbnail(course.title),
    course_lessons: course.lessons.map((lesson) => ({
      TITLE: lesson.title,
      DESCRIPTION: lesson.description,
      MEDIA_ATTACHMENT: lesson.attachment || ATTACHMENT_URL,
      HAS_QUIZ: true,
      ...quizFields(
        lesson.questions,
        `Check your understanding of "${lesson.title}".`,
        QUIZ_CONFIG.lesson,
        lesson.attachment,
      ),
      lesson_quiz: { questions: formatQuestions(lesson.questions) },
    })),
    course_recipients: { recipient_type: RECIPIENT_TYPE, STAFF_IDS: RECIPIENT_IDS },
  };
};

const findEmpty = (value, path = "") => {
  if (value === null || value === undefined || value === "") return [path];
  if (typeof value === "string" && /^<.*>$/.test(value)) return [`${path} (placeholder)`];
  if (Array.isArray(value)) {
    return value.length ? value.flatMap((v, i) => findEmpty(v, `${path}[${i}]`)) : [`${path} (empty list)`];
  }
  if (typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => findEmpty(v, path ? `${path}.${k}` : k));
  }
  return [];
};

const courses = JSON.parse(readFileSync(join(here, "courses.json"), "utf8"));
const payloads = courses.map(buildPayload);

const problems = payloads.flatMap((p) => findEmpty(p).map((key) => `${p.COURSE_TITLE}: ${key}`));
if (problems.length) {
  console.error(`Payloads still have empty values:\n  ${problems.join("\n  ")}`);
  console.error("Set LMS_TOKEN, COMPANY_ID and CREATOR_STAFF_ID (and RECIPIENT_IDS if needed).");
  process.exit(1);
}

const outDir = join(here, "payloads");
mkdirSync(outDir, { recursive: true });
payloads.forEach((p, i) => {
  const slug = p.COURSE_TITLE.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  writeFileSync(join(outDir, `${String(i + 1).padStart(2, "0")}-${slug}.json`), JSON.stringify(p, null, 2));
});
writeFileSync(join(outDir, "all-courses.json"), JSON.stringify(payloads, null, 2));
console.log(`Wrote ${payloads.length} payloads to ${outDir}`);

if (!send) {
  console.log("Dry run. Re-run with --send to create the courses.");
  process.exit(0);
}

if (!env.LMS_TOKEN) {
  console.error("Missing env: LMS_TOKEN");
  process.exit(1);
}

let failed = 0;
for (const payload of payloads) {
  try {
    const res = await fetch(`${API_URL}/course/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", token: env.LMS_TOKEN },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${body.slice(0, 500)}`);
    console.log(`✓ ${payload.COURSE_TITLE}`);
  } catch (err) {
    failed++;
    console.error(`✗ ${payload.COURSE_TITLE}: ${err.message}`);
  }
}
console.log(`Done: ${payloads.length - failed} created, ${failed} failed.`);
process.exit(failed ? 1 : 0);
