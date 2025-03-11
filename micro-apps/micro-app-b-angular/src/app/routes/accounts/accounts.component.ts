import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";

interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
}

@Component({
  selector: "app-accounts",
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container mx-auto p-4">
      <h2 class="text-2xl font-bold mb-4">Accounts</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          *ngFor="let account of accounts"
          class="bg-white p-4 rounded-lg shadow-md cursor-pointer"
          [routerLink]="['/accounts', account.id]"
        >
          <h3 class="font-bold text-lg">{{ account.name }}</h3>
          <p class="text-gray-600">{{ account.type }}</p>
          <p class="text-lg font-semibold mt-2">
            {{ account.balance | currency }}
          </p>
        </div>
      </div>
    </div>
  `,
})
export class AccountsComponent {
  accounts: Account[] = [
    { id: "1", name: "Checking Account", balance: 2543.33, type: "Checking" },
    { id: "2", name: "Savings Account", balance: 15750.0, type: "Savings" },
    {
      id: "3",
      name: "Investment Portfolio",
      balance: 34120.5,
      type: "Investment",
    },
    { id: "4", name: "Retirement Fund", balance: 78650.75, type: "Retirement" },
    { id: "5", name: "Emergency Fund", balance: 5000.0, type: "Savings" },
    { id: "6", name: "Vacation Fund", balance: 2800.0, type: "Savings" },
  ];
}
