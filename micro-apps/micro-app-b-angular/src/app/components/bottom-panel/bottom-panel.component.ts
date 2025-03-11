import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { MessagingService } from "../../services/messaging.service";

@Component({
  selector: "app-bottom-panel",
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="flex items-center justify-between p-4 bg-blue-100 rounded-lg">
      <div class="flex gap-4">
        <button
          class="px-4 py-2 bg-blue-500 text-white rounded-md"
          routerLink="/"
        >
          Home
        </button>
        <button
          class="px-4 py-2 bg-blue-500 text-white rounded-md"
          routerLink="/accounts"
        >
          Accounts
        </button>
      </div>
      <div class="flex gap-4">
        <button
          class="px-4 py-2 bg-green-500 text-white rounded-md"
          (click)="showModal()"
        >
          Show Modal
        </button>
        <button
          class="px-4 py-2 bg-purple-500 text-white rounded-md"
          (click)="navigateParent()"
        >
          Navigate Parent
        </button>
        <button
          class="px-4 py-2 bg-yellow-500 text-white rounded-md"
          (click)="sendCustomEvent()"
        >
          Send Event
        </button>
      </div>
    </div>
  `,
})
export class BottomPanelComponent {
  showModal(): void {
    MessagingService.showModal(
      "Angular Micro App Modal",
      "This modal was opened from the Angular micro app!"
    );
  }

  navigateParent(): void {
    MessagingService.navigateParent("/dashboard");
  }

  sendCustomEvent(): void {
    MessagingService.sendEvent("button_clicked", {
      timestamp: new Date().toISOString(),
      component: "BottomPanel",
    });
  }
}
