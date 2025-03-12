import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";
// import { initializePortalEventListener } from './app/services/portal-sdk/portal-event-handler';

// Initialize the portal event listener before bootstrapping the application
// initializePortalEventListener();

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
