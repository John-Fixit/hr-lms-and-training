import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import API from "../services/AxiosInstance";

/**
 * Local mock data layer for training letter templates.
 * Backed by localStorage so the frontend is fully demoable before the
 * real backend endpoints exist. Hook names/shapes mirror src/API/training.js
 * so swapping these mutationFn/queryFn bodies for real API.post(...) calls
 * later requires no changes anywhere these hooks are consumed.
 */
const STORAGE_KEY = "communeety_training_templates";

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export const useGetTrainingTemplates = () => {
  return useQuery({
    queryKey: ["training_templates"],
    queryFn: async () => {
      const res = await API.post("training/get_template")
      const formattedRes = (res?.data?.data || [])?.map(tmp=>({
        CONTENT: null,
        CREATED_AT: tmp?.DATE_CREATED,
        NAME: tmp?.TEMPLATE_NAME,
        UPDATED_AT: null,
        TEMPLATE_ID: tmp?.TEMPLATE_ID
      }))

      console.log(formattedRes)
      return formattedRes
// return readStore() 
    },
  });
};

export const useGetSingleTrainingTemplate = () => {
  return useMutation({
    mutationFn: async (template_id) => {
      const res = await API.get(`/training/get_template/${template_id}`);
      return res?.data?.data;
    },
  });
};


export const useCreateTrainingTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {

      const res = await API.post("/training/create_template", payload);
     
      return { message: res?.data?.message || "Template created successfully" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["training_templates"]);
    },
  });
};

export const useUpdateTrainingTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("/training/edit_template", payload);
      return { message: res?.data?.message || "Template updated successfully" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["training_templates"]);
    },
  });
};

export const useDeleteTrainingTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
       const res = await API.get(`/training/delete_template/${payload?.id}`);
      return {message: res?.data?.message || "Template deleted successfully"}
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["training_templates"]);
    },
  });
};
