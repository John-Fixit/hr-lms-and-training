import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useSendSms = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await axios.post(
        "https://lendnode.creditclan.com/gateway/send_external_sms",
        payload,
      );
      return res;
    },
  });
};
