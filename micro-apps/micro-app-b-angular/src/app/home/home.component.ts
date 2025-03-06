import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PortalService,
  PortalEventType,
} from '../services/portal-sdk/portal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class HomeComponent implements OnInit, OnDestroy {
  private APP_ID = 'micro-app-b';
  private subscriptions: Subscription[] = [];

  appInfo = {
    id: 'Loading...',
    name: 'Micro App B (Angular)',
    permittedInternalRoutes: [] as string[],
    permittedParentRoutes: [] as string[],
    connected: false,
  };

  initialData: any = null;

  constructor(private portalService: PortalService) {}

  ngOnInit(): void {
    // Initialize the portal service
    this.portalService.initialize({
      appId: this.APP_ID,
      debug: true,
    });

    // Subscribe to connection status changes
    this.subscriptions.push(
      this.portalService.getConnectionStatus().subscribe((connected) => {
        this.appInfo.connected = connected;

        if (connected) {
          this.appInfo.id = this.APP_ID;
          this.appInfo.permittedInternalRoutes =
            this.portalService.getPermittedInternalRoutes();
          this.appInfo.permittedParentRoutes =
            this.portalService.getPermittedParentRoutes();
        }
      })
    );

    // Subscribe to initial data
    this.subscriptions.push(
      this.portalService.getInitialData().subscribe((data) => {
        if (data) {
          this.initialData = data;
        }
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    // Clean up portal service
    this.portalService.destroy();
  }

  navigateToAppA(): void {
    this.portalService.navigateParentApplication('/micro-app-a');
  }

  sendMessage(): void {
    this.portalService.postMessageToPortal(PortalEventType.CUSTOM, {
      message: 'Hello from Micro App B!',
      timestamp: new Date().toISOString(),
    });
  }

  openModal(): void {
    this.portalService.postMessageToPortal(PortalEventType.SHOW_MODAL, {
      title: 'Example Modal from Micro-App B',
      content: `
        <div class="p-4">
          <h2 class="text-xl font-bold mb-4">This is a modal from Micro-App B</h2>
          <p class="mb-4">This modal is rendered by the portal but controlled by the micro-app.</p>
          <p class="mb-2">Current time: ${new Date().toLocaleTimeString()}</p>
          <div class="flex justify-end mt-6">
            <button 
              id="modal-close-btn" 
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close Modal
            </button>
          </div>
        </div>
      `,
      width: '500px',
      height: 'auto',
    });
  }
}
