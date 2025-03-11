import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-4">
      <h2 class="text-2xl font-bold mb-4">Welcome to Angular Micro App</h2>
      <div class="bg-white p-4 rounded-lg shadow-md">
        <p class="mb-4">
          This is a standalone Angular micro-app that demonstrates integration
          with a portal framework.
        </p>
        <p class="mb-4">
          The app uses Angular's standalone components and lazy loading for
          optimal performance.
        </p>
        <div class="p-4 bg-blue-50 rounded-md">
          <h3 class="font-bold mb-2">Features:</h3>
          <ul class="list-disc pl-5">
            <li>Standalone components</li>
            <li>Lazy-loaded routes</li>
            <li>Inter-app communication</li>
            <li>Modal dialogs</li>
          </ul>
        </div>
      </div>
    </div>
  `,
})
export class HomeComponent {}
