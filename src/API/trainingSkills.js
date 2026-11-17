/**
 * Skills & Competency API hooks. Backend responses are unwrapped and request
 * fields are adapted in this module so screens can keep their existing shape.
 */
import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import dayjs from "dayjs";
import { mockApiError as apiError, mockId } from "./mock/mockStore";
import { skillsStore } from "./mock/stores";
import {
  asArray,
  getTrainingIdentity,
  mapTrainingAliases,
  postTraining,
  responseData,
  responseList,
  requireCompanyId,
  useTrainingMutation,
  useTrainingQuery,
  withActor,
} from "./trainingApi";
import {
  SAMPLE_SKILL_STATS,
  fillUnconfirmed,
  isSampleId,
  sampleSparseList,
  tagSample,
} from "./trainingSample";
import API from "../services/AxiosInstance";

const QUERY_ROOT = "training_skills";

/* ------------------------------------------------------------------ */
/* Mock store                                                          */
/* ------------------------------------------------------------------ */

const getStore = skillsStore.get;
const persist = skillsStore.save;

function enrichStaffSkill(record, store) {
  const skill = store.skills.find((s) => s.SKILL_ID === record.SKILL_ID);
  const category = store.categories.find(
    (c) => c.CATEGORY_ID === skill?.CATEGORY_ID,
  );
  return {
    ...record,
    SKILL_NAME: skill?.SKILL_NAME ?? "Unknown skill",
    CATEGORY_ID: skill?.CATEGORY_ID ?? null,
    CATEGORY_NAME: category?.CATEGORY_NAME ?? "Uncategorised",
    SKILL_IS_ACTIVE: skill?.IS_ACTIVE ?? 0,
  };
}

function skillsForStaff(staffId, store) {
  return store.staffSkills
    .filter((record) => record.STAFF_ID === staffId)
    .map((record) => enrichStaffSkill(record, store));
}

