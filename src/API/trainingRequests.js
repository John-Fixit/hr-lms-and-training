/**
 * Training Requests & Approval Workflow API hooks. Request field differences
 * between the backend guide and existing screens are adapted here.
 */
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { mockApiError, mockId } from "./mock/mockStore";
import { courseById, requestsStore, sessionsStore, skillsStore, staffById } from "./mock/stores";
import { APPROVAL_ROLES, buildSteps, resolveRoute } from "./mock/trainingRequestsSeed";
import { mockEnrolStaff, sessionPhase } from "./trainingSessions";
import {
  asArray,
  getTrainingIdentity,
  postTraining,
  responseData,
  staffFullName,
  toNumber,
  useTrainingMutation,
  useTrainingQuery,
  withActor,
  withCompany,
} from "./trainingApi";
import {
  SAMPLE_OPEN_SESSIONS,
  SAMPLE_SKILL_GAPS,
  fillUnconfirmed,
  isSampleId,
  sampleSparseList,
  tagSample,
} from "./trainingSample";

const QUERY_ROOT = "training_requests";
const now = () => dayjs().format("YYYY-MM-DD");
const fullName = (s) => (s ? `${s.LAST_NAME} ${s.FIRST_NAME}` : "Unknown staff");
/** Approval roles a route step can use. Real build: a lookup endpoint or shared constant. */
export { APPROVAL_ROLES };
export const approvalRoleLabel = (role) => APPROVAL_ROLES.find((r) => r.value === role)?.label ?? role;

function getRequest(store, requestId) {
  const request = store.requests.find((r) => r.REQUEST_ID === requestId);
  if (!request) throw mockApiError("Request not found.");
  return request;
}

function summarise(request) {
  const member = staffById(request.STAFF_ID);
  const course = request.COURSE_ID ? courseById(request.COURSE_ID) : null;
  const currentIndex = request.STEPS.findIndex((s) => s.STATUS === "PENDING");
  const current = currentIndex >= 0 ? request.STEPS[currentIndex] : null;
  const lastAction = [...request.HISTORY].reverse()[0];
  return {
    ...request,
    STAFF_NAME: fullName(member),
    FIRST_NAME: member?.FIRST_NAME ?? "",
    LAST_NAME: member?.LAST_NAME ?? "",
    STAFF_NUMBER: member?.STAFF_NUMBER ?? "",
    DESIGNATION: member?.DESIGNATION ?? "",
    DEPARTMENT: member?.DEPARTMENT ?? "",
    GRADE: member?.GRADE ?? "",
    TITLE: course?.COURSE_TITLE ?? request.PROPOSED_TITLE,
    COURSE_CODE: course?.COURSE_CODE ?? "",
    CURRENT_STEP_INDEX: currentIndex,
    CURRENT_ROLE: current?.ROLE ?? null,
    CURRENT_APPROVER: current?.APPROVER_NAME ?? null,
    STEPS_APPROVED: request.STEPS.filter((s) => s.STATUS === "APPROVED").length,
    DAYS_WAITING:
      request.STATUS === "PENDING" ? dayjs().diff(dayjs(lastAction?.AT ?? request.SUBMITTED_AT), "day") : null,
  };
}

/** Requester's current level vs what the course takes them to, per requested skill. */
function skillGaps(request) {
  const store = skillsStore.get();
  const course = request.COURSE_ID ? courseById(request.COURSE_ID) : null;
  return request.SKILL_IDS.map((skillId) => {
    const held = store.staffSkills.find((r) => r.STAFF_ID === request.STAFF_ID && r.SKILL_ID === skillId);
    const target = course?.SKILLS.find((s) => s.SKILL_ID === skillId)?.TARGET_LEVEL ?? 3;
    return {
      SKILL_ID: skillId,
      SKILL_NAME: store.skills.find((s) => s.SKILL_ID === skillId)?.SKILL_NAME ?? "Unknown skill",
      CURRENT_LEVEL: held?.LEVEL ?? 0,
      CURRENT_STATUS: held?.STATUS ?? null,
      TARGET_LEVEL: target,
      GAP: Math.max(0, target - (held?.LEVEL ?? 0)),
    };
  });
}

