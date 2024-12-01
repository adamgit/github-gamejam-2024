import { SubscribableEvent } from '../subscribable-event';

export class ReputationService {
  private reputation: number = 0; // Default reputation score

  public readonly onReputationChanged: SubscribableEvent<[number]>;

  constructor() {
    this.onReputationChanged = new SubscribableEvent("onReputationChanged");
  }

  public getReputation(): number {
    return this.reputation;
  }

  public alterReputation(amount: number): void {
    console.log(`Altering reputation by: ${amount}, new value will be: ${this.reputation} + ${amount} = ${this.reputation+amount}`);
    this.reputation = Math.max(0, this.reputation + amount);
    this.onReputationChanged.invoke(this.reputation);
  }
}