function countBy(list, getKey) {
  const counts = new Map();
  list.forEach((item) => {
    const key = getKey(item);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

const mockServer = {
  overview() {
    const store = getStore();
    const activeSkillIds = new Set(
      store.skills.filter((s) => s.IS_ACTIVE).map((s) => s.SKILL_ID),
    );
    const records = store.staffSkills.filter((r) => activeSkillIds.has(r.SKILL_ID));
    const staffWithSkills = new Set(records.map((r) => r.STAFF_ID));
    const topSkill = countBy(records, (r) => r.SKILL_ID)[0];
    const topSkillName = store.skills.find((s) => s.SKILL_ID === topSkill?.label)?.SKILL_NAME;

    return {
      ACTIVE_SKILLS: activeSkillIds.size,
      CATEGORIES: store.categories.length,
      TOTAL_STAFF: store.staff.length,
      STAFF_WITH_SKILLS: staffWithSkills.size,
      TOTAL_RECORDS: records.length,
      VERIFIED_RECORDS: records.filter((r) => r.STATUS === "VERIFIED").length,
      PENDING_RECORDS: records.filter((r) => r.STATUS === "PENDING").length,
      TOP_SKILL: topSkill
        ? { SKILL_ID: topSkill.label, SKILL_NAME: topSkillName, STAFF_COUNT: topSkill.count }
        : null,
    };
  },

  categories() {
    return getStore().categories;
  },

  skills() {
    const store = getStore();
    return store.skills
      .map((skill) => {
        const records = store.staffSkills.filter((r) => r.SKILL_ID === skill.SKILL_ID);
        const category = store.categories.find((c) => c.CATEGORY_ID === skill.CATEGORY_ID);
        const avg = records.length
          ? records.reduce((sum, r) => sum + r.LEVEL, 0) / records.length
          : 0;
        return {
          ...skill,
          CATEGORY_NAME: category?.CATEGORY_NAME ?? "Uncategorised",
          STAFF_COUNT: records.length,
          VERIFIED_COUNT: records.filter((r) => r.STATUS === "VERIFIED").length,
          AVERAGE_LEVEL: Math.round(avg * 10) / 10,
        };
      })
      .sort((a, b) => a.SKILL_NAME.localeCompare(b.SKILL_NAME));
  },

  createSkill(payload) {
    const store = getStore();
    const name = payload?.skill_name?.trim();
    if (!name) throw apiError("Skill name is required.");
    if (store.skills.some((s) => s.SKILL_NAME.toLowerCase() === name.toLowerCase())) {
      throw apiError(`"${name}" already exists in the skills library.`);
    }
    const skillId = mockId("sk");
    store.skills.push({
      SKILL_ID: skillId,
      SKILL_NAME: name,
      CATEGORY_ID: payload.category_id,
      DESCRIPTION: payload.description?.trim() ?? "",
      IS_ACTIVE: payload.is_active ? 1 : 0,
      CREATED_AT: dayjs().format("YYYY-MM-DD"),
    });
    persist();
    return { message: "Skill added to the library.", data: { SKILL_ID: skillId } };
  },

  updateSkill(payload) {
    const store = getStore();
    const target = store.skills.find((s) => s.SKILL_ID === payload?.skill_id);
    if (!target) throw apiError("Skill not found.");
    const name = payload.skill_name?.trim() ?? target.SKILL_NAME;
    const duplicate = store.skills.some(
      (s) => s.SKILL_ID !== target.SKILL_ID && s.SKILL_NAME.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) throw apiError(`"${name}" already exists in the skills library.`);
    Object.assign(target, {
      SKILL_NAME: name,
      CATEGORY_ID: payload.category_id ?? target.CATEGORY_ID,
      DESCRIPTION: payload.description ?? target.DESCRIPTION,
      IS_ACTIVE: payload.is_active === undefined ? target.IS_ACTIVE : payload.is_active ? 1 : 0,
    });
    persist();
    return { message: "Skill updated." };
  },

  deleteSkill(payload) {
    const store = getStore();
    const inUse = store.staffSkills.some((r) => r.SKILL_ID === payload?.skill_id);
    if (inUse) {
      throw apiError("This skill is held by staff. Deactivate it instead of deleting it.");
    }
    store.skills = store.skills.filter((s) => s.SKILL_ID !== payload?.skill_id);
    persist();
    return { message: "Skill deleted." };
  },

  filterOptions() {
    const store = getStore();
    const unique = (getValue) =>
      [...new Set(store.staff.map(getValue).filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b), undefined, { numeric: true }),
      );
    const pairs = (getChild, getParent) => {
      const seen = new Map();
      store.staff.forEach((s) => seen.set(getChild(s), getParent(s)));
      return [...seen.entries()]
        .map(([name, parent]) => ({ name, parent }))
        .sort((a, b) => a.name.localeCompare(b.name));
    };
    return {
      directorates: unique((s) => s.DIRECTORATE),
      departments: pairs((s) => s.DEPARTMENT, (s) => s.DIRECTORATE),
      units: pairs((s) => s.UNIT, (s) => s.DEPARTMENT),
      designations: unique((s) => s.DESIGNATION),
      grades: unique((s) => s.GRADE),
      regions: unique((s) => s.REGION),
    };
  },

  staffOptions() {
    return getStore().staff.map(
      ({ STAFF_ID, FIRST_NAME, LAST_NAME, STAFF_NUMBER, DESIGNATION, DIRECTORATE, DEPARTMENT, UNIT, GRADE }) => ({
        STAFF_ID,
        FIRST_NAME,
        LAST_NAME,
        STAFF_NUMBER,
        DESIGNATION,
        DIRECTORATE,
        DEPARTMENT,
        UNIT,
        GRADE,
      }),
    );
  },

  staffSkills(filters = {}) {
    const store = getStore();
    const {
      skill_ids: skillIds = [],
      min_level: minLevel = 1,
      match = "any",
      verification = "any",
      search = "",
      directorate,
      department,
      unit,
      designation,
      grade,
      region,
    } = filters;
    const term = search.trim().toLowerCase();

    const scoped = store.staff.filter(
      (s) =>
        (!directorate || s.DIRECTORATE === directorate) &&
        (!department || s.DEPARTMENT === department) &&
        (!unit || s.UNIT === unit) &&
        (!designation || s.DESIGNATION === designation) &&
        (!grade || s.GRADE === grade) &&
        (!region || s.REGION === region) &&
        (!term ||
          `${s.LAST_NAME} ${s.FIRST_NAME} ${s.STAFF_NUMBER}`.toLowerCase().includes(term)),
    );

    const rows = scoped
      .map((member) => {
        const skills = skillsForStaff(member.STAFF_ID, store).filter((r) => r.SKILL_IS_ACTIVE);
        const counted = skills.filter(
          (r) => verification !== "verified" || r.STATUS === "VERIFIED",
        );
        const matched = skillIds.length
          ? counted.filter((r) => skillIds.includes(r.SKILL_ID) && r.LEVEL >= minLevel)
          : [];
        return { ...member, SKILLS: skills, MATCHED_SKILLS: matched };
      })
      .filter((row) => {
        if (skillIds.length) {
          const hit =
            match === "all"
              ? skillIds.every((id) => row.MATCHED_SKILLS.some((r) => r.SKILL_ID === id))
              : row.MATCHED_SKILLS.length > 0;
          if (!hit) return false;
        }
        if (verification === "pending") {
          const pool = skillIds.length ? row.MATCHED_SKILLS : row.SKILLS;
          return pool.some((r) => r.STATUS === "PENDING");
        }
        if (verification === "verified" && !skillIds.length) {
          return row.SKILLS.some((r) => r.STATUS === "VERIFIED");
        }
        return true;
      })
      .sort((a, b) => {
        const best = (row) => Math.max(0, ...row.MATCHED_SKILLS.map((r) => r.LEVEL));
        return best(b) - best(a) || a.LAST_NAME.localeCompare(b.LAST_NAME);
      });

    const matchedRecords = rows.flatMap((r) => r.MATCHED_SKILLS);
    const levelSpread = [1, 2, 3, 4, 5].map((level) => ({
      level,
      count: matchedRecords.filter((r) => r.LEVEL === level).length,
    }));

    return {
      rows,
      insights: {
        byDepartment: countBy(rows, (r) => r.DEPARTMENT),
        topSkills: countBy(
          rows.flatMap((r) => r.SKILLS),
          (r) => r.SKILL_ID,
        ).map((item) => ({
          ...item,
          skillId: item.label,
          label: store.skills.find((s) => s.SKILL_ID === item.label)?.SKILL_NAME ?? item.label,
        })),
        levelSpread,
      },
    };
  },

  staffProfile(staffId) {
    const store = getStore();
    const member = store.staff.find((s) => s.STAFF_ID === staffId);
    if (!member) throw apiError("Staff not found.");
    return { ...member, SKILLS: skillsForStaff(staffId, store) };
  },

  saveStaffSkill(payload) {
    const store = getStore();
    const { staff_id: staffId, skill_id: skillId, level, source } = payload ?? {};
    if (!staffId || !skillId || !level) throw apiError("Staff, skill and level are required.");

    const now = dayjs().format("YYYY-MM-DD");
    const status = source === "SELF" ? "PENDING" : "VERIFIED";
    const existing = store.staffSkills.find(
      (r) =>
        (payload.staff_skill_id && r.STAFF_SKILL_ID === payload.staff_skill_id) ||
        (r.STAFF_ID === staffId && r.SKILL_ID === skillId),
    );

    const values = {
      LEVEL: Number(level),
      YEARS_EXPERIENCE: Number(payload.years_experience ?? 0),
      SOURCE: source,
      STATUS: status,
      EVIDENCE_NAME: payload.evidence_name ?? existing?.EVIDENCE_NAME ?? null,
      NOTE: payload.note ?? "",
      ASSESSED_BY: payload.assessed_by ?? "HR Training Desk",
      ASSESSED_AT: now,
    };

    if (existing) {
      // Keep the previous assessment in history instead of overwriting it.
      existing.HISTORY = [
        {
          LEVEL: existing.LEVEL,
          SOURCE: existing.SOURCE,
          STATUS: existing.STATUS,
          ASSESSED_BY: existing.ASSESSED_BY,
          ASSESSED_AT: existing.ASSESSED_AT,
          NOTE: existing.NOTE,
        },
        ...(existing.HISTORY ?? []),
      ];
      Object.assign(existing, values);
      persist();
      return { message: "Skill record updated." };
    }

    store.staffSkills.push({
      STAFF_SKILL_ID: `ss-${store.nextRecordNo}`,
      STAFF_ID: staffId,
      SKILL_ID: skillId,
      HISTORY: [],
      ...values,
    });
    store.nextRecordNo += 1;
    persist();
    return { message: "Skill recorded for staff." };
  },

  setStaffSkillStatus(payload) {
    const store = getStore();
    const record = store.staffSkills.find((r) => r.STAFF_SKILL_ID === payload?.staff_skill_id);
    if (!record) throw apiError("Skill record not found.");
    record.STATUS = payload.status;
    record.NOTE = payload.note ?? record.NOTE;
    persist();
    return {
      message: payload.status === "VERIFIED" ? "Skill verified." : "Skill record rejected.",
    };
  },

  removeStaffSkill(payload) {
    const store = getStore();
    store.staffSkills = store.staffSkills.filter(
      (r) => r.STAFF_SKILL_ID !== payload?.staff_skill_id,
    );
    persist();
    return { message: "Skill removed from staff profile." };
  },
};
const MOCK_MUTATIONS = {
  "skills/create": (payload) => mockServer.createSkill(payload),
  "skills/update": (payload) => mockServer.updateSkill(payload),
  "skills/delete": (payload) => mockServer.deleteSkill(payload),
  "skills/save_staff_skill": (payload) => mockServer.saveStaffSkill(payload),
  "skills/set_status": (payload) => mockServer.setStaffSkillStatus(payload),
  "skills/remove_staff_skill": (payload) => mockServer.removeStaffSkill(payload),
};

function mapStaffSkillRecord(record) {
  return {
    ...record,
    FIRST_NAME: String(record.FIRST_NAME ?? "").trim(),
    LAST_NAME: String(record.LAST_NAME ?? "").trim(),
    LEVEL: record.LEVEL ?? record.SKILL_LEVEL,
    NOTE: record.NOTE ?? record.NOTES,
    YEARS_EXPERIENCE: record.YEARS_EXPERIENCE ?? null,
    HISTORY: asArray(record.HISTORY),
  };
}

function mapStaffDirectory(data) {
  const items = Array.isArray(data)
    ? data
    : asArray(data?.ITEMS ?? data?.rows ?? data?.ROWS);
  if (items.some((row) => Array.isArray(row?.SKILLS) || Array.isArray(row?.MATCHED_SKILLS))) {
    return {
      ...(data && !Array.isArray(data) ? data : {}),
      rows: items.map((row) => ({
        ...row,
        FIRST_NAME: String(row.FIRST_NAME ?? "").trim(),
        LAST_NAME: String(row.LAST_NAME ?? "").trim(),
        DEPARTMENT: row.DEPARTMENT != null ? String(row.DEPARTMENT) : "",
        SKILLS: asArray(row.SKILLS).map(mapStaffSkillRecord),
        MATCHED_SKILLS: asArray(row.MATCHED_SKILLS ?? row.SKILLS).map(mapStaffSkillRecord),
      })),
      insights: data?.insights,
    };
  }

  const byStaff = new Map();
  items.forEach((row) => {
    const id = row.STAFF_ID;
    if (!byStaff.has(id)) {
      byStaff.set(id, {
        STAFF_ID: id,
        FIRST_NAME: String(row.FIRST_NAME ?? "").trim(),
        LAST_NAME: String(row.LAST_NAME ?? "").trim(),
        GRADE: row.GRADE,
        DEPARTMENT: row.DEPARTMENT != null ? String(row.DEPARTMENT) : "",
        STAFF_NUMBER: row.STAFF_NUMBER ?? "",
        DESIGNATION: row.DESIGNATION ?? "",
        SKILLS: [],
        MATCHED_SKILLS: [],
      });
    }
    const skill = mapStaffSkillRecord(row);
    byStaff.get(id).SKILLS.push(skill);
    byStaff.get(id).MATCHED_SKILLS.push(skill);
  });
  const rows = [...byStaff.values()];
  const matched = rows.flatMap((row) => row.MATCHED_SKILLS);
  return {
    rows,
    insights: {
      byDepartment: countBy(rows, (row) => row.DEPARTMENT),
      topSkills: countBy(matched, (row) => row.SKILL_ID).map((item) => ({
        ...item,
        skillId: item.label,
        label: matched.find((row) => row.SKILL_ID === item.label)?.SKILL_NAME ?? item.label,
      })),
      levelSpread: [1, 2, 3, 4, 5].map((level) => ({
        level,
        count: matched.filter((row) => row.LEVEL === level).length,
      })),
    },
  };
}

function mapStaffProfile(data) {
  if (!data) return data;
  const staff = data.STAFF ?? data;
  return {
    ...staff,
    FIRST_NAME: String(staff.FIRST_NAME ?? "").trim(),
    LAST_NAME: String(staff.LAST_NAME ?? "").trim(),
    SKILLS: asArray(data.SKILLS ?? staff.SKILLS).map(mapStaffSkillRecord),
  };
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** Proposed: POST training/skills/overview */
export const useGetSkillsOverview = () =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "overview"],
    endpoint: "skills/overview",
    transform: (data) => {
      const topSkill = data?.TOP_SKILL ?? data?.TOP_SKILLS?.[0] ?? null;
      const pending = Number(data?.PENDING_RECORDS ?? data?.PENDING_ASSESSMENTS ?? 0);
      const verified = Number(data?.VERIFIED_RECORDS ?? data?.VERIFIED_ASSESSMENTS ?? 0);
      return {
        ...data,
        ACTIVE_SKILLS: data?.ACTIVE_SKILLS ?? 0,
        STAFF_WITH_SKILLS: data?.STAFF_WITH_SKILLS ?? 0,
        PENDING_RECORDS: pending,
        VERIFIED_RECORDS: verified,
        TOTAL_RECORDS: data?.TOTAL_RECORDS ?? pending + verified,
        TOP_SKILL: topSkill
          ? {
              ...topSkill,
              SKILL_ID: topSkill.SKILL_ID ?? topSkill.ID,
              SKILL_NAME: topSkill.SKILL_NAME ?? topSkill.NAME,
              STAFF_COUNT: topSkill.STAFF_COUNT ?? topSkill.HOLDER_COUNT ?? topSkill.COUNT,
            }
          : null,
      };
    },
  });

