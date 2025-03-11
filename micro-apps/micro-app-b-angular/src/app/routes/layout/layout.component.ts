import { Component, OnDestroy, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { CommonModule } from "@angular/common";
import { MicroAppService, AppData } from "../../services/micro-app.service";
import { BottomPanelComponent } from "../../components/bottom-panel/bottom-panel.component";
import { Subscription } from "rxjs";

@Component({
  selector: "app-layout",
  standalone: true,
  imports: [CommonModule, RouterOutlet, BottomPanelComponent],
  template: `
    <div
      class="w-full h-full p-4 flex-1 flex flex-col gap-6 border-dashed border-8 border-sky-500"
    >
      <ng-container *ngIf="isLoaded; else loading">
        <div class="flex items-center gap-4">
          <div class="bg-blue-100 p-3 rounded-full">
            <svg
              class="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-800">{{ appName }}</h1>
            <p class="text-gray-600">Angular Micro App</p>
          </div>
        </div>
        <div class="flex-1 overflow-y-scroll">
          <router-outlet></router-outlet>
        </div>
        <app-bottom-panel></app-bottom-panel>
      </ng-container>
      <ng-template #loading>
        <div class="flex items-center justify-center h-full">
          <p>Loading...</p>
        </div>
      </ng-template>
    </div>
  `,
})
export class LayoutComponent implements OnInit, OnDestroy {
  isLoaded = false;
  appName = "Angular Micro App";
  private subscription = new Subscription();

  constructor(private microAppService: MicroAppService) {}

  ngOnInit(): void {
    this.initialize();

    // Subscribe to app data
    this.subscription.add(
      this.microAppService.app$.subscribe((app) => {
        if (app) {
          this.appName = app.name;
        }
      })
    );

    // Subscribe to initialization status
    this.subscription.add(
      this.microAppService.isInitialized$.subscribe((initialized) => {
        this.isLoaded = initialized;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.microAppService.destroy();
  }

  private async initialize(): Promise<void> {
    try {
      await this.microAppService.initialize();
    } catch (error) {
      console.error("Failed to initialize:", error);
      this.isLoaded = true; // Show the UI even if initialization fails
    }
  }
}
