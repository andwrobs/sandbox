/**
 * Dead simple messaging service for micro-app communication
 * No lifecycle management, just posts messages to the parent window
 */
export class MessagingService {
  /**
   * Post a message to the parent window
   */
  static postMessage(type: string, data: any = {}): void {
    try {
      // Basic message structure
      const message = {
        source: "micro-app-b-angular",
        type,
        data,
        timestamp: Date.now(),
      };

      // Post to parent window
      window.parent.postMessage(message, "*");

      // Log for debugging
      console.log(`Posted message: ${type}`, data);
    } catch (error) {
      console.error("Failed to post message:", error);
    }
  }

  /**
   * Navigate within the app
   */
  static navigateWithin(path: string): void {
    this.postMessage("NAVIGATE_WITHIN", { path });
  }

  /**
   * Navigate in parent app
   */
  static navigateParent(path: string): void {
    this.postMessage("NAVIGATE_PARENT", { path });
  }

  /**
   * Show a modal
   */
  static showModal(title: string, content: string): void {
    this.postMessage("SHOW_MODAL", { title, content });
  }

  /**
   * Send app ready signal
   */
  static sendReady(): void {
    this.postMessage("APP_READY", {
      name: "Angular Micro App",
      version: "1.0.0",
    });
  }

  /**
   * Send custom event
   */
  static sendEvent(eventName: string, eventData: any = {}): void {
    this.postMessage("CUSTOM_EVENT", {
      eventName,
      eventData,
    });
  }
}
