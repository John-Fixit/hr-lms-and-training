/**
 * Trainers & Providers API hooks. Backend calls use the shared training API
 * client; expiry status remains a display helper for provider documents.
 */
import dayjs from "dayjs";
import { mockApiError, mockId } from "./mock/mockStore";
import { catalogueStore, providersStore } from "./mock/stores";
import {
  asArray,
  getTrainingIdentity,
  splitCommaList,
  staffFullName,
  toNumber,
  useTrainingMutation,
  useTrainingQuery,
} from "./trainingApi";
import {
  fillUnconfirmed,
  isSampleId,
  sampleSparseList,
  tagSample,
} from "./trainingSample";

const QUERY_ROOT = "training_providers";
const EXPIRING_WITHIN_DAYS = 60;
const RATING_KEYS = ["PRESENTATION", "KNOWLEDGE", "TRAINING_AIDS", "INTERACTION"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sameText = (a = "", b = "") => a.trim().toLowerCase() === b.trim().toLowerCase();
const round1 = (value) => Math.round(value * 10) / 10;
const average = (values) => (values.length ? round1(values.reduce((s, v) => s + v, 0) / values.length) : null);

/** EXPIRED | EXPIRING | VALID | null (no expiry date). */
export function expiryStatus(date) {
  if (!date) return null;
  const days = dayjs(date).startOf("day").diff(dayjs().startOf("day"), "day");
  if (days < 0) return "EXPIRED";
  if (days <= EXPIRING_WITHIN_DAYS) return "EXPIRING";
  return "VALID";
}

function worstDocumentStatus(provider) {
  const statuses = [
    expiryStatus(provider.ACCREDITATION_EXPIRY),
    ...provider.DOCUMENTS.map((d) => expiryStatus(d.EXPIRY_DATE)),
  ];
  if (statuses.includes("EXPIRED")) return "EXPIRED";
  if (statuses.includes("EXPIRING")) return "EXPIRING";
  return null;
}

function ratingBreakdown(engagements) {
  const rated = engagements.filter((e) => e.RATINGS);
  return Object.fromEntries(RATING_KEYS.map((key) => [key, average(rated.map((e) => e.RATINGS[key]))]));
}

function engagementStats(engagements) {
  const sorted = [...engagements].sort((a, b) => b.START_DATE.localeCompare(a.START_DATE));
  return {
    ENGAGEMENTS: engagements.length,
    LAST_ENGAGED: sorted[0]?.START_DATE ?? null,
    AVERAGE_RATING: average(engagements.map((e) => e.RATING_OVERALL).filter(Boolean)),
    PARTICIPANTS_TOTAL: engagements.reduce((s, e) => s + e.PARTICIPANTS, 0),
    SPEND_TOTAL: engagements.reduce((s, e) => s + e.TOTAL_COST, 0),
  };
}

const providerNameOf = (store, id) => store.providers.find((p) => p.PROVIDER_ID === id)?.PROVIDER_NAME ?? "";

function withTrainerNames(store, engagements) {
  return [...engagements]
    .sort((a, b) => b.START_DATE.localeCompare(a.START_DATE))
    .map((e) => ({
      ...e,
      PROVIDER_NAME: providerNameOf(store, e.PROVIDER_ID),
      TRAINER_NAMES: e.TRAINER_IDS.map((id) => store.trainers.find((t) => t.TRAINER_ID === id)?.FULL_NAME).filter(Boolean),
    }));
}

function providerFields(payload) {
  const name = payload?.provider_name?.trim();
  if (!name) throw mockApiError("Provider name is required.");
  if (payload.email && !EMAIL_PATTERN.test(payload.email)) throw mockApiError("Enter a valid email address.");
  return {
    PROVIDER_NAME: name,
    PROVIDER_TYPE: payload.provider_type,
    LOCATION: payload.location ?? "LOCAL",
    CITY: payload.city?.trim() ?? "",
    COUNTRY: payload.country?.trim() ?? "",
    CONTACT_PERSON: payload.contact_person?.trim() ?? "",
    EMAIL: payload.email?.trim() ?? "",
    PHONE: payload.phone?.trim() ?? "",
    WEBSITE: payload.website?.trim() ?? "",
    ACCREDITATION: payload.accreditation?.trim() ?? "",
    ACCREDITATION_EXPIRY: payload.accreditation_expiry || null,
    SERVICES: payload.services ?? [],
    DOCUMENTS: (payload.documents ?? [])
      .filter((d) => d?.document_name?.trim())
      .map((d) => ({
        DOCUMENT_ID: d.document_id ?? mockId("doc"),
        DOCUMENT_NAME: d.document_name.trim(),
        DOCUMENT_TYPE: d.document_type ?? "OTHER",
        EXPIRY_DATE: d.expiry_date || null,
      })),
    NOTES: payload.notes?.trim() ?? "",
    STATUS: payload.status ?? "ACTIVE",
  };
}

function trainerFields(payload, store, ignoreId) {
  const type = payload?.trainer_type;
  if (type === "INTERNAL") {
    if (!payload.staff_id) throw mockApiError("Choose the staff member.");
    if (store.trainers.some((t) => t.TRAINER_ID !== ignoreId && t.STAFF_ID === payload.staff_id)) {
      throw mockApiError("This staff member is already registered as a trainer.");
    }
  } else {
    if (!payload?.full_name?.trim()) throw mockApiError("Trainer name is required.");
    if (!payload.provider_id) throw mockApiError("External trainers must belong to a provider.");
  }
  if (payload.email && !EMAIL_PATTERN.test(payload.email)) throw mockApiError("Enter a valid email address.");
  return {
    TRAINER_TYPE: type,
    STAFF_ID: type === "INTERNAL" ? payload.staff_id : null,
    FULL_NAME: payload.full_name?.trim() ?? "",
    PROVIDER_ID: payload.provider_id ?? null,
    TITLE: payload.title?.trim() ?? "",
    DEPARTMENT: payload.department ?? "",
    EMAIL: payload.email?.trim() ?? "",
    PHONE: payload.phone?.trim() ?? "",
    EXPERTISE_SKILL_IDS: payload.expertise_skill_ids ?? [],
    QUALIFICATIONS: (payload.qualifications ?? []).map((q) => q?.trim()).filter(Boolean),
    YEARS_EXPERIENCE: Number(payload.years_experience ?? 0),
    BIO: payload.bio?.trim() ?? "",
    STATUS: payload.status ?? "ACTIVE",
  };
}

const mockServer = {
  overview() {
    const store = providersStore.get();
    const active = store.providers.filter((p) => p.STATUS === "ACTIVE");
    const activeTrainers = store.trainers.filter((t) => t.STATUS === "ACTIVE");
    return {
      ACTIVE_PROVIDERS: active.length,
      INTERNAL_PROVIDERS: active.filter((p) => p.PROVIDER_TYPE === "INTERNAL").length,
      EXTERNAL_PROVIDERS: active.filter((p) => p.PROVIDER_TYPE !== "INTERNAL").length,
      ACTIVE_TRAINERS: activeTrainers.length,
      INTERNAL_TRAINERS: activeTrainers.filter((t) => t.TRAINER_TYPE === "INTERNAL").length,
      EXTERNAL_TRAINERS: activeTrainers.filter((t) => t.TRAINER_TYPE === "EXTERNAL").length,
      AVERAGE_RATING: average(store.engagements.map((e) => e.RATING_OVERALL)),
      RATED_ENGAGEMENTS: store.engagements.length,
      DOCUMENT_ALERTS: active.filter((p) => worstDocumentStatus(p)).length,
    };
  },

  providers() {
    const store = providersStore.get();
    const courses = catalogueStore.get().courses;
    return store.providers
      .map((p) => ({
        ...p,
        ...engagementStats(store.engagements.filter((e) => e.PROVIDER_ID === p.PROVIDER_ID)),
        TRAINER_COUNT: store.trainers.filter((t) => t.PROVIDER_ID === p.PROVIDER_ID && t.STATUS === "ACTIVE").length,
        COURSE_COUNT: courses.filter((c) => c.DEFAULT_PROVIDER_ID === p.PROVIDER_ID).length,
        DOCUMENT_ALERT: worstDocumentStatus(p),
      }))
      .sort((a, b) => a.PROVIDER_NAME.localeCompare(b.PROVIDER_NAME));
  },

  provider(providerId) {
    const store = providersStore.get();
    const found = store.providers.find((p) => p.PROVIDER_ID === providerId);
    if (!found) throw mockApiError("Provider not found.");
    const engagements = store.engagements.filter((e) => e.PROVIDER_ID === providerId);
    return {
      ...found,
      ...engagementStats(engagements),
      DOCUMENT_ALERT: worstDocumentStatus(found),
      RATING_BREAKDOWN: ratingBreakdown(engagements),
      ENGAGEMENT_HISTORY: withTrainerNames(store, engagements),
      TRAINERS: store.trainers
        .filter((t) => t.PROVIDER_ID === providerId)
        .map(({ TRAINER_ID, FULL_NAME, TITLE, TRAINER_TYPE, STATUS }) => ({ TRAINER_ID, FULL_NAME, TITLE, TRAINER_TYPE, STATUS })),
      COURSES: catalogueStore
        .get()
        .courses.filter((c) => c.DEFAULT_PROVIDER_ID === providerId)
        .map(({ COURSE_ID, COURSE_CODE, COURSE_TITLE, STATUS }) => ({ COURSE_ID, COURSE_CODE, COURSE_TITLE, STATUS })),
    };
  },

  createProvider(payload) {
    const store = providersStore.get();
    const fields = providerFields(payload);
    if (store.providers.some((p) => sameText(p.PROVIDER_NAME, fields.PROVIDER_NAME))) {
      throw mockApiError(`"${fields.PROVIDER_NAME}" is already registered.`);
    }
    store.providers.push({ PROVIDER_ID: mockId("prv"), CREATED_AT: dayjs().format("YYYY-MM-DD"), ...fields });
    providersStore.save();
    return { message: "Provider registered." };
  },

  updateProvider(payload) {
    const store = providersStore.get();
    const target = store.providers.find((p) => p.PROVIDER_ID === payload?.provider_id);
    if (!target) throw mockApiError("Provider not found.");
    const fields = providerFields(payload);
    if (store.providers.some((p) => p.PROVIDER_ID !== target.PROVIDER_ID && sameText(p.PROVIDER_NAME, fields.PROVIDER_NAME))) {
      throw mockApiError(`"${fields.PROVIDER_NAME}" is already registered.`);
    }
    Object.assign(target, fields);
    providersStore.save();
    return { message: "Provider updated." };
  },

  setProviderStatus(payload) {
    const store = providersStore.get();
    const target = store.providers.find((p) => p.PROVIDER_ID === payload?.provider_id);
    if (!target) throw mockApiError("Provider not found.");
    target.STATUS = payload.status;
    providersStore.save();
    return { message: `${target.PROVIDER_NAME} ${payload.status === "ACTIVE" ? "reactivated" : "deactivated"}.` };
  },

  deleteProvider(payload) {
    const store = providersStore.get();
    const id = payload?.provider_id;
    if (store.engagements.some((e) => e.PROVIDER_ID === id)) {
      throw mockApiError("This provider has engagement history. Deactivate it instead so records are kept.");
    }
    if (store.trainers.some((t) => t.PROVIDER_ID === id)) {
      throw mockApiError("Remove or move this provider's trainers first.");
    }
    if (catalogueStore.get().courses.some((c) => c.DEFAULT_PROVIDER_ID === id)) {
      throw mockApiError("Catalogue courses use this provider as their default. Change them first.");
    }
    store.providers = store.providers.filter((p) => p.PROVIDER_ID !== id);
    providersStore.save();
    return { message: "Provider deleted." };
  },

  trainers() {
    const store = providersStore.get();
    return store.trainers
      .map((t) => {
        const engagements = store.engagements.filter((e) => e.TRAINER_IDS.includes(t.TRAINER_ID));
        const stats = engagementStats(engagements);
        return {
          ...t,
          PROVIDER_NAME: providerNameOf(store, t.PROVIDER_ID),
          SESSIONS_DELIVERED: stats.ENGAGEMENTS,
          LAST_ENGAGED: stats.LAST_ENGAGED,
          AVERAGE_RATING: ratingBreakdownAverage(engagements),
        };
      })
      .sort((a, b) => a.FULL_NAME.localeCompare(b.FULL_NAME));
  },

  trainer(trainerId) {
    const store = providersStore.get();
    const found = store.trainers.find((t) => t.TRAINER_ID === trainerId);
    if (!found) throw mockApiError("Trainer not found.");
    const engagements = store.engagements.filter((e) => e.TRAINER_IDS.includes(trainerId));
    return {
      ...found,
      PROVIDER_NAME: providerNameOf(store, found.PROVIDER_ID),
      SESSIONS_DELIVERED: engagements.length,
      PARTICIPANTS_TOTAL: engagements.reduce((s, e) => s + e.PARTICIPANTS, 0),
      AVERAGE_RATING: ratingBreakdownAverage(engagements),
      RATING_BREAKDOWN: ratingBreakdown(engagements),
      ENGAGEMENT_HISTORY: withTrainerNames(store, engagements),
    };
  },

  createTrainer(payload) {
    const store = providersStore.get();
    const fields = trainerFields(payload, store);
    store.trainers.push({ TRAINER_ID: mockId("trn"), ...fields });
    providersStore.save();
    return { message: `${fields.FULL_NAME} added as a trainer.` };
  },

  updateTrainer(payload) {
    const store = providersStore.get();
    const target = store.trainers.find((t) => t.TRAINER_ID === payload?.trainer_id);
    if (!target) throw mockApiError("Trainer not found.");
    Object.assign(target, trainerFields(payload, store, target.TRAINER_ID));
    providersStore.save();
    return { message: "Trainer updated." };
  },

  setTrainerStatus(payload) {
    const store = providersStore.get();
    const target = store.trainers.find((t) => t.TRAINER_ID === payload?.trainer_id);
    if (!target) throw mockApiError("Trainer not found.");
    target.STATUS = payload.status;
    providersStore.save();
    return { message: `${target.FULL_NAME} ${payload.status === "ACTIVE" ? "reactivated" : "deactivated"}.` };
  },

  deleteTrainer(payload) {
    const store = providersStore.get();
    if (store.engagements.some((e) => e.TRAINER_IDS.includes(payload?.trainer_id))) {
      throw mockApiError("This trainer has delivered sessions. Deactivate them instead so records are kept.");
    }
    store.trainers = store.trainers.filter((t) => t.TRAINER_ID !== payload?.trainer_id);
    providersStore.save();
    return { message: "Trainer removed." };
  },
};

/** A trainer's rating = average of the trainer-specific feedback questions across their sessions. */
function ratingBreakdownAverage(engagements) {
  const values = Object.values(ratingBreakdown(engagements)).filter((v) => v !== null);
  return average(values);
}
const MOCK_MUTATIONS = {
  "providers/create": (payload) => mockServer.createProvider(payload),
  "providers/update": (payload) => mockServer.updateProvider(payload),
  "providers/set_status": (payload) => mockServer.setProviderStatus(payload),
  "providers/delete": (payload) => mockServer.deleteProvider(payload),
  "trainers/create": (payload) => mockServer.createTrainer(payload),
  "trainers/update": (payload) => mockServer.updateTrainer(payload),
  "trainers/set_status": (payload) => mockServer.setTrainerStatus(payload),
  "trainers/delete": (payload) => mockServer.deleteTrainer(payload),
};

function mapProvider(provider) {
  if (!provider) return provider;
  const documents = asArray(provider.DOCUMENTS);
  return {
    ...provider,
    SERVICES: splitCommaList(provider.SERVICES),
    DOCUMENTS: documents,
    TRAINERS: asArray(provider.TRAINERS),
    COURSES: asArray(provider.COURSES),
    ENGAGEMENT_HISTORY: asArray(provider.ENGAGEMENT_HISTORY),
    DOCUMENT_ALERT: provider.DOCUMENT_ALERT ?? worstDocumentStatus({
      ...provider,
      DOCUMENTS: documents,
    }),
  };
}

function mapTrainer(trainer) {
  if (!trainer) return trainer;
  const skills = asArray(trainer.SKILLS);
  return {
    ...trainer,
    QUALIFICATIONS: asArray(trainer.QUALIFICATIONS),
    EXPERTISE_SKILL_IDS: trainer.EXPERTISE_SKILL_IDS ?? skills.map((skill) => skill.SKILL_ID),
    ENGAGEMENT_HISTORY: asArray(trainer.ENGAGEMENT_HISTORY),
    YEARS_EXPERIENCE: toNumber(trainer.YEARS_EXPERIENCE),
  };
}

function mapTrainerPayload(payload) {
  return {
    ...payload,
    skill_ids: payload.skill_ids ?? payload.expertise_skill_ids,
    full_name: payload.full_name?.trim() || staffFullName(payload) || staffFullName(payload.staff) || undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** Proposed: POST training/providers/overview */
export const useGetProvidersOverview = () =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "overview"],
    endpoint: "providers/overview",
    transform: (data = {}) => fillUnconfirmed({
      ...data,
      ACTIVE_PROVIDERS: toNumber(data.ACTIVE_PROVIDERS),
      ACTIVE_TRAINERS: toNumber(data.ACTIVE_TRAINERS),
      DOCUMENT_ALERTS: data.DOCUMENT_ALERTS ?? (
        data.EXPIRING_DOCUMENTS != null || data.EXPIRED_DOCUMENTS != null
          ? toNumber(data.EXPIRING_DOCUMENTS) + toNumber(data.EXPIRED_DOCUMENTS)
          : undefined
      ),
    }, mockServer.overview()),
  });