function requestFields(payload) {
  if (!payload?.staff_id) throw mockApiError("Choose who the training is for.");
  const isCatalogue = payload.request_type === "CATALOGUE";
  const course = isCatalogue ? courseById(payload.course_id) : null;
  if (isCatalogue && !course) throw mockApiError("Choose a catalogue course.");
  if (!isCatalogue && !payload.proposed_title?.trim()) throw mockApiError("Give the proposed training a title.");
  if ((payload.justification?.trim().length ?? 0) < 20) {
    throw mockApiError("Explain the business need in at least 20 characters.");
  }
  return {
    STAFF_ID: payload.staff_id,
    SOURCE: payload.source ?? "HR",
    REQUEST_TYPE: isCatalogue ? "CATALOGUE" : "EXTERNAL",
    COURSE_ID: course?.COURSE_ID ?? null,
    PROPOSED_TITLE: isCatalogue ? "" : payload.proposed_title.trim(),
    PROPOSED_PROVIDER: isCatalogue ? "" : payload.proposed_provider?.trim() ?? "",
    TRAINING_TYPE: course?.TRAINING_TYPE ?? payload.training_type ?? "TRAINING",
    LOCATION: course?.LOCATION ?? payload.location ?? "LOCAL",
    DURATION_DAYS: course?.DURATION_DAYS ?? Number(payload.duration_days ?? 1),
    PREFERRED_START: payload.preferred_start ?? null,
    PREFERRED_END: payload.preferred_end ?? null,
    ESTIMATED_COST: Number(payload.estimated_cost ?? course?.DEFAULT_COST ?? 0),
    FUNDING_SOURCE: payload.funding_source ?? "TRAINING_BUDGET",
    JUSTIFICATION: payload.justification.trim(),
    EXPECTED_OUTCOME: payload.expected_outcome?.trim() ?? "",
    SKILL_IDS: payload.skill_ids?.length ? payload.skill_ids : course?.SKILLS.map((s) => s.SKILL_ID) ?? [],
    ATTACHMENT_NAME: payload.attachment_name ?? null,
    TNA_NEED_ID: payload.tna_need_id ?? null,
  };
}

function routeFor(store, fields) {
  const route = resolveRoute(store.routes, { location: fields.LOCATION, cost: fields.ESTIMATED_COST });
  if (!route) throw mockApiError("No approval route matches this request. Add one under Approval routes.");
  return route;
}

function startApproval(store, request) {
  const requester = staffById(request.STAFF_ID);
  const route = routeFor(store, request);
  request.ROUTE_ID = route.ROUTE_ID;
  request.ROUTE_NAME = route.ROUTE_NAME;
  request.STEPS = buildSteps(route, requester, skillsStore.get().staff);
  request.STEPS[0].STATUS = "PENDING";
  request.STATUS = "PENDING";
  request.SUBMITTED_AT = now();
  request.HISTORY.push({ ACTION: "SUBMITTED", BY: fullName(requester), AT: now(), COMMENT: "" });
}

