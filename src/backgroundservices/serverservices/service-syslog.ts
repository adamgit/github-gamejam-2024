// services/service-syslog.ts
import { SubscribableEvent } from '../subscribable-event';

export interface SystemEvent {
  timestamp: number;
  type: string;
  details?: any;
}

export class SystemLogService {
  public readonly onSystemEvent: SubscribableEvent<[SystemEvent]>;
  private events: SystemEvent[] = [];

  constructor() {
    this.onSystemEvent = new SubscribableEvent("onSystemEvent");
  }

  public logEvent(type: string, details?: any): void {
    const event: SystemEvent = {
      timestamp: Date.now(),
      type,
      details
    };
    
    console.log(`[syslogd] Event: ${type} -- ${details}`);
    this.events.push(event);
    this.onSystemEvent.invoke(event);
  }

  public getRecentEvents(limit: number = 10): SystemEvent[] {
    return this.events.slice(-limit);
  }
}