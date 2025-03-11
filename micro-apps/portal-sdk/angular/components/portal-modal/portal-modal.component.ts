import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PortalModal } from "../../../shared";

/**
 * Component for rendering a modal from a micro-app
 */
@Component({
  selector: "portal-modal",
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-container" [class]="modalSizeClass">
        <div class="modal-header">
          <h2 class="modal-title">{{ modal.content.title }}</h2>
          <button class="close-button" (click)="close()">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ modal.content.body }}</p>
        </div>
        <div class="modal-footer">
          <button class="primary-button" (click)="close()">Close</button>
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-container {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        width: 500px;
        max-width: 90%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
      }

      .modal-container.small {
        width: 400px;
      }

      .modal-container.large {
        width: 800px;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid #e0e0e0;
      }

      .modal-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
      }

      .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
      }

      .modal-body {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
      }

      .modal-footer {
        padding: 16px 24px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: flex-end;
      }

      .primary-button {
        background-color: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
        font-weight: 500;
      }

      .primary-button:hover {
        background-color: #2980b9;
      }
    `,
  ],
})
export class PortalModalComponent {
  @Input() modal!: PortalModal;
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  get modalSizeClass(): string {
    if (!this.modal.displayOptions?.size) return "";
    return this.modal.displayOptions.size;
  }

  onOverlayClick(event: MouseEvent): void {
    // Close on overlay click if allowed
    if (this.modal.displayOptions?.closeOnClickOutside !== false) {
      // Only close if the click was directly on the overlay
      if ((event.target as HTMLElement).classList.contains("modal-overlay")) {
        this.close();
      }
    }
  }

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }
}
