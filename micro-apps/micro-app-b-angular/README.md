# Micro App B (Angular)

This is an Angular-based micro-app that integrates with the portal system. It demonstrates how to build a micro-app using Angular that can communicate with a parent portal application.

## Features

- Portal integration using the Portal SDK
- Two-way communication with the parent portal
- Navigation between micro-apps
- Modal display capabilities
- Receiving and displaying data from the portal

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Development

To start the development server:

```bash
npm start
```

This will start the Angular development server at `http://localhost:4200/`.

## Portal Integration

This micro-app integrates with the portal system using a custom Portal SDK service. The integration allows:

1. Bidirectional communication with the parent portal
2. Receiving permissions and configuration from the portal
3. Requesting navigation to other micro-apps
4. Displaying modals in the parent portal
5. Receiving initial data from the portal

### Key Components

- `PortalService`: The main service that handles communication with the portal
- `HomeComponent`: A component that demonstrates the portal integration
- `portal-event-handler.ts`: Helper functions for handling portal events

### Usage Example

```typescript
import { Component, OnInit } from "@angular/core";
import { PortalService, PortalEventType } from "./services/portal-sdk";

@Component({
  selector: "app-example",
  template: '<button (click)="sendMessage()">Send Message</button>',
})
export class ExampleComponent implements OnInit {
  constructor(private portalService: PortalService) {}

  ngOnInit() {
    // Initialize the portal service
    this.portalService.initialize({
      appId: "micro-app-b",
      debug: true,
    });
  }

  sendMessage() {
    // Send a message to the portal
    this.portalService.postMessageToPortal(PortalEventType.CUSTOM, {
      message: "Hello from Angular!",
    });
  }
}
```

## Integration with Parent Portal

To integrate this micro-app with the parent portal:

1. Register the micro-app in the parent portal:

```typescript
portalService.registerMicroApp({
  id: "micro-app-b",
  name: "Micro-App B (Angular)",
  baseUrl: "http://localhost:4200",
  entryPoint: "http://localhost:4200/",
  permittedInternalRoutes: ["/", "/home", "/profile"],
  permittedParentRoutes: ["/micro-app-a", "/settings"],
});
```

2. Create an iframe container in the parent portal to load the micro-app
3. Handle events from the micro-app in the parent portal

## License

MIT