const mockServer = {
  overview() {
    const { requests } = requestsStore.get();
    const decided = requests.filter((r) => ["APPROVED", "SCHEDULED", "REJECTED"].includes(r.STATUS) && r.SUBMITTED_AT);
    const durations = decided.map((r) => {
      const last = [...r.STEPS].reverse().find((s) => s.ACTED_AT);
      return last ? dayjs(last.ACTED_AT).diff(dayjs(r.SUBMITTED_AT), "day") : 0;
    });
    return {
      PENDING: requests.filter((r) => r.STATUS === "PENDING").length,
      OVERDUE: requests.filter((r) => r.STATUS === "PENDING" && summarise(r).DAYS_WAITING > 5).length,
      RETURNED: requests.filter((r) => r.STATUS === "RETURNED").length,
      AWAITING_SCHEDULING: requests.filter((r) => r.STATUS === "APPROVED").length,
      SCHEDULED: requests.filter((r) => r.STATUS === "SCHEDULED").length,
      AVERAGE_DAYS_TO_DECIDE: durations.length ? Math.round((durations.reduce((s, d) => s + d, 0) / durations.length) * 10) / 10 : null,
      APPROVAL_RATE: decided.length ? Math.round((decided.filter((r) => r.STATUS !== "REJECTED").length / decided.length) * 100) : null,
    };
  },

  requests() {
    return requestsStore
      .get()
      .requests.map(summarise)
      .sort((a, b) => (b.SUBMITTED_AT ?? b.CREATED_AT).localeCompare(a.SUBMITTED_AT ?? a.CREATED_AT));
  },

  request(requestId) {
    const request = getRequest(requestsStore.get(), requestId);
    const { sessions } = sessionsStore.get();
    const session = request.SESSION_ID ? sessions.find((s) => s.SESSION_ID === request.SESSION_ID) : null;
    const openSessions = request.COURSE_ID
      ? sessions
          .filter((s) => s.COURSE_ID === request.COURSE_ID && s.STATUS === "SCHEDULED" && sessionPhase(s) === "UPCOMING")
          .map((s) => {
            const seated = s.PARTICIPANTS.filter((p) => ["NOMINATED", "CONFIRMED"].includes(p.STATUS)).length;
            return { SESSION_ID: s.SESSION_ID, START_DATE: s.START_DATE, END_DATE: s.END_DATE, VENUE: s.VENUE, SEATS_LEFT: s.CAPACITY_MAX - seated, CAPACITY_MAX: s.CAPACITY_MAX };
          })
      : [];
    return {
      ...summarise(request),
      SKILL_GAPS: skillGaps(request),
      SESSION: session ? { SESSION_ID: session.SESSION_ID, START_DATE: session.START_DATE, END_DATE: session.END_DATE, VENUE: session.VENUE, STATUS: session.STATUS } : null,
      OPEN_SESSIONS: openSessions,
    };
  },

  previewRoute(payload) {
    const store = requestsStore.get();
    const course = payload?.course_id ? courseById(payload.course_id) : null;
    const location = course?.LOCATION ?? payload?.location ?? "LOCAL";
    const cost = Number(payload?.estimated_cost ?? course?.DEFAULT_COST ?? 0);
    const route = resolveRoute(store.routes, { location, cost });
    const requester = payload?.staff_id ? staffById(payload.staff_id) : null;
    if (!route) return null;
    return {
      ROUTE_ID: route.ROUTE_ID,
      ROUTE_NAME: route.ROUTE_NAME,
      STEPS: requester ? buildSteps(route, requester, skillsStore.get().staff) : route.STEPS.map((ROLE) => ({ ROLE, APPROVER_NAME: "" })),
    };
  },

  createRequest(payload) {
    const store = requestsStore.get();
    const fields = requestFields(payload);
    const request = {
      REQUEST_ID: mockId("req"),
      REFERENCE_NO: `TR/${dayjs().year()}/${String(store.nextReferenceNo).padStart(4, "0")}`,
      ...fields,
      STATUS: "DRAFT",
      ROUTE_ID: null,
      ROUTE_NAME: "",
      STEPS: [],
      HISTORY: [],
      SESSION_ID: null,
      SUBMITTED_AT: null,
      CREATED_AT: now(),
    };
    store.nextReferenceNo += 1;
    if (payload.submit) startApproval(store, request);
    store.requests.push(request);
    requestsStore.save();
    return {
      message: payload.submit ? `Request ${request.REFERENCE_NO} submitted for approval.` : `Draft ${request.REFERENCE_NO} saved.`,
      data: { REQUEST_ID: request.REQUEST_ID },
    };
  },

  updateRequest(payload) {
    const store = requestsStore.get();
    const request = getRequest(store, payload?.request_id);
    if (!["DRAFT", "RETURNED"].includes(request.STATUS)) throw mockApiError("Only drafts and returned requests can be edited.");
    Object.assign(request, requestFields(payload));
    if (payload.submit) {
      if (request.STATUS === "RETURNED") {
        // Resume at the step that returned it; earlier approvals stand.
        const returned = request.STEPS.find((s) => s.STATUS === "RETURNED");
        if (returned) {
          returned.STATUS = "PENDING";
          returned.ACTED_AT = null;
          returned.COMMENT = "";
        }
        request.STATUS = "PENDING";
        request.HISTORY.push({ ACTION: "RESUBMITTED", BY: fullName(staffById(request.STAFF_ID)), AT: now(), COMMENT: payload.resubmit_note?.trim() ?? "" });
      } else {
        startApproval(store, request);
      }
    }
    requestsStore.save();
    return { message: payload.submit ? `Request ${request.REFERENCE_NO} sent for approval.` : "Changes saved." };
  },

  act(payload) {
    const store = requestsStore.get();
    const request = getRequest(store, payload?.request_id);
    if (request.STATUS !== "PENDING") throw mockApiError("This request isn't waiting for approval.");
    const step = request.STEPS.find((s) => s.STATUS === "PENDING");
    const comment = payload.comment?.trim() ?? "";
    if (["REJECT", "RETURN"].includes(payload.action) && !comment) {
      throw mockApiError(payload.action === "REJECT" ? "Give a reason for rejecting." : "Say what needs to change.");
    }
    step.ACTED_AT = now();
    step.COMMENT = comment;
    if (payload.action === "APPROVE") {
      step.STATUS = "APPROVED";
      const next = request.STEPS.find((s) => s.STATUS === "WAITING");
      if (next) next.STATUS = "PENDING";
      else request.STATUS = "APPROVED";
    } else {
      step.STATUS = payload.action === "REJECT" ? "REJECTED" : "RETURNED";
      request.STATUS = step.STATUS;
    }
    const action = { APPROVE: "APPROVED", REJECT: "REJECTED", RETURN: "RETURNED" }[payload.action];
    request.HISTORY.push({ ACTION: action, BY: step.APPROVER_NAME, ROLE: step.ROLE, AT: now(), COMMENT: comment });
    requestsStore.save();
    const messages = {
      APPROVE: request.STATUS === "APPROVED" ? "Final approval given. The request is ready to schedule." : `Approved. Sent to ${approvalRoleLabel(request.STEPS.find((s) => s.STATUS === "PENDING")?.ROLE)}.`,
      REJECT: "Request rejected. The requester will be notified.",
      RETURN: "Returned to the requester for correction.",
    };
    return { message: messages[payload.action] };
  },

  cancelRequest(payload) {
    const store = requestsStore.get();
    const request = getRequest(store, payload?.request_id);
    if (["SCHEDULED", "REJECTED", "CANCELLED"].includes(request.STATUS)) throw mockApiError("This request can no longer be cancelled.");
    if (!payload.reason?.trim()) throw mockApiError("Give a reason for cancelling.");
    request.STATUS = "CANCELLED";
    request.STEPS.forEach((s) => {
      if (["PENDING", "WAITING"].includes(s.STATUS)) s.STATUS = "SKIPPED";
    });
    request.HISTORY.push({ ACTION: "CANCELLED", BY: "HR Training Desk", AT: now(), COMMENT: payload.reason.trim() });
    requestsStore.save();
    return { message: "Request cancelled." };
  },

  scheduleRequest(payload) {
    const store = requestsStore.get();
    const request = getRequest(store, payload?.request_id);
    if (request.STATUS !== "APPROVED") throw mockApiError("Only fully approved requests can be scheduled.");
    const res = mockEnrolStaff({ session_id: payload.session_id, staff_ids: [request.STAFF_ID], source: "REQUEST", reference_id: request.REQUEST_ID });
    if (res.data.skipped) throw mockApiError("The requester is already enrolled in that session.");
    request.STATUS = "SCHEDULED";
    request.SESSION_ID = payload.session_id;
    request.HISTORY.push({ ACTION: "SCHEDULED", BY: "HR Training Desk", AT: now(), COMMENT: res.data.waitlisted ? "Added to the waitlist — session full." : "" });
    requestsStore.save();
    return { message: res.data.waitlisted ? "Session is full — the requester is on the waitlist." : "Requester enrolled in the session." };
  },

  routes() {
    const { routes, requests } = requestsStore.get();
    return [...routes]
      .sort((a, b) => a.PRIORITY - b.PRIORITY)
      .map((r) => ({ ...r, PENDING_REQUESTS: requests.filter((q) => q.ROUTE_ID === r.ROUTE_ID && q.STATUS === "PENDING").length }));
  },

  saveRoute(payload) {
    const store = requestsStore.get();
    if (!payload?.route_name?.trim()) throw mockApiError("Name the route.");
    if (!payload.steps?.length) throw mockApiError("A route needs at least one approval step.");
    if (new Set(payload.steps).size !== payload.steps.length) throw mockApiError("Each role can appear only once in a route.");
    const min = Number(payload.min_cost ?? 0);
    const max = payload.max_cost === null || payload.max_cost === undefined || payload.max_cost === "" ? null : Number(payload.max_cost);
    if (max !== null && max < min) throw mockApiError("The maximum cost can't be below the minimum.");
    const fields = {
      ROUTE_NAME: payload.route_name.trim(),
      LOCATION: payload.location ?? "ANY",
      MIN_COST: min,
      MAX_COST: max,
      STEPS: payload.steps,
      IS_ACTIVE: payload.is_active === false ? 0 : 1,
    };
    if (payload.route_id) {
      const route = store.routes.find((r) => r.ROUTE_ID === payload.route_id);
      if (!route) throw mockApiError("Route not found.");
      Object.assign(route, fields);
    } else {
      store.routes.push({ ROUTE_ID: mockId("rt"), PRIORITY: store.routes.length + 1, ...fields });
    }
    requestsStore.save();
    return { message: payload.route_id ? "Route updated. It applies to new requests; requests in progress keep their steps." : "Route added." };
  },

  moveRoute(payload) {
    const store = requestsStore.get();
    const sorted = [...store.routes].sort((a, b) => a.PRIORITY - b.PRIORITY);
    const index = sorted.findIndex((r) => r.ROUTE_ID === payload?.route_id);
    const swap = index + (payload.direction === "up" ? -1 : 1);
    if (index < 0 || swap < 0 || swap >= sorted.length) return { message: "" };
    [sorted[index].PRIORITY, sorted[swap].PRIORITY] = [sorted[swap].PRIORITY, sorted[index].PRIORITY];
    requestsStore.save();
    return { message: "Route order updated." };
  },

  deleteRoute(payload) {
    const store = requestsStore.get();
    if (store.requests.some((r) => r.ROUTE_ID === payload?.route_id && r.STATUS === "PENDING")) {
      throw mockApiError("Requests are still going through this route. Switch it off instead.");
    }
    store.routes = store.routes.filter((r) => r.ROUTE_ID !== payload?.route_id);
    requestsStore.save();
    return { message: "Route deleted." };
  },
};

