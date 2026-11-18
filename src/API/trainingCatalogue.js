/**
 * Training Catalogue (programmes & courses) API hooks. Backend responses are
 * unwrapped in the shared training API client.
 */
import dayjs from "dayjs";
import { mockApiError, mockId } from "./mock/mockStore";
import { catalogueStore, providerName } from "./mock/stores";
import {
  getTrainingIdentity,
  splitCommaList,
  splitNewlineList,
  toNumber,
  useTrainingMutation,
  useTrainingQuery,
} from "./trainingApi";
import {
  SAMPLE_COURSE_SKILLS,
  fillUnconfirmed,
  isSampleId,
  sampleSparseList,
  tagSample,
} from "./trainingSample";

const QUERY_ROOT = "training_catalogue";

const today = () => dayjs().format("YYYY-MM-DD");
const sameText = (a = "", b = "") => a.trim().toLowerCase() === b.trim().toLowerCase();

function normalizeProgramme(programme) {
  return {
    ...programme,
    PROGRAMME_ID: programme.PROGRAMME_ID,
    COURSE_COUNT: toNumber(programme.COURSE_COUNT),
    ACTIVE_COURSE_COUNT: programme.ACTIVE_COURSE_COUNT == null
      ? null
      : toNumber(programme.ACTIVE_COURSE_COUNT),
    SESSIONS_RUN: programme.SESSIONS_RUN == null ? null : toNumber(programme.SESSIONS_RUN),
    STAFF_TRAINED: programme.STAFF_TRAINED == null ? null : toNumber(programme.STAFF_TRAINED),
  };
}

function normalizeCourse(course) {
  const hasSkills = Array.isArray(course.SKILLS);
  return {
    ...course,
    COURSE_ID: course.COURSE_ID,
    PROGRAMME_ID: course.PROGRAMME_ID ?? null,
    DURATION_DAYS: toNumber(course.DURATION_DAYS),
    DEFAULT_COST: toNumber(course.DEFAULT_COST),
    IS_MANDATORY: Boolean(toNumber(course.IS_MANDATORY)),
    TARGET_GRADES: splitCommaList(course.TARGET_GRADES),
    LEARNING_OUTCOMES: splitNewlineList(course.LEARNING_OUTCOMES),
    SKILLS: hasSkills ? course.SKILLS : [],
    SKILLS_INCLUDED: hasSkills,
    PREREQUISITE_IDS: Array.isArray(course.PREREQUISITE_IDS) ? course.PREREQUISITE_IDS : [],
    PREREQUISITES: Array.isArray(course.PREREQUISITES) ? course.PREREQUISITES : [],
    REQUIRED_FOR: Array.isArray(course.REQUIRED_FOR) ? course.REQUIRED_FOR : [],
    SESSIONS_RUN: course.SESSIONS_RUN == null ? null : toNumber(course.SESSIONS_RUN),
    STAFF_TRAINED: course.STAFF_TRAINED == null ? null : toNumber(course.STAFF_TRAINED),
  };
}

function mapCoursePayload(payload) {
  return {
    ...payload,
    skill_ids: payload.skill_ids ?? payload.skills?.map((skill) => skill.skill_id),
    prerequisite_course_ids: payload.prerequisite_course_ids ?? payload.prerequisite_ids,
    learning_outcomes: Array.isArray(payload.learning_outcomes) ? payload.learning_outcomes.join("\n") : payload.learning_outcomes,
    target_grades: Array.isArray(payload.target_grades) ? payload.target_grades.join(",") : payload.target_grades,
  };
}

