import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MicroAppService } from "@andwrobs/portal-sdk/angular";
import { Subscription } from "rxjs";
import { PortalEventTypes, MicroApp } from "@andwrobs/portal-sdk/shared";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  standalone: true,
  imports: [CommonModule],
})
export class HomeComponent implements OnInit, OnDestroy {
  private APP_ID = "micro-app-b";
  private subscriptions: Subscription[] = [];

  appInfo = {
    id: "Loading...",
    name: "Micro App B (Angular)",
    permittedInternalRoutes: [] as string[],
    permittedParentRoutes: [] as string[],
    connected: false,
  };

  initialData: any = null;

  constructor(private microAppService: MicroAppService) {}

  ngOnInit(): void {
    // Initialize the micro-app service
    this.microAppService.initialize({
      id: this.APP_ID,
      debug: true,
    });

    // Subscribe to initialization status
    this.subscriptions.push(
      this.microAppService.initialized$.subscribe((initialized: boolean) => {
        this.appInfo.connected = initialized;
        if (initialized) {
          this.appInfo.id = this.APP_ID;
        }
      })
    );

    // Subscribe to app data
    this.subscriptions.push(
      this.microAppService.app$.subscribe((app: MicroApp) => {
        if (app) {
          // Update routes if available in the app data
          if (app.permittedInternalRoutes) {
            this.appInfo.permittedInternalRoutes = app.permittedInternalRoutes;
          }
          if (app.permittedParentRoutes) {
            this.appInfo.permittedParentRoutes = app.permittedParentRoutes;
          }
          // Store initial data if available
          if (app.portalContext) {
            this.initialData = app.portalContext;
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  navigateToAppA(): void {
    this.microAppService.navigateParentApp("/micro-app-a");
  }

  sendMessage(): void {
    this.microAppService.postMessageToPortal({
      type: PortalEventTypes.APP_READY,
      data: {
        message: "Hello from Micro App B!",
      },
    });
  }

  openModal(): void {
    this.microAppService.showModal({
      title: "Example Modal from Micro-App B",
      body: "Hello from Micro-App B!",
    });
  }
}
