import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import { MicroAppService } from "@andwrobs/portal-sdk/angular";

// Create a factory function for the service
export function microAppServiceFactory() {
  return new MicroAppService();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Provide the service using a factory
    { provide: MicroAppService, useFactory: microAppServiceFactory },
  ],
};
