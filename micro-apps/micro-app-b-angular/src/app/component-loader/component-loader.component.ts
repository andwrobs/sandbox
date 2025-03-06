import {
  Component,
  ElementRef,
  OnInit,
  ViewContainerRef,
  Injector,
  ApplicationRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-component-loader',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './component-loader.component.html',
  styleUrl: './component-loader.component.scss',
  host: {
    class: 'full-height',
  },
})
export class ComponentLoaderComponent implements OnInit {
  availableMicroApps = ['micro-app-a', 'micro-app-b'];
  activeMicroApp: string | null = null;
  microAppContainer: HTMLElement | null = null;

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
    private injector: Injector,
    private appRef: ApplicationRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.microAppContainer =
      this.elementRef.nativeElement.querySelector('.micro-app-content');

    // Listen for route changes to load the appropriate micro-app
    this.route.params.subscribe((params) => {
      const appName = params['appName'];
      if (appName && this.availableMicroApps.includes(appName)) {
        this.loadMicroApp(appName);
      } else if (this.availableMicroApps.length > 0) {
        // Default to first app if none specified
        this.router.navigate(['/micro-apps', this.availableMicroApps[0]]);
      }
    });
  }

  async loadMicroApp(appName: string): Promise<void> {
    if (this.activeMicroApp === appName) return;

    try {
      // Clear previous micro-app if any
      if (this.microAppContainer) {
        this.microAppContainer.innerHTML = '';
      }

      // Dynamically load the micro-app script - using the correct path structure
      await this.loadScript(`/assets/${appName}/${appName}.main.js`);

      // Create an instance of the web component
      const microAppElement = document.createElement(`${appName}-root`);

      // Add any required attributes or properties
      microAppElement.setAttribute(
        'app-context',
        JSON.stringify({
          parentApp: 'app-shell',
          timestamp: new Date().toISOString(),
        })
      );

      // Set up event listeners for the micro-app
      microAppElement.addEventListener('micro-app-action', (event: any) => {
        console.log('Micro app action received:', event.detail);
        // Handle the event as needed
      });

      // Append to the container element
      if (this.microAppContainer) {
        this.microAppContainer.appendChild(microAppElement);
      }

      this.activeMicroApp = appName;
      console.log(`Successfully loaded micro-app: ${appName}`);
    } catch (error) {
      console.error(`Failed to load micro-app ${appName}:`, error);
    }
  }

  private loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src="${url}"]`);
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = url;
      script.type = 'module';
      script.onload = () => resolve();
      script.onerror = (error) => reject(error);
      document.body.appendChild(script);
    });
  }

  navigateToApp(appName: string): void {
    this.router.navigate(['/micro-apps', appName]);
  }
}
