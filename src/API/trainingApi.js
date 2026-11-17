import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import API from "../services/AxiosInstance";
import useCurrentUser from "../hooks/useCurrentUser";
import { runMock } from "./mock/mockStore";

export const TRAINING_API_ROOT = "training";

export function getTrainingIdentity() {
  const user = useCurrentUser.getState().userData?.data;
  return {
    company_id: user?.COMPANY_ID,
    staff_id: user?.STAFF_ID,
  };
}

export function requireCompanyId() {
  const companyId = getTrainingIdentity().company_id;
  if (!companyId) throw new Error("Your company could not be determined. Sign in again and retry.");
  return companyId;
}

function assertEnvelope(response) {
  const body = response?.data;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("The training API returned an invalid response. Check the Network tab for its response body.");
  }
  if (body.status === false) {
    const error = new Error(body.message || "The training request failed.");
    error.response = { data: body };
    throw error;
  }
  if (body.status !== true) {
    const error = new Error("The training API response is missing the expected status field.");
    error.response = { data: body };
    throw error;
  }
  return body;
}

export async function postTraining(path, payload = {}) {
  const response = await API.post(`train/${path}`, payload);
  return assertEnvelope(response);
}

export async function getTraining(path, params) {
  const response = await API.get(`train/${path}`, { params });
  return assertEnvelope(response);
}

export function responseData(envelope) {
  return envelope.data;
}

export function responseList(envelope) {
  const data = responseData(envelope);
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    if ("ITEMS" in data) return Array.isArray(data.ITEMS) ? data.ITEMS : [];
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.rows)) return data.rows;
    if (Array.isArray(data.ROWS)) return data.ROWS;
  }
  throw new Error("The training API returned an unexpected list response. Check the Network tab for its response body.");
}

/** Coerce API decimal strings ("100000.00", ".00") before maths or formatting. */
export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

/** Display name from FIRST_NAME / LAST_NAME. Values can have trailing spaces. */
export function staffFullName(person, fallback = "") {
  if (!person || typeof person !== "object") return fallback;
  const name = [person.LAST_NAME, person.FIRST_NAME]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");
  return name || fallback;
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function splitBy(value, splitter) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  return value.split(splitter).map((item) => item.trim()).filter(Boolean);
}

export function splitCommaList(value) {
  return splitBy(value, ",");
}

export function splitNewlineList(value) {
  return splitBy(value, /[\r\n]+/);
}

export function responseMutation(envelope) {
  return {
    message: envelope.message,
    data: mapTrainingAliases(envelope.data, { TRAINING_ID: "SESSION_ID" }),
  };
}

export function withCompany(payload = {}) {
  return { ...payload, company_id: payload.company_id ?? requireCompanyId() };
}

/** Writes stay on sample data until VITE_TRAINING_LIVE_WRITES=true. */
export function trainingWritesAreLive() {
  return import.meta.env.VITE_TRAINING_LIVE_WRITES === "true";
}

function asMutationResult(result) {
  if (result && typeof result === "object" && "message" in result) {
    return {
      message: result.message,
      data: mapTrainingAliases(result.data, { TRAINING_ID: "SESSION_ID" }),
    };
  }
  return {
    message: "Saved in sample data.",
    data: mapTrainingAliases(result, { TRAINING_ID: "SESSION_ID" }),
  };
}

export function useTrainingQuery({
  queryKey,
  endpoint,
  method = "POST",
  payload,
  enabled = true,
  list = false,
  transform = (data) => data,
  mockWhen,
  mockHandler,
}) {
  return useQuery({
    queryKey,
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (mockWhen?.() && mockHandler) {
        return transform(await mockHandler());
      }
      const envelope = method === "GET"
        ? await getTraining(endpoint, payload)
        : await postTraining(endpoint, withCompany(payload));
      return transform(list ? responseList(envelope) : responseData(envelope));
    },
  });
}

export function useTrainingMutation({
  endpoint,
  mapPayload = (payload) => payload,
  invalidate = [],
  mockHandler,
  // Set when the mock is written against the screen's payload rather than the backend shape.
  mockReceivesRawPayload = false,
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload = {}) => {
      const mapped = mapPayload(payload);
      if (!trainingWritesAreLive()) {
        if (!mockHandler) {
          const error = new Error("This action is not connected to the live server yet. Use a sample record to try it.");
          error.response = { data: { message: error.message } };
          throw error;
        }
        const mockPayload = mockReceivesRawPayload ? payload : mapped;
        return asMutationResult(await runMock(() => mockHandler(mockPayload)));
      }
      return responseMutation(await postTraining(endpoint, withCompany(mapped)));
    },
    onSuccess: async () => {
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
  });
}

export function withActor(payload = {}, field = "acted_by") {
  const staffId = getTrainingIdentity().staff_id;
  return { ...payload, [field]: payload[field] ?? staffId };
}

export function mapTrainingAliases(value, aliases) {
  if (Array.isArray(value)) return value.map((item) => mapTrainingAliases(item, aliases));
  if (!value || typeof value !== "object") return value;
  const mapped = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, mapTrainingAliases(item, aliases)]),
  );
  Object.entries(aliases).forEach(([source, target]) => {
    if (mapped[target] == null && mapped[source] != null) mapped[target] = mapped[source];
  });
  return mapped;
}
