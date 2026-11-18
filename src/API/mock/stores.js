/**
 * Prototype mock stores shared across the training API modules, kept in one place so
 * modules that need each other's data (e.g. catalogue ↔ providers) avoid circular imports.
 * Bump a key's version when its seed shape changes, so browsers reseed.
 */
import { createMockStore } from "./mockStore";
import { buildCatalogueSeed } from "./trainingCatalogueSeed";
import { buildProvidersSeed } from "./trainingProvidersSeed";
import { buildSkillsSeed } from "./trainingSkillsSeed";
import { buildSessionsSeed } from "./trainingSessionsSeed";
import { buildRequestsSeed } from "./trainingRequestsSeed";
import { buildNeedsSeed } from "./trainingNeedsSeed";

export const skillsStore = createMockStore("communeety_training_skills_v1", buildSkillsSeed);
export const catalogueStore = createMockStore("communeety_training_catalogue_v2", buildCatalogueSeed);
export const providersStore = createMockStore("communeety_training_providers_v1", buildProvidersSeed);
export const sessionsStore = createMockStore("communeety_training_sessions_v1", buildSessionsSeed);
export const requestsStore = createMockStore("communeety_training_requests_v1", buildRequestsSeed);
export const needsStore = createMockStore("communeety_training_needs_v1", buildNeedsSeed);

export const staffById = (staffId) => skillsStore.get().staff.find((s) => s.STAFF_ID === staffId);
export const courseById = (courseId) => catalogueStore.get().courses.find((c) => c.COURSE_ID === courseId);

export const providerName = (providerId) =>
  providersStore.get().providers.find((p) => p.PROVIDER_ID === providerId)?.PROVIDER_NAME ?? "";
