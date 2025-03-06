/**
 * Helper function to create a custom event for portal communication
 * This is used to dispatch events from the portal to the micro-app
 */
export function createPortalEvent(detail: any): CustomEvent {
  return new CustomEvent('portal-message', { detail });
}

/**
 * Helper function to dispatch a portal event to the window
 * This is used to simulate receiving events from the portal
 */
export function dispatchPortalEvent(detail: any): void {
  const event = createPortalEvent(detail);
  window.dispatchEvent(event);
}

/**
 * Initialize the portal event listener
 * This sets up the window.addEventListener for postMessage events from the parent window
 */
export function initializePortalEventListener(): void {
  // Listen for messages from the parent window (portal)
  window.addEventListener('message', (event) => {
    // Validate the event data
    if (!event.data || !event.data.type) return;

    // Log the received message
    console.log('[Portal SDK] Received message from portal:', event.data);

    // Create and dispatch a custom event that our Angular components can listen to
    dispatchPortalEvent(event.data);
  });

  console.log('[Portal SDK] Event listener initialized');
}
