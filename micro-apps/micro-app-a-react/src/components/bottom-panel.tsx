import React, { useEffect, useState, useRef } from "react";

interface PortalMessage {
  type: string;
  data: any;
}

interface MessageLogEntry {
  timestamp: number;
  event: PortalMessage;
  direction: "incoming" | "outgoing";
}

/**
 * Bottom panel that listens for messages from the portal
 */
export function BottomPanel() {
  const [messages, setMessages] = useState<MessageLogEntry[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [filter, setFilter] = useState("");

  // Listen for messages from the portal
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only process messages from the parent (portal)
      if (event.source === window.parent) {
        try {
          console.log("Received message from portal:", event.data);

          // Add to message log (at the beginning of the array for newest first)
          setMessages((prev) => [
            {
              timestamp: Date.now(),
              event: event.data,
              direction: "incoming",
            },
            ...prev,
          ]);
        } catch (error) {
          console.error("Error processing message:", error);
        }
      }
    };

    console.log("Setting up message listener");
    window.addEventListener("message", handleMessage);

    return () => {
      console.log("Removing message listener");
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Filter messages based on search term
  const filteredMessages = messages.filter(
    (msg) =>
      filter === "" ||
      msg.event.type.toLowerCase().includes(filter.toLowerCase()) ||
      JSON.stringify(msg.event.data)
        .toLowerCase()
        .includes(filter.toLowerCase())
  );

  return (
    <div
      className="flex flex-col border-t border-gray-300 justify-center bg-white"
      style={{
        height: isPanelOpen ? "600px" : "48px",
        transition: "height 0.3s ease",
      }}
    >
      <div className="p-2 border-gray-300 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="mr-2 p-1 rounded hover:bg-gray-200"
            aria-label={isPanelOpen ? "Close panel" : "Open panel"}
          >
            {isPanelOpen ? "▼" : "▲"}
          </button>
          <h3 className="font-medium text-sm">
            Portal Messages ({messages.length})
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter messages..."
            className="text-xs p-1 border border-gray-300 rounded w-32"
          />
          <button
            onClick={() => setMessages([])}
            className="text-xs p-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Clear
          </button>
        </div>
      </div>

      {isPanelOpen && (
        <div className="flex-1 overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No messages yet. Messages between this app and the portal will
              appear here.
            </div>
          ) : (
            filteredMessages.map((entry, index) => (
              <div
                key={index}
                className="border-b border-gray-200 p-2 hover:bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium text-sm">
                    {entry.event.type}
                    <span className="ml-2 text-xs text-gray-500">
                      {entry.direction === "incoming" ? "← Received" : "→ Sent"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="mt-2 text-xs overflow-x-auto">
                  <pre className="whitespace-pre-wrap break-words bg-gray-100 p-2 rounded">
                    {JSON.stringify(entry.event.data, null, 2)}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
