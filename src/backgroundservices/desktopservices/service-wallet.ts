import { SubscribableEvent } from '../subscribable-event';

export interface Transaction {
  timestamp: number;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
}

export class WalletService {
  private balance: number = 0;
  private transactions: Transaction[] = [];
  private readonly MAX_TRANSACTION_HISTORY = 50;

  public readonly onBalanceChanged: SubscribableEvent<[number]>;
  public readonly onTransactionAdded: SubscribableEvent<[Transaction]>;

  constructor() {
    this.onBalanceChanged = new SubscribableEvent("onBalanceChanged");
    this.onTransactionAdded = new SubscribableEvent("onTransactionAdded");
  }

  public getBalance(): number {
    return this.balance;
  }

  public getRecentTransactions(limit: number = 5): Transaction[] {
    return this.transactions.slice(-limit);
  }

  public addCoins(amount: number, description: string = "Credit"): boolean {
    if (amount <= 0) return false;

    this.balance += amount;
    this.addTransaction({
      timestamp: Date.now(),
      amount,
      type: 'credit',
      description
    });

    return true;
  }

  public deductCoins(amount: number, description: string = "Debit"): boolean {
    if (amount <= 0 || this.balance < amount) return false;

    this.balance -= amount;
    this.addTransaction({
      timestamp: Date.now(),
      amount,
      type: 'debit',
      description
    });

    return true;
  }

  private addTransaction(transaction: Transaction): void {
    this.transactions.push(transaction);
    if (this.transactions.length > this.MAX_TRANSACTION_HISTORY) {
      this.transactions.shift(); // Remove oldest transaction
    }
    
    this.onTransactionAdded.invoke(transaction);
    this.onBalanceChanged.invoke(this.balance);
  }
}