/** Turns the form payload (snake_case) into a stored course record. */
function courseFieldsFromPayload(payload) {
  return {
    COURSE_TITLE: payload.course_title.trim(),
    COURSE_CODE: payload.course_code.trim().toUpperCase(),
    PROGRAMME_ID: payload.programme_id,
    TRAINING_TYPE: payload.training_type,
    DELIVERY_METHOD: payload.delivery_method,
    LOCATION: payload.location ?? "LOCAL",
    DURATION_DAYS: Number(payload.duration_days),
    IS_MANDATORY: payload.is_mandatory ? 1 : 0,
    DESCRIPTION: payload.description?.trim() ?? "",
    OBJECTIVES: payload.objectives?.trim() ?? "",
    LEARNING_OUTCOMES: (payload.learning_outcomes ?? []).map((o) => o?.trim()).filter(Boolean),
    TARGET_AUDIENCE: payload.target_audience?.trim() ?? "",
    TARGET_GRADES: payload.target_grades ?? [],
    PREREQUISITE_IDS: payload.prerequisite_ids ?? [],
    SKILLS: (payload.skills ?? [])
      .filter((s) => s?.skill_id)
      .map((s) => ({
        SKILL_ID: s.skill_id,
        TARGET_LEVEL: Number(s.target_level),
        IS_PRIMARY: s.is_primary ? 1 : 0,
      })),
    DEFAULT_PROVIDER_ID: payload.default_provider_id ?? null,
    DEFAULT_COST: Number(payload.default_cost ?? 0),
    LMS_COURSE_ID: payload.lms_course_id ?? null,
    STATUS: payload.status ?? "DRAFT",
    UPDATED_AT: today(),
  };
}

function assertUniqueCourse(store, fields, ignoreId) {
  const others = store.courses.filter((c) => c.COURSE_ID !== ignoreId);
  if (others.some((c) => sameText(c.COURSE_CODE, fields.COURSE_CODE))) {
    throw mockApiError(`Course code ${fields.COURSE_CODE} is already used.`);
  }
  if (
    others.some(
      (c) => c.PROGRAMME_ID === fields.PROGRAMME_ID && sameText(c.COURSE_TITLE, fields.COURSE_TITLE),
    )
  ) {
    throw mockApiError(`"${fields.COURSE_TITLE}" already exists in this programme.`);
  }
}

