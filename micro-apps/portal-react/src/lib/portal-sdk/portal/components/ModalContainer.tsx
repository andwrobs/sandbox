import React from "react";
import { usePortalStore } from "../portal.store";
import { usePortalService } from "../use-portal";
import { PortalEventType } from "../portal.types";

/**
 * Props for the PortalModalRenderer component
 */
interface PortalModalRendererProps {
  /** Additional CSS class names */
  className?: string;
}

/**
 * Component for rendering modals from micro-apps
 *
 * This component:
 * - Subscribes to the portal store to get active modals
 * - Renders each modal with appropriate styling
 * - Handles closing modals
 */
export const PortalModalRenderer: React.FC<PortalModalRendererProps> = ({
  className = "",
}) => {
  // Get modals from the portal store
  const activeModals = usePortalStore((state) => state.activeModals);
  const closeModal = usePortalStore((state) => state.closeModal);
  const portalService = usePortalService();

  if (activeModals.length === 0) {
    return null;
  }

  const handleCloseModal = (modalId: string, appId: string) => {
    // Close the modal in the store
    closeModal(modalId);

    // Notify the source app that the modal was closed
    portalService.postMessageToApp(appId, PortalEventType.CLOSE_MODAL, {
      id: modalId,
      closedBy: "portal",
    });
  };

  return (
    <div className={`portal-modal-container ${className}`}>
      {activeModals.map((modal) => (
        <div
          key={modal.id}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            if (modal.displayOptions?.closeOnOverlayClick !== false) {
              handleCloseModal(modal.id, modal.appId);
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-[90%] max-h-[90%] overflow-auto relative"
            style={{
              width: modal.displayOptions?.width || "auto",
              height: modal.displayOptions?.height || "auto",
              ...modal.displayOptions?.contentStyle,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {modal.displayOptions?.showCloseButton !== false && (
              <button
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                onClick={() => handleCloseModal(modal.id, modal.appId)}
                aria-label="Close modal"
              >
                <span className="text-xl">&times;</span>
              </button>
            )}

            {/* Render modal content */}
            <div className="p-6">
              {typeof modal.htmlContent === "string" ? (
                <div dangerouslySetInnerHTML={{ __html: modal.htmlContent }} />
              ) : (
                modal.htmlContent
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