/** Proposed: POST training/skills/categories */
export const useGetSkillCategories = () =>
  useQuery({
    queryKey: [QUERY_ROOT, "categories"],
    queryFn: async () => responseList(await postTraining("skills/categories", { company_id: requireCompanyId() })),
    staleTime: Infinity,
  });

/** Proposed: POST training/skills/list */
export const useGetSkills = () =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "library"],
    endpoint: "skills/list",
    list: true,
    transform: (rows) => sampleSparseList(
      rows.map((skill) => fillUnconfirmed({
        ...skill,
        STAFF_COUNT: skill.STAFF_COUNT ?? null,
        VERIFIED_COUNT: skill.VERIFIED_COUNT ?? null,
        AVERAGE_LEVEL: skill.AVERAGE_LEVEL ?? null,
      }, SAMPLE_SKILL_STATS)),
      mockServer.skills(),
      (row) => row.SKILL_ID,
    ),
  });

/**
 * Filter dropdown values.
 * Real build: reuse the existing org endpoints (package/get_departments, get_units,
 * get_directorate, get_organisation_designation, get_region) instead.
 */
export const useGetSkillFilterOptions = () =>
  useQuery({
    queryKey: [QUERY_ROOT, "filter_options"],
    queryFn: async () => {
      const companyId = requireCompanyId();
      const readList = async (promise) => {
        const response = await promise;
        const data = response?.data?.data ?? response?.data;
        return Array.isArray(data) ? data : [];
      };
      const [directorates, departments, units, designations, regions] = await Promise.all([
        readList(API.get(`package/get_directorates/${companyId}`)),
        readList(API.get(`package/get_departments/${companyId}`)),
        readList(API.get(`package/get_units/${companyId}`)),
        readList(API.get("package/get_organisation_designation")),
        readList(API.get(`package/get_region/${companyId}`)),
      ]);
      const values = (items, idKeys, nameKeys) => items
        .map((item) => ({
          id: idKeys.map((key) => item?.[key]).find((value) => value !== undefined && value !== null),
          name: nameKeys.map((key) => item?.[key]).find(Boolean),
        }))
        .filter((item) => item.name);
      const departmentRecords = values(
        departments,
        ["DEPARTMENT_ID", "ID", "department_id"],
        ["DEPARTMENT_NAME", "DEPARTMENT", "name"],
      );
      const directorateRecords = values(
        directorates,
        ["DIRECTORATE_ID", "ID", "directorate_id"],
        ["DIRECTORATE_NAME", "DIRECTORATE", "name"],
      );
      const unitRecords = values(units, ["UNIT_ID", "ID", "unit_id"], ["UNIT_NAME", "UNIT", "name"]);
      const sourceRecord = (records, itemId, idKeys) =>
        records.find((record) => idKeys.some((key) => record?.[key] === itemId));
      return {
        directorates: directorateRecords.map((item) => ({ ...item, parent: item.id })),
        departments: departmentRecords.map((item) => ({
          ...item,
          parent: sourceRecord(departments, item.id, ["DEPARTMENT_ID", "ID", "department_id"])?.DIRECTORATE_ID
            ?? sourceRecord(departments, item.id, ["DEPARTMENT_ID", "ID", "department_id"])?.DIRECTORATE
            ?? null,
        })),
        departmentRecords,
        units: unitRecords.map((item) => ({
          ...item,
          parent: sourceRecord(units, item.id, ["UNIT_ID", "ID", "unit_id"])?.DEPARTMENT_ID
            ?? sourceRecord(units, item.id, ["UNIT_ID", "ID", "unit_id"])?.DEPARTMENT
            ?? null,
        })),
        designations: values(designations, ["DESIGNATION_ID", "ID", "designation_id"], ["DESIGNATION_NAME", "DESIGNATION", "name"]).map((item) => item.name),
        grades: [],
        regions: values(regions, ["REGION_ID", "ID", "region_id"], ["REGION_NAME", "REGION", "name"]).map((item) => item.name),
      };
    },
    staleTime: 5 * 60 * 1000,
  });

