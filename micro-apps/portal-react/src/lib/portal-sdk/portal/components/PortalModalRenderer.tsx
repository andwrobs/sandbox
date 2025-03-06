import React, { useEffect } from "react";
import { usePortalStore } from "../portal.store";
import { createPortal } from "react-dom";

/**
 * Component that renders modals from micro-apps
 */
export const PortalModalRenderer: React.FC = () => {
  const modals = usePortalStore((state) => state.modals);
  const hideModal = usePortalStore((state) => state.hideModal);

  // Create a modal container if it doesn't exist
  useEffect(() => {
    let modalContainer = document.getElementById("portal-modal-container");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "portal-modal-container";
      document.body.appendChild(modalContainer);
    }

    return () => {
      // Clean up the container when the component unmounts
      if (modalContainer && document.body.contains(modalContainer)) {
        document.body.removeChild(modalContainer);
      }
    };
  }, []);

  // Handle click events inside modals
  const handleModalClick = (
    e: React.MouseEvent,
    modalId: string,
    sourceAppId: string
  ) => {
    // Check if the click was on a button
    const target = e.target as HTMLElement;
    if (target.tagName === "BUTTON") {
      // Get the button ID
      const buttonId = target.id;

      // If it's the close button, close the modal
      if (buttonId === "modal-close-btn") {
        hideModal(modalId);
      }

      // Notify the source app about the button click
      const portalService = usePortalStore.getState().portalService;
      if (portalService && sourceAppId) {
        portalService.postMessageToApp(sourceAppId, "MODAL_ACTION", {
          action: "button-click",
          modalId,
          buttonId,
        });
      }
    }
  };

  // Render all modals
  return (
    <>
      {modals.map((modal) => {
        const modalContainer = document.getElementById(
          "portal-modal-container"
        );
        if (!modalContainer) return null;

        return createPortal(
          <div
            key={modal.id}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            onClick={() => hideModal(modal.id)}
          >
            <div
              className="bg-white rounded-lg shadow-lg overflow-hidden"
              style={{ width: modal.width, height: modal.height }}
              onClick={(e) => {
                e.stopPropagation();
                handleModalClick(e, modal.id, modal.sourceAppId);
              }}
            >
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">{modal.title}</h3>
                <button
                  id="modal-close-btn"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => hideModal(modal.id)}
                >
                  &times;
                </button>
              </div>
              <div dangerouslySetInnerHTML={{ __html: modal.content }} />
            </div>
          </div>,
          modalContainer
        );
      })}
    </>
  );
};