/** Proposed: POST training/providers/list */
export const useGetProviders = () =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "providers"],
    endpoint: "providers/list",
    list: true,
    transform: (rows) => sampleSparseList(
      rows.map(mapProvider),
      mockServer.providers(),
      (row) => row.PROVIDER_ID,
    ),
  });

/** Proposed: GET training/providers/detail/:provider_id */
export const useGetProvider = (providerId) =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "provider", providerId],
    endpoint: `providers/detail/${providerId}`,
    method: "GET",
    enabled: Boolean(providerId),
    mockWhen: () => isSampleId(providerId),
    mockHandler: () => tagSample(mockServer.provider(providerId)),
    transform: (provider) => {
      const sample = mockServer.provider("prv-ipl");
      return fillUnconfirmed(mapProvider(provider), {
        ENGAGEMENT_HISTORY: sample.ENGAGEMENT_HISTORY,
        COURSES: sample.COURSES,
        AVERAGE_RATING: sample.AVERAGE_RATING,
        ENGAGEMENTS: sample.ENGAGEMENTS,
        RATING_BREAKDOWN: sample.RATING_BREAKDOWN,
      });
    },
  });

/** Proposed: POST training/trainers/list */
export const useGetTrainers = () =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "trainers"],
    endpoint: "trainers/list",
    list: true,
    transform: (rows) => sampleSparseList(
      rows.map(mapTrainer),
      mockServer.trainers(),
      (row) => row.TRAINER_ID,
    ),
  });