const MOCK_MUTATIONS = {
  "requests/create": (payload) => mockServer.createRequest(payload),
  "requests/update": (payload) => mockServer.updateRequest(payload),
  "requests/act": (payload) => mockServer.act(payload),
  "requests/cancel": (payload) => mockServer.cancelRequest(payload),
  "requests/schedule": (payload) => mockServer.scheduleRequest(payload),
  "requests/save_route": (payload) => mockServer.saveRoute({
    ...payload,
    location: payload.location ?? payload.location_scope,
  }),
  "requests/move_route": (payload) => mockServer.moveRoute(payload),
  "requests/delete_route": (payload) => mockServer.deleteRoute(payload),
};

function mapRequestStep(step, request) {
  const currentStep = request?.CURRENT_STEP_NO == null ? null : Number(request.CURRENT_STEP_NO);
  const stepNo = step.STEP_NO == null ? null : Number(step.STEP_NO);
  let status = step.STATUS;
  if (!status && currentStep != null && stepNo != null) {
    if (stepNo < currentStep) status = "APPROVED";
    else if (stepNo === currentStep) status = request.STATUS === "PENDING" ? "PENDING" : request.STATUS;
    else status = "WAITING";
  }
  return {
    ...step,
    ROLE: step.ROLE ?? step.ROLE_CODE,
    APPROVER_NAME: step.APPROVER_NAME || staffFullName(step),
    STATUS: status ?? step.STATUS,
  };
}

