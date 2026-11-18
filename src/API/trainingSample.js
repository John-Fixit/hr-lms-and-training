/**
 * Sample data helpers for training screens whose API fields or write endpoints
 * are not confirmed yet. Live reads stay live; missing collections/metrics are
 * filled from the existing mock seeds and tagged so the UI can label them.
 */

const SAMPLE_ID = /^(req|rt|crs|prg|sk|cat|tna|sub|need|ses|sid|prv|trn|ss|stk|par)-/i;

export function isSampleId(id) {
  if (id == null || id === "") return false;
  return SAMPLE_ID.test(String(id));
}

export function isSampleRecord(row) {
  return Boolean(row?.IS_SAMPLE) || isSampleId(
    row?.REQUEST_ID ?? row?.SESSION_ID ?? row?.COURSE_ID ?? row?.PROGRAMME_ID
    ?? row?.SKILL_ID ?? row?.PROVIDER_ID ?? row?.TRAINER_ID ?? row?.TNA_ID
    ?? row?.SUBMISSION_ID ?? row?.NEED_ID ?? row?.ROUTE_ID,
  );
}

export function hasSampleField(row, field) {
  return Boolean(row?.IS_SAMPLE) || (row?.SAMPLE_FIELDS ?? []).includes(field);
}

export function isMissing(value) {
  return value === undefined || value === null || value === ""
    || (Array.isArray(value) && value.length === 0);
}

export function tagSample(record) {
  if (!record || typeof record !== "object") return record;
  if (Array.isArray(record)) return record.map(tagSample);
  return { ...record, IS_SAMPLE: true };
}

export function fillUnconfirmed(live, sample) {
  if (sample == null) return live;
  if (live == null) return tagSample(sample);
  if (Array.isArray(live)) return live;
  if (typeof live !== "object" || typeof sample !== "object" || Array.isArray(sample)) return live;

  const SAMPLE_FIELDS = [...(live.SAMPLE_FIELDS ?? [])];
  const next = { ...live };
  Object.entries(sample).forEach(([key, value]) => {
    if (key === "SAMPLE_FIELDS" || key === "IS_SAMPLE") return;
    if (isMissing(next[key]) && !isMissing(value)) {
      next[key] = value;
      SAMPLE_FIELDS.push(key);
    }
  });
  if (SAMPLE_FIELDS.length) next.SAMPLE_FIELDS = SAMPLE_FIELDS;
  return next;
}

export function mergeSampleList(live = [], sample = [], getId) {
  const tagged = sample.map(tagSample);
  if (!live.length) return tagged;
  const ids = new Set(live.map((row) => String(getId(row))));
  return [...live, ...tagged.filter((row) => !ids.has(String(getId(row))))];
}

/** When the live list is too thin to exercise the UI, append sample records. */
export function sampleSparseList(live = [], sample = [], getId, min = 3) {
  if (live.length >= min) return live;
  return mergeSampleList(live, sample, getId);
}

export const SAMPLE_SKILL_GAPS = [
  {
    SKILL_ID: "sk-sms",
    SKILL_NAME: "Safety Management Systems (SMS)",
    CURRENT_LEVEL: 2,
    TARGET_LEVEL: 4,
    GAP: 2,
  },
  {
    SKILL_ID: "sk-report",
    SKILL_NAME: "Report & Memo Writing",
    CURRENT_LEVEL: 3,
    TARGET_LEVEL: 3,
    GAP: 0,
  },
];

export const SAMPLE_OPEN_SESSIONS = [
  {
    SESSION_ID: "ses-17",
    START_DATE: "2027-02-15",
    END_DATE: "2027-02-17",
    VENUE: "HQ Training Room A",
    SEATS_LEFT: 17,
    CAPACITY_MAX: 20,
  },
];

export const SAMPLE_COURSE_SKILLS = [
  { SKILL_ID: "sk-sms", SKILL_NAME: "Safety Management Systems (SMS)", TARGET_LEVEL: 3, IS_PRIMARY: 1 },
  { SKILL_ID: "sk-psr", SKILL_NAME: "Public Service Rules", TARGET_LEVEL: 2, IS_PRIMARY: 0 },
];

export const SAMPLE_SKILL_STATS = {
  STAFF_COUNT: 12,
  VERIFIED_COUNT: 8,
  AVERAGE_LEVEL: 3.2,
};
