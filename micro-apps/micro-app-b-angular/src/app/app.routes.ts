import { Routes } from '@angular/router';
import { ComponentLoaderComponent } from './component-loader/component-loader.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: 'micro-apps/:appName', component: ComponentLoaderComponent },
  { path: 'micro-apps', component: ComponentLoaderComponent },
  { path: 'home', component: HomeComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];
