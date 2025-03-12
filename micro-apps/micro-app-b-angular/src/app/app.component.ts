import { Component, OnDestroy } from "@angular/core";
import { RouterOutlet, RouterLink, RouterLinkActive } from "@angular/router";
import { MicroAppService } from "@andwrobs/portal-sdk/angular";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent implements OnDestroy {
  title = "micro-app-b";

  constructor(private microAppService: MicroAppService) {
    // The MicroAppService is initialized in the HomeComponent
    // but we inject it here to ensure it's available throughout the app
  }

  ngOnDestroy(): void {
    // Ensure the MicroAppService is properly cleaned up when the app is destroyed
    this.microAppService.destroy();
  }
}