const mockServer = {
  overview() {
    const store = catalogueStore.get();
    const active = store.courses.filter((c) => c.STATUS === "ACTIVE");
    return {
      ACTIVE_PROGRAMMES: store.programmes.filter((p) => p.STATUS === "ACTIVE").length,
      TOTAL_COURSES: store.courses.length,
      ACTIVE_COURSES: active.length,
      DRAFT_COURSES: store.courses.filter((c) => c.STATUS === "DRAFT").length,
      MANDATORY_COURSES: active.filter((c) => c.IS_MANDATORY).length,
      SKILLS_COVERED: new Set(active.flatMap((c) => c.SKILLS.map((s) => s.SKILL_ID))).size,
      COURSES_WITHOUT_SKILLS: store.courses.filter((c) => c.STATUS !== "ARCHIVED" && !c.SKILLS.length).length,
      STAFF_TRAINED: store.courses.reduce((sum, c) => sum + c.STAFF_TRAINED, 0),
    };
  },

  programmes() {
    const store = catalogueStore.get();
    return store.programmes
      .map((p) => {
        const courses = store.courses.filter((c) => c.PROGRAMME_ID === p.PROGRAMME_ID);
        return {
          ...p,
          COURSE_COUNT: courses.length,
          ACTIVE_COURSE_COUNT: courses.filter((c) => c.STATUS === "ACTIVE").length,
          SESSIONS_RUN: courses.reduce((sum, c) => sum + c.SESSIONS_RUN, 0),
          STAFF_TRAINED: courses.reduce((sum, c) => sum + c.STAFF_TRAINED, 0),
        };
      })
      .sort((a, b) => (a.STATUS === b.STATUS ? a.PROGRAMME_NAME.localeCompare(b.PROGRAMME_NAME) : a.STATUS === "ACTIVE" ? -1 : 1));
  },

  courses() {
    const store = catalogueStore.get();
    return store.courses
      .map((c) => ({
        ...c,
        PROGRAMME_NAME:
          store.programmes.find((p) => p.PROGRAMME_ID === c.PROGRAMME_ID)?.PROGRAMME_NAME ?? "—",
        DEFAULT_PROVIDER_NAME: providerName(c.DEFAULT_PROVIDER_ID),
      }))
      .sort((a, b) => a.COURSE_CODE.localeCompare(b.COURSE_CODE));
  },

  course(courseId) {
    const store = catalogueStore.get();
    const found = store.courses.find((c) => c.COURSE_ID === courseId);
    if (!found) throw mockApiError("Course not found.");
    const brief = (c) => ({ COURSE_ID: c.COURSE_ID, COURSE_CODE: c.COURSE_CODE, COURSE_TITLE: c.COURSE_TITLE, STATUS: c.STATUS });
    return {
      ...found,
      PROGRAMME_NAME:
        store.programmes.find((p) => p.PROGRAMME_ID === found.PROGRAMME_ID)?.PROGRAMME_NAME ?? "—",
      DEFAULT_PROVIDER_NAME: providerName(found.DEFAULT_PROVIDER_ID),
      PREREQUISITES: store.courses.filter((c) => found.PREREQUISITE_IDS.includes(c.COURSE_ID)).map(brief),
      REQUIRED_FOR: store.courses.filter((c) => c.PREREQUISITE_IDS.includes(found.COURSE_ID)).map(brief),
    };
  },

  createProgramme(payload) {
    const store = catalogueStore.get();
    const name = payload?.programme_name?.trim();
    if (!name) throw mockApiError("Programme name is required.");
    if (store.programmes.some((p) => sameText(p.PROGRAMME_NAME, name))) {
      throw mockApiError(`"${name}" already exists.`);
    }
    store.programmes.push({
      PROGRAMME_ID: mockId("prg"),
      PROGRAMME_NAME: name,
      DESCRIPTION: payload.description?.trim() ?? "",
      OWNER: payload.owner?.trim() ?? "",
      STATUS: payload.status ?? "ACTIVE",
      CREATED_AT: today(),
    });
    catalogueStore.save();
    return { message: "Programme created." };
  },

  updateProgramme(payload) {
    const store = catalogueStore.get();
    const target = store.programmes.find((p) => p.PROGRAMME_ID === payload?.programme_id);
    if (!target) throw mockApiError("Programme not found.");
    const name = payload.programme_name?.trim() ?? target.PROGRAMME_NAME;
    if (store.programmes.some((p) => p.PROGRAMME_ID !== target.PROGRAMME_ID && sameText(p.PROGRAMME_NAME, name))) {
      throw mockApiError(`"${name}" already exists.`);
    }
    Object.assign(target, {
      PROGRAMME_NAME: name,
      DESCRIPTION: payload.description ?? target.DESCRIPTION,
      OWNER: payload.owner ?? target.OWNER,
      STATUS: payload.status ?? target.STATUS,
    });
    catalogueStore.save();
    return { message: "Programme updated." };
  },

  deleteProgramme(payload) {
    const store = catalogueStore.get();
    if (store.courses.some((c) => c.PROGRAMME_ID === payload?.programme_id)) {
      throw mockApiError("This programme still has courses. Move or delete them first, or archive the programme.");
    }
    store.programmes = store.programmes.filter((p) => p.PROGRAMME_ID !== payload?.programme_id);
    catalogueStore.save();
    return { message: "Programme deleted." };
  },

  createCourse(payload) {
    const store = catalogueStore.get();
    const fields = courseFieldsFromPayload(payload);
    assertUniqueCourse(store, fields);
    store.courses.push({ COURSE_ID: mockId("crs"), SESSIONS_RUN: 0, STAFF_TRAINED: 0, ...fields });
    catalogueStore.save();
    return { message: fields.STATUS === "ACTIVE" ? "Course published to the catalogue." : "Course saved as draft." };
  },

  updateCourse(payload) {
    const store = catalogueStore.get();
    const target = store.courses.find((c) => c.COURSE_ID === payload?.course_id);
    if (!target) throw mockApiError("Course not found.");
    const fields = courseFieldsFromPayload(payload);
    if (fields.PREREQUISITE_IDS.includes(target.COURSE_ID)) {
      throw mockApiError("A course can't be its own prerequisite.");
    }
    assertUniqueCourse(store, fields, target.COURSE_ID);
    Object.assign(target, fields);
    catalogueStore.save();
    return { message: "Course updated." };
  },

  setCourseStatus(payload) {
    const store = catalogueStore.get();
    const target = store.courses.find((c) => c.COURSE_ID === payload?.course_id);
    if (!target) throw mockApiError("Course not found.");
    target.STATUS = payload.status;
    target.UPDATED_AT = today();
    catalogueStore.save();
    const verb = { ACTIVE: "published", ARCHIVED: "archived", DRAFT: "moved to draft" }[payload.status];
    return { message: `${target.COURSE_TITLE} ${verb}.` };
  },

  duplicateCourse(payload) {
    const store = catalogueStore.get();
    const source = store.courses.find((c) => c.COURSE_ID === payload?.course_id);
    if (!source) throw mockApiError("Course not found.");
    let code = `${source.COURSE_CODE}-COPY`;
    let n = 2;
    while (store.courses.some((c) => c.COURSE_CODE === code)) {
      code = `${source.COURSE_CODE}-COPY${n}`;
      n += 1;
    }
    const copy = {
      ...source,
      SKILLS: source.SKILLS.map((s) => ({ ...s })),
      COURSE_ID: mockId("crs"),
      COURSE_CODE: code,
      COURSE_TITLE: `${source.COURSE_TITLE} (copy)`,
      STATUS: "DRAFT",
      SESSIONS_RUN: 0,
      STAFF_TRAINED: 0,
      UPDATED_AT: today(),
    };
    store.courses.push(copy);
    catalogueStore.save();
    return { message: `Draft copy created as ${code}.`, data: { COURSE_ID: copy.COURSE_ID } };
  },

  deleteCourse(payload) {
    const store = catalogueStore.get();
    const target = store.courses.find((c) => c.COURSE_ID === payload?.course_id);
    if (!target) throw mockApiError("Course not found.");
    if (target.SESSIONS_RUN > 0) {
      throw mockApiError("This course has training history. Archive it instead so records are kept.");
    }
    if (store.courses.some((c) => c.PREREQUISITE_IDS.includes(target.COURSE_ID))) {
      throw mockApiError("Other courses list this as a prerequisite. Remove it from them first.");
    }
    store.courses = store.courses.filter((c) => c.COURSE_ID !== target.COURSE_ID);
    catalogueStore.save();
    return { message: "Course deleted." };
  },
};

