import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { MicroAppService } from "../../../services/micro-app.service";

interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
  transactions?: Transaction[];
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
}

@Component({
  selector: "app-account-detail",
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container mx-auto p-4">
      <div class="mb-4">
        <a routerLink="/accounts" class="text-blue-500 hover:underline"
          >← Back to Accounts</a
        >
      </div>

      <div *ngIf="account" class="bg-white p-6 rounded-lg shadow-md">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-2xl font-bold">{{ account.name }}</h2>
            <p class="text-gray-600">{{ account.type }}</p>
          </div>
          <div class="text-2xl font-bold">{{ account.balance | currency }}</div>
        </div>

        <div class="mt-6">
          <h3 class="text-xl font-semibold mb-4">Recent Transactions</h3>
          <div class="divide-y">
            <div *ngFor="let transaction of account.transactions" class="py-3">
              <div class="flex justify-between">
                <div>
                  <p class="font-medium">{{ transaction.description }}</p>
                  <p class="text-sm text-gray-600">{{ transaction.date }}</p>
                </div>
                <div
                  [ngClass]="
                    transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                  "
                >
                  {{ transaction.amount | currency }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded-md"
            (click)="showAccountDetails()"
          >
            Show Details in Modal
          </button>
        </div>
      </div>

      <div *ngIf="!account" class="text-center p-8">
        <p>Account not found</p>
      </div>
    </div>
  `,
})
export class AccountDetailComponent implements OnInit {
  accountId: string | null = null;
  account: Account | null = null;

  // Sample account data
  private accounts: Account[] = [
    {
      id: "1",
      name: "Checking Account",
      balance: 2543.33,
      type: "Checking",
      transactions: [
        {
          id: "t1",
          date: "2023-03-15",
          description: "Grocery Store",
          amount: -78.52,
        },
        {
          id: "t2",
          date: "2023-03-14",
          description: "Salary Deposit",
          amount: 2500.0,
        },
        {
          id: "t3",
          date: "2023-03-12",
          description: "Restaurant",
          amount: -45.8,
        },
        {
          id: "t4",
          date: "2023-03-10",
          description: "Gas Station",
          amount: -35.25,
        },
        {
          id: "t5",
          date: "2023-03-08",
          description: "Online Shopping",
          amount: -120.99,
        },
      ],
    },
    {
      id: "2",
      name: "Savings Account",
      balance: 15750.0,
      type: "Savings",
      transactions: [
        {
          id: "t1",
          date: "2023-03-01",
          description: "Transfer from Checking",
          amount: 500.0,
        },
        {
          id: "t2",
          date: "2023-02-01",
          description: "Interest Payment",
          amount: 12.5,
        },
        {
          id: "t3",
          date: "2023-01-15",
          description: "Transfer from Checking",
          amount: 500.0,
        },
        {
          id: "t4",
          date: "2023-01-01",
          description: "Interest Payment",
          amount: 12.35,
        },
      ],
    },
    {
      id: "3",
      name: "Investment Portfolio",
      balance: 34120.5,
      type: "Investment",
      transactions: [
        {
          id: "t1",
          date: "2023-03-10",
          description: "Stock Purchase - AAPL",
          amount: -1500.0,
        },
        {
          id: "t2",
          date: "2023-02-28",
          description: "Dividend Payment",
          amount: 320.45,
        },
        {
          id: "t3",
          date: "2023-02-15",
          description: "Stock Sale - MSFT",
          amount: 1250.0,
        },
      ],
    },
    {
      id: "4",
      name: "Retirement Fund",
      balance: 78650.75,
      type: "Retirement",
      transactions: [
        {
          id: "t1",
          date: "2023-03-15",
          description: "Contribution",
          amount: 500.0,
        },
        {
          id: "t2",
          date: "2023-02-15",
          description: "Contribution",
          amount: 500.0,
        },
        {
          id: "t3",
          date: "2023-01-15",
          description: "Contribution",
          amount: 500.0,
        },
      ],
    },
    {
      id: "5",
      name: "Emergency Fund",
      balance: 5000.0,
      type: "Savings",
      transactions: [
        {
          id: "t1",
          date: "2023-01-10",
          description: "Initial Deposit",
          amount: 5000.0,
        },
      ],
    },
    {
      id: "6",
      name: "Vacation Fund",
      balance: 2800.0,
      type: "Savings",
      transactions: [
        {
          id: "t1",
          date: "2023-03-01",
          description: "Monthly Contribution",
          amount: 200.0,
        },
        {
          id: "t2",
          date: "2023-02-01",
          description: "Monthly Contribution",
          amount: 200.0,
        },
        {
          id: "t3",
          date: "2023-01-01",
          description: "Monthly Contribution",
          amount: 200.0,
        },
      ],
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private microAppService: MicroAppService
  ) {}

  ngOnInit(): void {
    this.accountId = this.route.snapshot.paramMap.get("id");
    if (this.accountId) {
      this.account =
        this.accounts.find((acc) => acc.id === this.accountId) || null;
    }
  }

  showAccountDetails(): void {
    if (this.account) {
      const detailsText = `Account Type: ${this.account.type}
Current Balance: $${this.account.balance.toFixed(2)}
Account ID: ${this.account.id}`;

      this.microAppService.showModal(
        `${this.account.name} Details`,
        detailsText
      );
    }
  }
}