/** Real build: reuse the existing staff search endpoint. */
export const useGetSkillStaffOptions = () =>
  useQuery({
    queryKey: [QUERY_ROOT, "staff_options"],
    queryFn: async () => {
      const response = await API.post("package/getAllStaffByType", {
        company_id: requireCompanyId(),
        staff_type: "full time",
        name: "",
      });
      const data = response?.data?.data;
      if (!Array.isArray(data)) {
        throw new Error("The staff directory returned an unexpected response. Check the Network tab.");
      }
      return mapTrainingAliases(data, { STAFF_NAME: "FULL_NAME" });
    },
    staleTime: 5 * 60 * 1000,
  });

/** Proposed: POST training/skills/staff_directory — the "who has this skill" search. */
export const useGetStaffSkillDirectory = (filters) =>
  useQuery({
    queryKey: [QUERY_ROOT, "directory", filters],
    queryFn: async () => {
      const envelope = await postTraining("skills/staff_directory", {
        ...filters,
        department_id: filters?.department_id ?? filters?.department,
        status: filters?.verification && filters.verification !== "any"
          ? filters.verification.toUpperCase()
          : undefined,
        company_id: requireCompanyId(),
        limit: filters?.limit ?? filters?.page_size,
        page_size: filters?.page_size ?? filters?.limit,
      });
      const data = responseData(envelope);
      const mapped = mapStaffDirectory(data);
      if (mapped.rows?.length) return mapped;
      return tagSample(mapStaffDirectory(mockServer.staffSkills(filters)));
    },
    placeholderData: keepPreviousData,
  });

