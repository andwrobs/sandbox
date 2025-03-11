import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MicroApp } from "../../../shared";
import { IframeRefService, PortalAppService } from "../../portal-app.angular";

/**
 * Component for rendering a micro-app in an iframe
 */
@Component({
  selector: "portal-micro-app-iframe",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="micro-app-container" [class.loading]="!isLoaded">
      <iframe
        #iframeRef
        [src]="iframeSrc"
        [title]="app?.name || 'Micro App'"
        (load)="onIframeLoad()"
        class="micro-app-iframe"
      ></iframe>
      @if (!isLoaded) {
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading {{ app?.name || "Micro App" }}...</p>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .micro-app-container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: 4px;
      }

      .micro-app-iframe {
        width: 100%;
        height: 100%;
        border: none;
      }

      .loading-indicator {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.9);
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: #3498db;
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 16px;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class MicroAppIframeComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input() app!: MicroApp;
  @ViewChild("iframeRef") iframeRef!: ElementRef<HTMLIFrameElement>;

  isLoaded = false;
  iframeSrc = "";

  constructor(
    private portalService: PortalAppService,
    private iframeRefService: IframeRefService
  ) {}

  ngOnInit(): void {
    // Create a safe URL for the iframe
    this.iframeSrc = this.getSafeUrl();
  }

  ngAfterViewInit(): void {
    // Register the iframe with the service
    if (this.app && this.iframeRef) {
      this.iframeRefService.registerIframe(
        this.app.id,
        this.iframeRef.nativeElement
      );
    }
  }

  ngOnDestroy(): void {
    // Unregister the iframe when component is destroyed
    if (this.app) {
      this.iframeRefService.unregisterIframe(this.app.id);
    }
  }

  onIframeLoad(): void {
    this.isLoaded = true;
  }

  private getSafeUrl(): string {
    if (!this.app) return "";
    return `${this.app.baseUrl}${this.app.entryPoint}`;
  }
}