function mapHistoryEntry(entry) {
  return {
    ...entry,
    ACTION: entry.ACTION ?? entry.ACTION_TYPE,
    BY: entry.BY || staffFullName(entry),
    AT: entry.AT ?? entry.CREATED_AT,
    ROLE: entry.ROLE ?? entry.ROLE_CODE,
  };
}

function mapRequest(request) {
  if (!request) return request;
  const steps = asArray(request.STEPS).map((step) => mapRequestStep(step, request));
  const current = steps.find((step) => Number(step.STEP_NO) === Number(request.CURRENT_STEP_NO))
    ?? steps.find((step) => step.STATUS === "PENDING");
  const waitingSince = request.SUBMITTED_AT ?? request.UPDATED_AT ?? request.CREATED_AT;
  return {
    ...request,
    STAFF_NAME: request.STAFF_NAME || staffFullName(request),
    FIRST_NAME: String(request.FIRST_NAME ?? "").trim(),
    LAST_NAME: String(request.LAST_NAME ?? "").trim(),
    TITLE: request.TITLE || request.COURSE_TITLE || request.PROPOSED_TITLE || "",
    SOURCE: request.SOURCE ?? request.REQUEST_SOURCE,
    REFERENCE_NO: request.REFERENCE_NO || (request.REQUEST_ID != null ? `#${request.REQUEST_ID}` : ""),
    SUBMITTED_AT: request.SUBMITTED_AT ?? (request.STATUS === "DRAFT" ? null : request.CREATED_AT),
    DURATION_DAYS: toNumber(request.DURATION_DAYS),
    ESTIMATED_COST: toNumber(request.ESTIMATED_COST),
    STEPS: steps,
    HISTORY: asArray(request.HISTORY).map(mapHistoryEntry),
    SKILL_IDS: request.SKILL_IDS ?? asArray(request.SKILLS).map((skill) => skill.SKILL_ID),
    SKILL_GAPS: request.SKILL_GAPS ?? [],
    OPEN_SESSIONS: request.OPEN_SESSIONS ?? [],
    SESSION: request.SESSION ?? null,
    CURRENT_ROLE: request.CURRENT_ROLE ?? current?.ROLE ?? null,
    CURRENT_APPROVER: request.CURRENT_APPROVER ?? current?.APPROVER_NAME ?? null,
    STEPS_APPROVED: request.STEPS_APPROVED ?? steps.filter((step) => step.STATUS === "APPROVED").length,
    DAYS_WAITING: request.DAYS_WAITING ?? (
      request.STATUS === "PENDING" && waitingSince ? dayjs().diff(dayjs(waitingSince), "day") : null
    ),
    STAFF_NUMBER: request.STAFF_NUMBER ?? "",
    DESIGNATION: request.DESIGNATION ?? "",
    COURSE_CODE: request.COURSE_CODE ?? "",
  };
}

