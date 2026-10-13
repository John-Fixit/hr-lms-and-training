import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import API from "../services/AxiosInstance";
import { baseURL } from "../utils/filePrefix";

/**
 * POST training/get_training_staff
 * payload: { company_id, department: [ids], grade: [ids] }
 */
export const useGetTrainingStaff = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/get_training_staff", payload);
      return res?.data?.data;
    },
  });
};
export const useCreateCourseTraining = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/create", payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["my_training_request_pending"]);
      queryClient.invalidateQueries(["my_training_request_approved"]);
    },
  });
};
export const useCreateTraining = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/create_training", payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["get_training_pending"]);
      queryClient.invalidateQueries(["get_training_approved"]);
      queryClient.invalidateQueries(["get_training_completed"]);
      queryClient.invalidateQueries(["my_training_request_pending"]);
      queryClient.invalidateQueries(["my_training_request_approved"]);
      queryClient.invalidateQueries(["my_training_request_completed"]);
    },
  });
};

export const useGetTraining = (payload) => {
  return useQuery({
    queryKey: [`get_training_${payload?.status}_${payload?.year}`],
    queryFn: async () => {
      // const res = await API.post("training/get_all_trainings_hr", payload);
      const res = await API.post("training/get_all_notification", payload);
      return res?.data?.data;
    },
  });
};
export const useGetMyTraining = (payload) => {
  return useQuery({
    queryKey: [`my_training_${payload?.status}`],
    queryFn: async () => {
      const res = await API.post("training/my_training_staff", payload);
      return res?.data?.data;
    },
  });
};
export const useGetMyTrainingRequest = (payload) => {
  return useQuery({
    queryKey: [`my_training_request_${payload?.status}`],
    queryFn: async () => {
      const res = await API.post("training/get_all_trainings", payload);
      return res?.data?.data;
    },
  });
};
export const useGetTrainingFees = (payload) => {
  return useQuery({
    queryKey: [`training_fees`],
    queryFn: async () => {
      const res = await API.post("training/training_fees", payload);
      return res?.data?.data;
    },
  });
};
export const useGetTrainingTraveling = (payload) => {
  return useQuery({
    queryKey: [`training_traveling_fees`],
    queryFn: async () => {
      const res = await API.post("training/training_traveling_fees", payload);
      return res?.data?.data;
    },
  });
};
export const useGetTrainingNotification = (payload) => {
  return useQuery({
    queryKey: [`my_notification`],
    queryFn: async () => {
      const res = await API.post("training/my_notification", payload);
      return res?.data;
    },
  });
};

export const useUpdateTrainingFees = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/update_training_fees", payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["training_fees"]);
    },
  });
};
export const useAddTravelingFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/add_transport", payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["training_traveling_fees"]);
    },
  });
};
export const useUpdateTravelingFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/update_transport", payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["training_traveling_fees"]);
    },
  });
};
export const useSeenTrainingNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/update_notification", payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["my_notification"]);
    },
  });
};

/**
 * Fetch staff/participants for a training - connect your API (e.g. GET training/participants/:id or POST training/get_training_participants)
 */
export const useGetCoordinatorTrainingStaff = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post(
        "training/coordinator_training_staff",
        payload,
      );
      return res?.data?.data;
    },
  });
};
export const useGetTrainingParticipants = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/view_training_staff", payload);
      return res?.data?.data;
    },
  });
};
export const useGetCourseParticipants = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/view_course_staff", payload);
      return res?.data?.data;
    },
  });
};
export const useGetTrainingReviews = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post(
        "training/view_training_review_staff",
        payload,
      );
      return res?.data?.data;
    },
  });
};
export const useDeleteTraining = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/delete", payload);
      return res?.data;
    },
  });
};

export const useGetTrainingByID = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.get(
        `training/get_trainingID/${payload.trainingID}`,
      );
      console.log(res?.data, "res.data > training details");
      return res?.data?.data;
    },
  });
};

export const useDeleteTrainingById = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const trainingId = payload?.training_id;
      const res = await API.get(`training/delete/${trainingId}`);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["get_training_pending"]);
      queryClient.invalidateQueries(["get_training_awaiting"]);
    },
  });
};
export const useApproveTraining = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/approve_training", payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["get_training_pending"]);
      queryClient.invalidateQueries(["get_training_approved"]);
      queryClient.invalidateQueries(["my_notification"]);
    },
  });
};
export const useApproveCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/approve_course", payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["get_training_pending"]);
      queryClient.invalidateQueries(["get_training_approved"]);
      queryClient.invalidateQueries(["my_notification"]);
    },
  });
};
export const useRemoveStaffFromTrainng = (courseOnly) => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post(
        courseOnly
          ? "training/remove_course_staff"
          : "training/remove_training_staff",
        payload,
      );
      return res?.data;
    },
  });
};
export const useCompleteTraining = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/complete_training", payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["get_training_approved"]);
      queryClient.invalidateQueries(["get_training_completed"]);
    },
  });
};

/**
 * Upload a file (e.g. certificate). Returns { file_url_id, file_url }.
 */
export const useUploadCertificate = () => {
  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const token =
        JSON.parse(localStorage.getItem("communeety-auth-session"))?.state
          ?.userData?.token ?? "";
      const res = await axios({
        method: "post",
        url: baseURL + "attachment/addChatFile",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          token,
        },
      });
      return res?.data;
    },
  });
};

/**
 * Submit training review/feedback (staff who completed the training).
 * Payload: { training_id, staff_id, note, file_url_id, file_url } (JSON).
 */
export const useSubmitTrainingReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/review_training", payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["my_training_completed"]);
      queryClient.invalidateQueries(["my_training_awaiting"]);
    },
  });
};

export const useSendAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/send_availability", payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["my_training_awaiting"]);
    },
  });
};

export const useAddMoreStaff = (courseOnly) => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post(
        courseOnly
          ? "training/add_course_staff"
          : "training/add_training_staff",
        payload,
      );
      return res?.data;
    },
  });
};
export const useSendStaffNotification = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/send_staff_notification", payload);
      return res?.data;
    },
  });
};
export const useSendDirectorNotification = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post(
        "training/send_directors_notification",
        payload,
      );
      return res?.data;
    },
  });
};
export const useUpdateFlight = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/update_flight", payload);
      return res?.data;
    },
  });
};
export const useAddTransport = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/update_flight_transport", payload);
      return res?.data;
    },
  });
};
export const useAssignFlight = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("training/assign_flight", payload);
      return res?.data;
    },
  });
};
