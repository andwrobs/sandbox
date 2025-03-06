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
    ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30"
    : "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30";

  const directionClass = isIncoming
    ? "text-blue-600 dark:text-blue-400"
    : "text-green-600 dark:text-green-400";

  const directionText = isIncoming ? "→ IN" : "← OUT";

  return (
    <div className={`p-2 rounded border ${borderClass}`}>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <div>
          <span className="font-bold">{formatTime(entry.timestamp)}</span>
          {" | "}
          <span className={directionClass}>{directionText}</span>
        </div>
        <div>{entry.event.type}</div>
      </div>

      <div className="flex gap-2 mb-1">
        <div className="text-xs">
          <span className="text-gray-500 dark:text-gray-400">From:</span>{" "}
          <span className="font-semibold">
            {getAppName(entry.event.sourceId)}
          </span>
        </div>

        {entry.event.targetId && (
          <div className="text-xs">
            <span className="text-gray-500 dark:text-gray-400">To:</span>{" "}
            <span className="font-semibold">
              {getAppName(entry.event.targetId)}
            </span>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 p-2 rounded text-xs overflow-x-auto">
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
  <div className="flex items-center">
    <button
      onClick={() => setIsPanelOpen(!isPanelOpen)}
      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center"
    >
      <span className="mr-2">{isPanelOpen ? "▼" : "▲"}</span>
      <span>Portal Messages {messageCount > 0 && `(${messageCount})`}</span>
    </button>

    {isPanelOpen && (
      <div className="flex gap-2 px-3 py-1 bg-gray-200 dark:bg-gray-700">
        <input
          type="text"
          placeholder="Filter messages..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
        />
        <button
          onClick={clearLog}
          className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded"
        >
          Clear
        </button>
      </div>
    )}
  </div>
);

export function LoggerPanel() {
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [panelHeight, setPanelHeight] = React.useState(300);
  const [isDragging, setIsDragging] = React.useState(false);
  const [messageLog, setMessageLog] = React.useState<MessageLogEntry[]>([]);
  const [filter, setFilter] = React.useState<string>("");

  const startYRef = React.useRef(0);
  const startHeightRef = React.useRef(0);
  const logEndRef = React.useRef<HTMLDivElement>(null);
  const microApps = usePortalStore((state) => state.microApps);

  // Get portal service instance
  const portalService = usePortalService({ debug: true });

  // Set up event listener for portal messages
  React.useEffect(() => {
    // Register event listener with the portal service
    const removeListener = portalService.addEventListener((event) => {
      setMessageLog((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          event,
          direction: event.sourceId === "portal" ? "outgoing" : "incoming",
        },
      ]);
    });

    // Return cleanup function
    return removeListener;
  }, [portalService]);

  // Handle scrolling
  React.useEffect(() => {
    if (isPanelOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [isPanelOpen]);

  React.useEffect(() => {
    if (isPanelOpen && logEndRef.current && messageLog.length > 0) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageLog.length]);

  // Handle panel resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startHeightRef.current = panelHeight;
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startYRef.current - e.clientY;
      setPanelHeight(
        Math.max(100, Math.min(800, startHeightRef.current + delta))
      );
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

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

  return (
    <div className="flex flex-col border-t border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
      <div className="flex justify-start">
        <div className="inline-flex overflow-hidden">
          <PanelHeader
            isPanelOpen={isPanelOpen}
            setIsPanelOpen={setIsPanelOpen}
            filter={filter}
            setFilter={setFilter}
            clearLog={() => setMessageLog([])}
            messageCount={filteredMessages.length}
          />
        </div>
      </div>

      {isPanelOpen && (
        <>
          <div
            className="h-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 cursor-row-resize"
            onMouseDown={handleMouseDown}
          />
          <div
            style={{ height: `${panelHeight}px`, maxHeight: "50vh" }}
            className="overflow-y-auto"
          >
            {filteredMessages.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 italic p-4 text-center">
                No messages yet. Interact with micro-apps to see communication.
              </div>
            ) : (
              <div className="p-2 space-y-2 font-mono text-sm">
                {filteredMessages.map((entry) => (
                  <MessageItem
                    key={entry.id}
                    entry={entry}
                    getAppName={getAppName}
                  />
                ))}
                <div ref={logEndRef} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