function routeStepRoles(steps) {
  return asArray(steps)
    .map((step) => (typeof step === "string" ? step : step?.ROLE_CODE ?? step?.ROLE))
    .filter(Boolean);
}

function mapRoute(route) {
  if (!route) return route;
  return {
    ...route,
    LOCATION: route.LOCATION ?? route.LOCATION_SCOPE,
    MIN_COST: toNumber(route.MIN_COST),
    MAX_COST: route.MAX_COST == null || route.MAX_COST === "" ? null : toNumber(route.MAX_COST),
    STEPS: routeStepRoles(route.STEPS),
  };
}

function mapPreviewRoute(data) {
  if (!data) return null;
  const route = data.ROUTE ?? data;
  const steps = asArray(data.STEPS ?? route.STEPS).map((step) => ({
    ...step,
    ROLE: step.ROLE ?? step.ROLE_CODE,
    APPROVER_NAME: step.APPROVER_NAME || staffFullName(step),
  }));
  return {
    ...route,
    ROUTE_ID: route.ROUTE_ID,
    ROUTE_NAME: route.ROUTE_NAME,
    STEPS: steps,
  };
}

function mapRequestsOverview(data = {}) {
  return {
    ...data,
    PENDING: toNumber(data.PENDING),
    RETURNED: toNumber(data.RETURNED),
    APPROVED: toNumber(data.APPROVED),
    SCHEDULED: toNumber(data.SCHEDULED),
    DRAFT: toNumber(data.DRAFT),
    REJECTED: toNumber(data.REJECTED),
    CANCELLED: toNumber(data.CANCELLED),
    AWAITING_SCHEDULING: data.AWAITING_SCHEDULING ?? data.APPROVED,
    OVERDUE: data.OVERDUE,
    AVERAGE_DAYS_TO_DECIDE: data.AVERAGE_DAYS_TO_DECIDE,
    APPROVAL_RATE: data.APPROVAL_RATE,
  };
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** Proposed: POST training/requests/overview */
export const useGetRequestsOverview = () =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "overview"],
    endpoint: "requests/overview",
    transform: (data) => fillUnconfirmed(mapRequestsOverview(data), mockServer.overview()),
  });

/** Proposed: POST training/requests/list — real build: reuse training/get_all_trainings with status filters */
export const useGetTrainingRequests = () =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "list"],
    endpoint: "requests/list",
    list: true,
    transform: (rows) => sampleSparseList(
      rows.map(mapRequest),
      mockServer.requests(),
      (row) => row.REQUEST_ID,
    ),
  });