const MOCK_MUTATIONS = {
  "catalogue/create_programme": (payload) => mockServer.createProgramme(payload),
  "catalogue/update_programme": (payload) => mockServer.updateProgramme(payload),
  "catalogue/delete_programme": (payload) => mockServer.deleteProgramme(payload),
  "catalogue/create_course": (payload) => mockServer.createCourse(payload),
  "catalogue/update_course": (payload) => mockServer.updateCourse(payload),
  "catalogue/set_course_status": (payload) => mockServer.setCourseStatus(payload),
  "catalogue/duplicate_course": (payload) => mockServer.duplicateCourse(payload),
  "catalogue/delete_course": (payload) => mockServer.deleteCourse(payload),
};

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** Proposed: POST training/catalogue/overview */
export const useGetCatalogueOverview = () =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "overview"],
    endpoint: "catalogue/overview",
    transform: (data) => fillUnconfirmed({
      ...data,
      TOTAL_PROGRAMMES: toNumber(data?.PROGRAMMES),
      ACTIVE_COURSES: toNumber(data?.ACTIVE_COURSES),
      DRAFT_COURSES: toNumber(data?.DRAFT_COURSES),
      ARCHIVED_COURSES: toNumber(data?.ARCHIVED_COURSES),
      MANDATORY_COURSES: toNumber(data?.MANDATORY_COURSES),
    }, mockServer.overview()),
  });