/** Proposed: GET training/trainers/detail/:trainer_id */
export const useGetTrainer = (trainerId) =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "trainer", trainerId],
    endpoint: `trainers/detail/${trainerId}`,
    method: "GET",
    enabled: Boolean(trainerId),
    mockWhen: () => isSampleId(trainerId),
    mockHandler: () => tagSample(mockServer.trainer(trainerId)),
    transform: (trainer) => {
      const sample = mockServer.trainer("trn-amina");
      return fillUnconfirmed(mapTrainer(trainer), {
        QUALIFICATIONS: sample.QUALIFICATIONS,
        SESSIONS_DELIVERED: sample.SESSIONS_DELIVERED,
        AVERAGE_RATING: sample.AVERAGE_RATING,
        ENGAGEMENT_HISTORY: sample.ENGAGEMENT_HISTORY,
        PARTICIPANTS_TOTAL: sample.PARTICIPANTS_TOTAL,
        RATING_BREAKDOWN: sample.RATING_BREAKDOWN,
      });
    },
  });

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

const useProvidersMutation = (endpoint, mapPayload) =>
  useTrainingMutation({
    endpoint,
    mapPayload,
    invalidate: [[QUERY_ROOT], ["training_catalogue"]],
    mockHandler: MOCK_MUTATIONS[endpoint],
  });