/** Proposed: GET training/skills/staff_profile/:staff_id */
export const useGetStaffSkillProfile = (staffId) =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "profile", staffId],
    endpoint: `skills/staff_profile/${staffId}`,
    method: "GET",
    payload: { company_id: getTrainingIdentity().company_id },
    enabled: Boolean(staffId),
    mockWhen: () => isSampleId(staffId) || (
      String(staffId) !== "1"
      && skillsStore.get().staff.some((member) => String(member.STAFF_ID) === String(staffId))
    ),
    mockHandler: () => tagSample(mockServer.staffProfile(staffId)),
    transform: (data) => {
      const mapped = mapStaffProfile(data);
      if (!mapped) return mapped;
      return {
        ...mapped,
        SKILLS: asArray(mapped.SKILLS).map((skill) => fillUnconfirmed(skill, { YEARS_EXPERIENCE: 5 })),
      };
    },
  });

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

const useSkillsMutation = (endpoint, mapPayload) =>
  useTrainingMutation({
    endpoint,
    mapPayload,
    invalidate: [[QUERY_ROOT]],
    mockHandler: MOCK_MUTATIONS[endpoint],
  });

/** Proposed: POST training/skills/create — { company_id, skill_name, category_id, description, is_active } */
export const useCreateSkill = () => useSkillsMutation("skills/create", (payload) => ({
  ...payload,
  created_by: payload.created_by ?? getTrainingIdentity().staff_id,
}));