/** Proposed: POST training/catalogue/programmes */
export const useGetProgrammes = () =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "programmes"],
    endpoint: "catalogue/programmes",
    list: true,
    transform: (programmes) => sampleSparseList(
      programmes.map(normalizeProgramme),
      mockServer.programmes(),
      (row) => row.PROGRAMME_ID,
    ),
  });

/** Proposed: POST training/catalogue/courses — filters can move server-side as the catalogue grows. */
export const useGetCatalogueCourses = () =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "courses"],
    endpoint: "catalogue/courses",
    list: true,
    transform: (courses) => sampleSparseList(
      courses.map(normalizeCourse),
      mockServer.courses(),
      (row) => row.COURSE_ID,
    ),
  });

/** Proposed: GET training/catalogue/course/:course_id */
export const useGetCatalogueCourse = (courseId) =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "course", courseId],
    endpoint: `catalogue/course/${courseId}`,
    method: "GET",
    enabled: Boolean(courseId),
    mockWhen: () => isSampleId(courseId),
    mockHandler: () => tagSample(mockServer.course(courseId)),
    transform: (course) => fillUnconfirmed(normalizeCourse(course), {
      SKILLS: SAMPLE_COURSE_SKILLS,
      SKILLS_INCLUDED: true,
      SESSIONS_RUN: 3,
      STAFF_TRAINED: 42,
    }),
  });

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

const useCatalogueMutation = (endpoint, mapPayload) =>
  useTrainingMutation({
    endpoint,
    mapPayload,
    invalidate: [[QUERY_ROOT]],
    mockHandler: MOCK_MUTATIONS[endpoint],
  });

/** Proposed: POST training/catalogue/create_programme — { company_id, programme_name, description, owner, status } */
export const useCreateProgramme = () =>
  useCatalogueMutation("catalogue/create_programme", (payload) => ({
    ...payload,
    owner_staff_id: payload.owner_staff_id ?? payload.owner,
    created_by: payload.created_by ?? getTrainingIdentity().staff_id,
  }));
/** Proposed: POST training/catalogue/update_programme — { programme_id, ...fields } (partial) */
export const useUpdateProgramme = () => useCatalogueMutation("catalogue/update_programme", (payload) => ({
  ...payload,
  owner_staff_id: payload.owner_staff_id ?? payload.owner,
}));
/** Proposed: POST training/catalogue/delete_programme — { programme_id } */
export const useDeleteProgramme = () => useCatalogueMutation("catalogue/delete_programme");

/** Proposed: POST training/catalogue/create_course — see API_REQUIREMENTS.md for the payload */
export const useCreateCatalogueCourse = () =>
  useCatalogueMutation("catalogue/create_course", (payload) => ({
    ...mapCoursePayload(payload),
    created_by: payload.created_by ?? getTrainingIdentity().staff_id,
  }));
/** Proposed: POST training/catalogue/update_course — { course_id, ...same payload as create } */
export const useUpdateCatalogueCourse = () =>
  useCatalogueMutation("catalogue/update_course", (payload) => ({
    ...mapCoursePayload(payload),
    updated_by: payload.updated_by ?? getTrainingIdentity().staff_id,
  }));
/** Proposed: POST training/catalogue/set_course_status — { course_id, status: DRAFT | ACTIVE | ARCHIVED } */
export const useSetCourseStatus = () => useCatalogueMutation("catalogue/set_course_status");
/** Proposed: POST training/catalogue/duplicate_course — { course_id } → { COURSE_ID } */
export const useDuplicateCourse = () =>
  useCatalogueMutation("catalogue/duplicate_course", (payload) => ({
    ...payload,
    created_by: payload.created_by ?? getTrainingIdentity().staff_id,
  }));
/** Proposed: POST training/catalogue/delete_course — { course_id } */
export const useDeleteCatalogueCourse = () => useCatalogueMutation("catalogue/delete_course");
