import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./routes/layout/layout.component").then((m) => m.LayoutComponent),
    children: [
      {
        path: "",
        loadComponent: () =>
          import("./routes/home/home.component").then((m) => m.HomeComponent),
      },
      {
        path: "accounts",
        loadComponent: () =>
          import("./routes/accounts/accounts.component").then(
            (m) => m.AccountsComponent
          ),
      },
      {
        path: "accounts/:id",
        loadComponent: () =>
          import(
            "./routes/accounts/account-detail/account-detail.component"
          ).then((m) => m.AccountDetailComponent),
      },
    ],
  },
];
