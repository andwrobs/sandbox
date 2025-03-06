import React from "react";
import {
  usePortalStore,
  usePortalService,
  type PortalEvent,
} from "../lib/portal-sdk";

// Define a message log entry type
interface MessageLogEntry {
  id: string;
  timestamp: number;
  event: PortalEvent;
  direction: "incoming" | "outgoing";
}

// Message item component
const MessageItem = ({
  entry,
  getAppName,
}: {
  entry: MessageLogEntry;
  getAppName: (id: string) => string;
}) => {
  const isIncoming = entry.direction === "incoming";
  const borderClass = isIncoming
    ? "border-blue-300 bg-blue-50 incoming"
    : "border-green-300 bg-green-50 outgoing";

  const directionClass = isIncoming ? "text-blue-600" : "text-green-600";

  const directionText = isIncoming ? "→ IN" : "← OUT";

  return (
    <div className={`p-2 rounded border message-item ${borderClass} mb-2`}>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <div>
          <span className="font-bold">{formatTime(entry.timestamp)}</span>
          {" | "}
          <span className={directionClass}>{directionText}</span>
        </div>
        <div>{entry.event.type}</div>
      </div>

      <div className="flex gap-2 mb-1">
        <div className="text-xs">
          <span className="text-gray-500">From:</span>{" "}
          <span className="font-semibold">
            {getAppName(entry.event.sourceId)}
          </span>
        </div>

        {entry.event.targetId && (
          <div className="text-xs">
            <span className="text-gray-500">To:</span>{" "}
            <span className="font-semibold">
              {getAppName(entry.event.targetId)}
            </span>
          </div>
        )}
      </div>

      <div className="bg-white p-2 rounded text-xs overflow-x-auto">
        <pre className="whitespace-pre-wrap break-words">
          {JSON.stringify(entry.event.data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

// Format timestamp
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
};

// Panel header component
const PanelHeader = ({
  isPanelOpen,
  setIsPanelOpen,
  filter,
  setFilter,
  clearLog,
  messageCount,
}: {
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  filter: string;
  setFilter: (filter: string) => void;
  clearLog: () => void;
  messageCount: number;
}) => (
  <div className="flex items-center justify-between w-full p-4 border-b border-gray-300 bg-gray-200 flex-nowrap">
    <div className="flex items-center flex-shrink-0">
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="px-2 py-1 bg-gray-300 hover:bg-gray-400 flex items-center rounded whitespace-nowrap"
      >
        <span>{isPanelOpen ? "►" : "◄"}</span>
        {isPanelOpen ? (
          <span>Messages {messageCount > 0 && `(${messageCount})`}</span>
        ) : null}
      </button>
    </div>

    {isPanelOpen && (
      <div className="flex gap-2 flex-shrink-0">
        <input
          type="text"
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-2 py-1 text-sm bg-gray-100 border border-gray-300 rounded w-32"
        />
        <button
          onClick={clearLog}
          className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
        >
          Clear
        </button>
      </div>
    )}
  </div>
);

// CSS for the resizer handle
const resizerHandleStyles = `
  .resizer-handle {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 6px;
    background-color: transparent;
    cursor: ew-resize;
    z-index: 10;
    transition: background-color 0.2s ease;
  }
  .resizer-handle:hover, .resizer-handle.dragging {
    background-color: rgba(59, 130, 246, 0.5);
  }
  .message-container {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding-left: 1.5rem;
  }
  .message-list {
    padding: 0.75rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.875rem;
  }
  /* Override Tailwind reset for our specific elements */
  .side-panel-container {
    --tw-border-opacity: 1;
    border-color: rgba(209, 213, 219, var(--tw-border-opacity));
  }
  .side-panel-container .resizer-handle.dragging {
    --tw-border-opacity: 1;
    border-color: rgba(59, 130, 246, var(--tw-border-opacity));
  }
  .message-item {
    --tw-border-opacity: 1;
  }
  .message-item.incoming {
    border-color: rgba(147, 197, 253, var(--tw-border-opacity));
  }
  .message-item.outgoing {
    border-color: rgba(134, 239, 172, var(--tw-border-opacity));
  }
`;

export function SidePanel() {
  const [isPanelOpen, setIsPanelOpen] = React.useState(true);
  const [messageLog, setMessageLog] = React.useState<MessageLogEntry[]>([]);
  const [filter, setFilter] = React.useState<string>("");
  const [isDragging, setIsDragging] = React.useState(false);

  const logStartRef = React.useRef<HTMLDivElement>(null);
  const resizerRef = React.useRef<HTMLDivElement>(null);
  const microApps = usePortalStore((state) => state.microApps);

  // Get portal service instance
  const portalService = usePortalService({ debug: true });

  // Set up event listener for portal messages
  React.useEffect(() => {
    // Register event listener with the portal service
    const removeListener = portalService.addEventListener((event) => {
      setMessageLog((prev) => [
        // Add new message at the beginning (top)
        {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          event,
          direction: event.sourceId === "portal" ? "outgoing" : "incoming",
        },
        ...prev,
      ]);
    });

    // Return cleanup function
    return removeListener;
  }, [portalService]);

  // Handle scrolling - scroll to top when new messages arrive
  React.useEffect(() => {
    if (isPanelOpen && logStartRef.current && messageLog.length > 0) {
      logStartRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messageLog.length, isPanelOpen]);

  // Filter messages
  const filteredMessages = React.useMemo(() => {
    if (!filter) return messageLog;
    const lowerFilter = filter.toLowerCase();
    return messageLog.filter(
      (entry) =>
        entry.event.type.toLowerCase().includes(lowerFilter) ||
        entry.event.sourceId.toLowerCase().includes(lowerFilter) ||
        (entry.event.targetId &&
          entry.event.targetId.toLowerCase().includes(lowerFilter)) ||
        JSON.stringify(entry.event.data).toLowerCase().includes(lowerFilter)
    );
  }, [messageLog, filter]);

  // Get app name from ID
  const getAppName = (appId: string) => {
    if (microApps[appId]?.name) return microApps[appId].name;
    if (appId === "portal") return "Portal";

    if (appId.startsWith("micro-app-")) {
      const appLetter = appId.split("-").pop()?.toUpperCase() || "";
      return `Micro App ${appLetter}`;
    }

    return appId.charAt(0).toUpperCase() + appId.slice(1);
  };

  // Handle mouse down for resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const panel = e.currentTarget.parentElement;
    const startWidth = panel?.offsetWidth || 350;

    setIsDragging(true);
    if (resizerRef.current) {
      resizerRef.current.classList.add("dragging");
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!panel) return;
      const deltaX = startX - e.clientX;
      const newWidth = Math.max(300, Math.min(1200, startWidth + deltaX));
      panel.style.width = `${newWidth}px`;
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      setIsDragging(false);
      if (resizerRef.current) {
        resizerRef.current.classList.remove("dragging");
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "ew-resize";
  };

  return (
    <>
      <style>{resizerHandleStyles}</style>
      <div
        className="flex-none border-l border-gray-300 bg-gray-100 h-full flex flex-col side-panel-container"
        style={{
          width: isPanelOpen ? "600px" : "auto",
          transition: isPanelOpen ? "none" : "width 0.3s ease",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {isPanelOpen && (
          <div
            ref={resizerRef}
            className="resizer-handle"
            onMouseDown={handleMouseDown}
          />
        )}

        <PanelHeader
          isPanelOpen={isPanelOpen}
          setIsPanelOpen={setIsPanelOpen}
          filter={filter}
          setFilter={setFilter}
          clearLog={() => setMessageLog([])}
          messageCount={filteredMessages.length}
        />

        {isPanelOpen && (
          <div className="message-container">
            <div ref={logStartRef} />
            {filteredMessages.length === 0 ? (
              <div className="text-gray-500 italic p-4 text-center">
                No messages yet. Interact with micro-apps to see communication.
              </div>
            ) : (
              <div className="message-list">
                {filteredMessages.map((entry) => (
                  <MessageItem
                    key={entry.id}
                    entry={entry}
                    getAppName={getAppName}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