/** Proposed: GET training/requests/detail/:request_id */
export const useGetTrainingRequest = (requestId) =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "detail", requestId],
    endpoint: `requests/detail/${requestId}`,
    method: "GET",
    enabled: Boolean(requestId),
    mockWhen: () => isSampleId(requestId),
    mockHandler: () => tagSample(mockServer.request(requestId)),
    transform: (data) => fillUnconfirmed(mapRequest(data), {
      SKILL_GAPS: SAMPLE_SKILL_GAPS,
      OPEN_SESSIONS: data?.STATUS === "APPROVED" ? SAMPLE_OPEN_SESSIONS : undefined,
    }),
  });

/** Proposed: POST training/requests/preview_route — { staff_id, course_id | location, estimated_cost } */
export const usePreviewApprovalRoute = (draft) =>
  useQuery({
    queryKey: [QUERY_ROOT, "route_preview", draft],
    queryFn: async () => mapPreviewRoute(responseData(await postTraining("requests/preview_route", withCompany(draft)))),
    enabled: Boolean(draft),
  });

/** Proposed: POST training/requests/routes */
export const useGetApprovalRoutes = () =>
  useTrainingQuery({
    queryKey: [QUERY_ROOT, "routes"],
    endpoint: "requests/routes",
    list: true,
    transform: (rows) => sampleSparseList(
      rows.map((route) => fillUnconfirmed(mapRoute(route), { PENDING_REQUESTS: 2 })),
      mockServer.routes(),
      (row) => row.ROUTE_ID,
    ),
  });

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

const useRequestsMutation = (endpoint, mapPayload) =>
  useTrainingMutation({
    endpoint,
    mapPayload,
    invalidate: [[QUERY_ROOT], ["training_sessions"]],
    mockHandler: MOCK_MUTATIONS[endpoint],
  });

/** Proposed: POST training/requests/create — `submit: true` sends it straight into approval */
export const useCreateTrainingRequest = () =>
  useRequestsMutation("requests/create", (payload) => ({
    ...payload,
    staff_id: payload.staff_id ?? getTrainingIdentity().staff_id,
    request_source: payload.request_source ?? payload.source,
    attachment_id: payload.attachment_id ?? payload.file_url_id,
    created_by: payload.created_by ?? getTrainingIdentity().staff_id,
  }));
/** Proposed: POST training/requests/update — drafts and returned requests; `submit` resubmits */
export const useUpdateTrainingRequest = () =>
  useRequestsMutation("requests/update", (payload) => ({
    ...payload,
    request_source: payload.request_source ?? payload.source,
    attachment_id: payload.attachment_id ?? payload.file_url_id,
    updated_by: payload.updated_by ?? getTrainingIdentity().staff_id,
  }));
/** Proposed: POST training/requests/act — { request_id, action: APPROVE | REJECT | RETURN, comment } */
export const useActOnTrainingRequest = () =>
  useRequestsMutation("requests/act", (payload) => withActor({
    ...payload,
    actor_id: payload.actor_id,
  }, "actor_id"));
/** Proposed: POST training/requests/cancel — { request_id, reason } */
export const useCancelTrainingRequest = () =>
  useRequestsMutation("requests/cancel", (payload) => withActor(payload));
/** Proposed: POST training/requests/schedule — { request_id, session_id } enrols the requester */
export const useScheduleTrainingRequest = () =>
  useRequestsMutation("requests/schedule", (payload) => withActor({
    ...payload,
    training_id: payload.training_id ?? payload.session_id,
  }));
/** Proposed: POST training/requests/save_route — { route_id?, route_name, location, min_cost, max_cost, steps, is_active } */
export const useSaveApprovalRoute = () =>
  useRequestsMutation("requests/save_route", (payload) => ({
    ...payload,
    location_scope: payload.location_scope ?? payload.location,
    steps: routeStepRoles(payload.steps),
    created_by: payload.created_by ?? getTrainingIdentity().staff_id,
  }));
/** Proposed: POST training/requests/move_route — { route_id, direction: up | down } */
export const useMoveApprovalRoute = () => useRequestsMutation("requests/move_route");
/** Proposed: POST training/requests/delete_route — { route_id } */
export const useDeleteApprovalRoute = () => useRequestsMutation("requests/delete_route");
