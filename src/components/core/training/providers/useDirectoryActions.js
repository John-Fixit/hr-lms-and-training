import { useCallback } from "react";
import { Modal } from "antd";
import {
  useDeleteProvider,
  useDeleteTrainer,
  useSetProviderStatus,
  useSetTrainerStatus,
} from "../../../../API/trainingProviders";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";

const report = async (promise) => {
  try {
    const res = await promise;
    successToast(res?.message);
  } catch (err) {
    errorToast(err?.response?.data?.message ?? err?.message);
  }
};

/**
 * Status/delete actions for providers and trainers, shared by tabs and detail drawers.
 * Render `contextHolder` once in the calling component.
 */
export default function useDirectoryActions({ onEditProvider, onEditTrainer, onAddTrainer } = {}) {
  const [modal, contextHolder] = Modal.useModal();
  const { mutateAsync: setProviderStatus } = useSetProviderStatus();
  const { mutateAsync: deleteProvider } = useDeleteProvider();
  const { mutateAsync: setTrainerStatus } = useSetTrainerStatus();
  const { mutateAsync: deleteTrainer } = useDeleteTrainer();

  const providerMenu = useCallback(
    (provider) =>
      [
        { key: "edit", label: "Edit" },
        provider.STATUS === "ACTIVE" && { key: "add_trainer", label: "Add trainer" },
        provider.STATUS === "ACTIVE"
          ? { key: "deactivate", label: "Deactivate" }
          : { key: "activate", label: "Reactivate" },
        { type: "divider" },
        { key: "delete", label: "Delete", danger: true },
      ].filter(Boolean),
    [],
  );

  const runProviderAction = useCallback(
    (key, provider) => {
      const id = provider.PROVIDER_ID;
      if (key === "edit") onEditProvider?.(provider);
      if (key === "add_trainer") onAddTrainer?.(provider);
      if (key === "activate") report(setProviderStatus({ provider_id: id, status: "ACTIVE" }));
      if (key === "deactivate") {
        modal.confirm({
          title: `Deactivate ${provider.PROVIDER_NAME}?`,
          content: "They won't be offered as a provider for new courses or trainings. Their history is kept.",
          okText: "Deactivate",
          onOk: () => report(setProviderStatus({ provider_id: id, status: "INACTIVE" })),
        });
      }
      if (key === "delete") {
        modal.confirm({
          title: `Delete ${provider.PROVIDER_NAME}?`,
          content: "Only providers with no trainers, courses or history can be deleted.",
          okText: "Delete",
          okButtonProps: { danger: true },
          onOk: () => report(deleteProvider({ provider_id: id })),
        });
      }
    },
    [modal, onEditProvider, onAddTrainer, setProviderStatus, deleteProvider],
  );

  const trainerMenu = useCallback(
    (trainer) => [
      { key: "edit", label: "Edit" },
      trainer.STATUS === "ACTIVE"
        ? { key: "deactivate", label: "Deactivate" }
        : { key: "activate", label: "Reactivate" },
      { type: "divider" },
      { key: "delete", label: "Remove", danger: true },
    ],
    [],
  );

  const runTrainerAction = useCallback(
    (key, trainer) => {
      const id = trainer.TRAINER_ID;
      if (key === "edit") onEditTrainer?.(trainer);
      if (key === "activate") report(setTrainerStatus({ trainer_id: id, status: "ACTIVE" }));
      if (key === "deactivate") {
        modal.confirm({
          title: `Deactivate ${trainer.FULL_NAME}?`,
          content: "They won't be offered when assigning trainers. Past sessions are kept.",
          okText: "Deactivate",
          onOk: () => report(setTrainerStatus({ trainer_id: id, status: "INACTIVE" })),
        });
      }
      if (key === "delete") {
        modal.confirm({
          title: `Remove ${trainer.FULL_NAME}?`,
          content: "Only trainers who haven't delivered any sessions can be removed.",
          okText: "Remove",
          okButtonProps: { danger: true },
          onOk: () => report(deleteTrainer({ trainer_id: id })),
        });
      }
    },
    [modal, onEditTrainer, setTrainerStatus, deleteTrainer],
  );

  return { providerMenu, runProviderAction, trainerMenu, runTrainerAction, contextHolder };
}