/** Proposed: POST training/providers/create — see API_REQUIREMENTS.md for the payload */
export const useCreateProvider = () =>
  useProvidersMutation("providers/create", (payload) => ({
    ...payload,
    services: Array.isArray(payload.services) ? payload.services.join(", ") : payload.services,
    created_by: payload.created_by ?? getTrainingIdentity().staff_id,
  }));
/** Proposed: POST training/providers/update — { provider_id, ...same payload as create } */
export const useUpdateProvider = () =>
  useProvidersMutation("providers/update", (payload) => ({
    ...payload,
    services: Array.isArray(payload.services) ? payload.services.join(", ") : payload.services,
  }));
/** Proposed: POST training/providers/set_status — { provider_id, status: ACTIVE | INACTIVE } */
export const useSetProviderStatus = () => useProvidersMutation("providers/set_status");
/** Proposed: POST training/providers/delete — { provider_id } */
export const useDeleteProvider = () => useProvidersMutation("providers/delete");

/** Proposed: POST training/trainers/create — see API_REQUIREMENTS.md for the payload */
export const useCreateTrainer = () =>
  useProvidersMutation("trainers/create", (payload) => ({
    ...mapTrainerPayload(payload),
    created_by: payload.created_by ?? getTrainingIdentity().staff_id,
  }));
/** Proposed: POST training/trainers/update — { trainer_id, ...same payload as create } */
export const useUpdateTrainer = () =>
  useProvidersMutation("trainers/update", mapTrainerPayload);
/** Proposed: POST training/trainers/set_status — { trainer_id, status: ACTIVE | INACTIVE } */
export const useSetTrainerStatus = () => useProvidersMutation("trainers/set_status");
/** Proposed: POST training/trainers/delete — { trainer_id } */
export const useDeleteTrainer = () => useProvidersMutation("trainers/delete");
