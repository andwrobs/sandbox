# Angular Micro App

This is a standalone Angular micro-app that demonstrates integration with the portal SDK. It's built using Angular's standalone components and lazy loading for optimal performance.

## Features

- Integration with Portal SDK
- Standalone components
- Lazy-loaded routes
- Inter-app communication
- Modal dialogs

## Project Structure

```
micro-app-b-angular/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── bottom-panel/
│   │   │       └── bottom-panel.component.ts
│   │   ├── routes/
│   │   │   ├── accounts/
│   │   │   │   ├── account-detail/
│   │   │   │   │   └── account-detail.component.ts
│   │   │   │   └── accounts.component.ts
│   │   │   ├── home/
│   │   │   │   └── home.component.ts
│   │   │   └── layout/
│   │   │       └── layout.component.ts
│   │   ├── services/
│   │   │   └── micro-app.service.ts
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── angular.json
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── tsconfig.spec.json
```

## Getting Started

1. Install dependencies:

   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

## Integration with Portal SDK

This micro-app integrates with the portal SDK to enable communication with the parent portal application. The integration is handled by the `MicroAppService` which wraps the portal SDK's `MicroAppService`.

## Routes

- `/` - Home page
- `/accounts` - List of accounts
- `/accounts/:id` - Account details

## Communication

The micro-app can communicate with the parent portal application through:

- Navigation events
- Modal dialogs
- Custom events

## Development

This project was generated with Angular CLI version 17.2.0.