/** Proposed: POST training/skills/update — { skill_id, skill_name, category_id, description, is_active } */
export const useUpdateSkill = () => useSkillsMutation("skills/update");

/** Proposed: POST training/skills/delete — { skill_id } */
export const useDeleteSkill = () => useSkillsMutation("skills/delete");

/**
 * Proposed: POST training/skills/save_staff_skill
 * { staff_id, skill_id, level, years_experience, source, note, evidence (file_url_id) }
 */
export const useSaveStaffSkill = () =>
  useSkillsMutation("skills/save_staff_skill", (payload) => ({
    ...payload,
    skill_level: payload.skill_level ?? payload.level,
    notes: payload.notes ?? payload.note,
    created_by: payload.created_by ?? getTrainingIdentity().staff_id,
  }));

/** Proposed: POST training/skills/set_status — { staff_skill_id, status: VERIFIED | REJECTED, note } */
export const useSetStaffSkillStatus = () =>
  useSkillsMutation("skills/set_status", (payload) => withActor({
    ...payload,
    reason: payload.reason ?? payload.note,
  }));

/** Proposed: POST training/skills/remove_staff_skill — { staff_skill_id } */
export const useRemoveStaffSkill = () =>
  useSkillsMutation("skills/remove_staff_skill", (payload) => withActor(payload));
