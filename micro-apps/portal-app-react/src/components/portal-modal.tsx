import React from "react";
import { usePortalAppStore } from "../../../portal-sdk/react/portal-app.react";

/**
 * PortalModal component
 * Displays a full-screen modal using the modal state from usePortalAppStore
 */
export function PortalModal() {
  const modal = usePortalAppStore((state) => state.modal);
  const closeModal = usePortalAppStore((state) => state.closeModal);

  if (!modal) {
    return null;
  }

  // Get modal display options with defaults
  const displayOptions = modal.displayOptions || {};
  const {
    size = "medium",
    closeOnClickOutside = true,
    showCloseButton = true,
  } = displayOptions;

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnClickOutside) {
      closeModal();
    }
  };

  // Determine modal size class
  const sizeClass = {
    small: "max-w-md",
    medium: "max-w-2xl",
    large: "max-w-4xl",
  }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClass} max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {modal.content.title}
          </h2>
          {showCloseButton && (
            <button
              onClick={closeModal}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Modal body */}
        <div className="px-6 py-4 overflow-auto flex-1">
          <p>{modal.content.body}</p>
        </div>
      </div>
    </div>
  );
}
